/**
 * User Registration API for Healthcare Management Platform
 * Implements secure user registration with healthcare-specific validation
 * Separate from Auth.js authentication flow
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { randomUUID } from "crypto"

// Enhanced registration schema with healthcare-specific validation
const registerSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .trim(),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters") 
    .max(50, "Last name cannot exceed 50 characters")
    .trim(),
  role: z.enum(["PATIENT", "DOCTOR", "HSP"], {
    errorMap: () => ({ message: "Role must be PATIENT, DOCTOR, or HSP" })
  }).default("PATIENT"),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
    .optional(),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format")
    .optional()
    .refine((date) => {
      if (!date) return true
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 13 && age <= 120 // Healthcare platform age limits
    }, "Age must be between 13 and 120 years"),
  // Healthcare-specific fields (optional during registration)
  medicalLicenseNumber: z.string().optional(),
  specialtyId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Rate limiting helper (simple in-memory implementation)
const registrationAttempts = new Map<string, { count: number, lastAttempt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = registrationAttempts.get(ip)
  
  if (!attempts || now - attempts.lastAttempt > 60000) { // Reset after 1 minute
    registrationAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  if (attempts.count >= 5) { // Max 5 attempts per minute
    return false
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          error: "Too many registration attempts", 
          message: "Please wait before trying again" 
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = registerSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName, role, phone, dateOfBirth, medicalLicenseNumber, specialtyId, organizationId } = validation.data
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email address" },
        { status: 409 }
      )
    }

    // For DOCTOR registrations, validate medical license if provided
    if (role === "DOCTOR" && medicalLicenseNumber) {
      const existingDoctor = await prisma.doctor.findFirst({
        where: { medical_license_number: medicalLicenseNumber }
      })
      
      if (existingDoctor) {
        return NextResponse.json(
          { error: "Medical license number already registered" },
          { status: 409 }
        )
      }
    }

    // Hash password with high cost factor for security
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Generate full name
    const fullName = `${firstName} ${lastName}`
    
    try {
      // Create user within a transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // Create base user record with Auth.js v5 compatible fields
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash: passwordHash,
            
            // ✅ Auth.js v5 required fields
            name: fullName, // Required by Auth.js v5
            image: null, // Profile picture can be set later
            emailVerified: null, // Will be set when email is verified (DateTime)
            
            // ✅ Healthcare-specific fields
            firstName: firstName,
            lastName: lastName,
            fullName: fullName,
            role,
            phone: phone || null,
            date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
            accountStatus: "PENDING_VERIFICATION", // Better default for healthcare
            emailVerifiedLegacy: false, // Legacy field for backward compatibility
            twoFactorEnabled: false, // Default 2FA to disabled
            failedLoginAttempts: 0,
            password_changed_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
            
            // ✅ Healthcare compliance fields
            hipaa_consent_date: null, // Will be set when user accepts HIPAA terms
            terms_accepted_at: null,
            privacy_policy_accepted_at: null,
            
            // ✅ Generate email verification token
            email_verification_token: crypto.randomUUID(), // For email verification flow
            
            // ✅ Default preferences for healthcare
            preferences: {
              privacy: {
                profile_visible: true,
                share_data_for_research: false
              },
              accessibility: {
                large_text: false,
                high_contrast: false
              },
              notifications: {
                sms: false,
                push: true,
                email: true
              }
            }
          }
        })

        // Create role-specific profile data
        let profileData = null

        if (role === "DOCTOR") {
          profileData = await tx.doctor.create({
            data: {
              user_id: newUser.id,
              doctor_id: `DOC-${randomUUID().substring(0, 8).toUpperCase()}`, // Generate unique doctor ID
              medical_license_number: medicalLicenseNumber || null,
              speciality_id: specialtyId || null,
              organization_id: organizationId || null,
              years_of_experience: 0,
              consultation_fee: 0,
              is_accepting_patients: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          })
        } else if (role === "PATIENT") {
          profileData = await tx.patient.create({
            data: {
              user_id: newUser.id,
              patient_id: `PAT-${randomUUID().substring(0, 8).toUpperCase()}`, // Generate unique patient ID  
              medical_record_number: `MRN-${randomUUID().substring(0, 10).toUpperCase()}`,
              blood_type: null,
              height_cm: null,
              weight_kg: null,
              emergency_contact: null,
              created_at: new Date(),
              updated_at: new Date()
            }
          })
        } else if (role === "HSP") {
          profileData = await tx.hsp.create({
            data: {
              user_id: newUser.id,
              hsp_id: `HSP-${randomUUID().substring(0, 8).toUpperCase()}`, // Generate unique HSP ID
              license_number: null,
              certifications: null,
              years_of_experience: 0,
              organization_id: organizationId || null,
              created_at: new Date(),
              updated_at: new Date()
            }
          })
        }

        return { user: newUser, profile: profileData }
      })

      // Return success response with user data (excluding sensitive information)
      return NextResponse.json({
        success: true,
        message: "User registered successfully",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name, // Now using Auth.js v5 compatible field
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          role: result.user.role,
          accountStatus: result.user.account_status,
          profileId: result.profile?.id || null,
          businessId: result.profile?.doctor_id || result.profile?.patient_id || result.profile?.hsp_id || null,
          requiresVerification: role !== "PATIENT", // Doctors and HSPs need verification
          requiresEmailVerification: true,
          requiresHipaaConsent: true,
          emailVerificationToken: result.user.email_verification_token
        },
        nextSteps: {
          emailVerification: "Check your email for verification link",
          ...(role === "DOCTOR" && {
            doctorVerification: "Upload medical license and credentials for verification"
          }),
          ...(role === "HSP" && {
            hspVerification: "Upload certifications and credentials for verification"
          }),
          hipaaConsent: "Review and accept HIPAA privacy policies"
        }
      }, { status: 201 })

    } catch (dbError) {
      console.error("Database error during user registration:", dbError)
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error("Registration error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
