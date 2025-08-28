/**
 * Doctor Profile API Route
 * Manages doctor profile operations with comprehensive healthcare data
 * Business Logic: Only doctors can access their own profile
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling
} from "@/lib/api-response"

/**
 * GET /api/doctors/profile
 * Retrieve comprehensive doctor profile with statistics and preferences
 * Business Logic: Doctor can only access their own profile
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors can access doctor profile
  if (session.user.role !== 'DOCTOR') {
    return createForbiddenResponse("Only doctors can access doctor profiles")
  }

  try {
    const { searchParams } = new URL(request.url)
    const doctorIdParam = searchParams.get('doctorId')
    
    // Determine target doctor (only self since role is already DOCTOR)
    const targetDoctorId = session.user.profileId!

    // Fetch basic doctor information
    const doctor = await prisma.doctor.findUnique({
      where: { id: targetDoctorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            // ✅ Auth.js v5 fields
            name: true,
            image: true,
            emailVerified: true,
            // ✅ Legacy fields for backward compatibility
            firstName: true,
            lastName: true,
            fullName: true,
            profilePictureUrl: true,
            emailVerifiedLegacy: true,
            // ✅ Additional fields
            middleName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            accountStatus: true,
            timezone: true,
            locale: true,
            createdAt: true,
            updatedAt: true,
            
          }
        },
        specialty: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            contactInfo: true
          }
        },
        patients: {
          select: {
            id: true
          }
        },
        appointments: {
          where: {
            startTime: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
            }
          },
          select: {
            id: true
          }
        }
      }
    })

    if (!doctor) {
      return createErrorResponse(new Error("Doctor profile not found"), 404)
    }

    // Calculate basic statistics
    const totalPatients = doctor.patients.length
    const recentAppointments = doctor.appointments.length
    const completedAppointments = 0 // Status field not available - placeholder
    const appointmentCompletionRate = recentAppointments > 0 
      ? Math.round((completedAppointments / recentAppointments) * 100) 
      : 0

    // ✅ Helper to get name with fallbacks
    const userName = doctor.user.name ||
                    doctor.user.fullName ||
                    `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim()

    const userImage = doctor.user.image ||
                     doctor.user.profilePictureUrl

    const userEmailVerified = doctor.user.emailVerified ||
                             (doctor.user.emailVerifiedLegacy ? new Date() : null)

    // Format comprehensive response with dual field support
    const profileData = {
      id: doctor.id,
      doctorId: doctor.doctorId,
      user: {
        id: doctor.user.id,
        email: doctor.user.email,
        
        // ✅ Auth.js v5 standard fields (preferred)
        name: userName,
        image: userImage,
        emailVerified: userEmailVerified,
        
        // ✅ Legacy fields (for backward compatibility)
        firstName: doctor.user.firstName,
        lastName: doctor.user.lastName,
        fullName: doctor.user.fullName,
        profilePictureUrl: doctor.user.profilePictureUrl,
        emailVerifiedLegacy: doctor.user.emailVerifiedLegacy,
        
        // ✅ Additional healthcare fields
        middleName: doctor.user.middleName,
        phone: doctor.user.phone,
        dateOfBirth: doctor.user.dateOfBirth,
        gender: doctor.user.gender,
        accountStatus: doctor.user.accountStatus,
        timezone: doctor.user.timezone,
        locale: doctor.user.locale,
        lastLoginAt: doctor.user.createdAt
      },
      professional: {
        medicalLicenseNumber: doctor.medicalLicenseNumber,
        yearsOfExperience: doctor.yearsOfExperience,
        consultationFee: doctor.consultationFee,
        specialty: doctor.specialty ? {
          id: doctor.specialty.id,
          name: doctor.specialty.name,
          description: doctor.specialty.description
        } : null,
        organization: doctor.organization ? {
          id: doctor.organization.id,
          name: doctor.organization.name,
          type: doctor.organization.type,
          contactInfo: doctor.organization.contactInfo
        } : null
      },
      statistics: {
        totalPatients,
        recentAppointments,
        appointmentCompletionRate,
        accountCreated: doctor.createdAt,
        lastUpdated: doctor.updatedAt
      },
      settings: {
        // Placeholder - settings fields need to be resolved with proper schema
      }
    }

    return createSuccessResponse(profileData);
  } catch (error) {
    console.error("Failed to fetch doctor profile:", error)
    throw error
  }
})

/**
 * PUT /api/doctors/profile
 * Update doctor profile information
 * Business Logic: Doctor can only update their own profile
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only doctors can update doctor profiles  
  if (session.user.role !== 'DOCTOR') {
    return createForbiddenResponse("Only doctors can update doctor profiles")
  }

  try {
    // Stub implementation - field name issues need to be resolved with proper schema
    return NextResponse.json({
      status: false,
      statusCode: 501,
      payload: { error: { status: 'not_implemented', message: 'Profile updates not yet implemented' } }
    }, { status: 501 });
  } catch (error) {
    console.error("Failed to update doctor profile:", error)
    throw error
  }
})
