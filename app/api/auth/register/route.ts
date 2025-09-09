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
  specialtyId: z.number().int().optional(),
  organizationId: z.string().uuid().optional(),
  hspType: z.string().optional().default("GENERAL")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine((data) => {
  if (data.role === 'DOCTOR') {
    return !!data.medicalLicenseNumber;
  }
  return true;
}, {
  message: "Medical license number is required for doctors",
  path: ["medicalLicenseNumber"],
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
        where: { medicalLicenseNumber: medicalLicenseNumber }
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
            name: fullName,
            image: null,
            emailVerified: null,
            firstName: firstName,
            lastName: lastName,
            fullName: fullName,
            role,
            phone: phone || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            accountStatus: "PENDING_VERIFICATION",
            twoFactorEnabled: false,
            failedLoginAttempts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            hipaaConsentDate: null,
            termsAcceptedAt: null,
            privacyPolicyAcceptedAt: null,
            emailVerificationToken: randomUUID(),
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
              userId: newUser.id,
              doctorId: `DOC-${randomUUID().substring(0, 8).toUpperCase()}`,
              medicalLicenseNumber: medicalLicenseNumber!,
              specialtyId: specialtyId,
              organizationId: organizationId,
              yearsOfExperience: 0,
              consultationFee: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        } else if (role === "PATIENT") {
          profileData = await tx.patient.create({
            data: {
              userId: newUser.id,
              patientId: `PAT-${randomUUID().substring(0, 8).toUpperCase()}`,
              medicalRecordNumber: `MRN-${randomUUID().substring(0, 10).toUpperCase()}`,
              bloodType: null,
              heightCm: null,
              weightKg: null,
              emergencyContacts: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        } else if (role === "HSP") {
          profileData = await tx.hsp.create({
            data: {
              userId: newUser.id,
              hspId: `HSP-${randomUUID().substring(0, 8).toUpperCase()}`,
              hspType: validation.data.hspType,
              licenseNumber: null,
              certifications: [],
              yearsOfExperience: 0,
              organizationId: organizationId || null,
              createdAt: new Date(),
              updatedAt: new Date()
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
          name: result.user.name,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          accountStatus: result.user.accountStatus,
          profileId: result.profile?.id || null,
          businessId: (result.profile as any)?.doctorId || (result.profile as any)?.patientId || (result.profile as any)?.hspId || null,
          requiresVerification: role !== "PATIENT", // Doctors and HSPs need verification
          requiresEmailVerification: true,
          requiresHipaaConsent: true,
          emailVerificationToken: result.user.emailVerificationToken
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
