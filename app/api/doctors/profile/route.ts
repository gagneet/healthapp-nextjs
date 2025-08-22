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
    const doctorIdParam = searchParams.get('doctor_id')
    
    // Determine target doctor (only self since role is already DOCTOR)
    const targetDoctorId = session.user.profileId!

    // Fetch basic doctor information
    const doctor = await prisma.doctor.findUnique({
      where: { id: targetDoctorId },
      include: {
        users_doctors_user_idTousers: {
          select: {
            id: true,
            email: true,
            // ✅ Auth.js v5 fields
            name: true,
            image: true,
            emailVerified: true,
            // ✅ Legacy fields for backward compatibility
            first_name: true,
            last_name: true,
            full_name: true,
            profile_picture_url: true,
            email_verified: true,
            // ✅ Additional fields
            middle_name: true,
            phone: true,
            date_of_birth: true,
            gender: true,
            account_status: true,
            timezone: true,
            locale: true,
            created_at: true,
            updated_at: true,
            
          }
        },
        specialities: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        organizations: {
          select: {
            id: true,
            name: true,
            type: true,
            contact_info: true
          }
        },
        patients: {
          select: {
            id: true
          }
        },
        appointments: {
          where: {
            start_time: {
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
    const userName = doctor.users_doctors_user_idTousers.name || 
                    doctor.users_doctors_user_idTousers.full_name ||
                    `${doctor.users_doctors_user_idTousers.first_name || ''} ${doctor.users_doctors_user_idTousers.last_name || ''}`.trim()

    const userImage = doctor.users_doctors_user_idTousers.image || 
                     doctor.users_doctors_user_idTousers.profile_picture_url

    const userEmailVerified = doctor.users_doctors_user_idTousers.emailVerified || 
                             (doctor.users_doctors_user_idTousers.email_verified ? new Date() : null)

    // Format comprehensive response with dual field support
    const profileData = {
      id: doctor.id,
      doctorId: doctor.doctor_id,
      user: {
        id: doctor.users_doctors_user_idTousers.id,
        email: doctor.users_doctors_user_idTousers.email,
        
        // ✅ Auth.js v5 standard fields (preferred)
        name: userName,
        image: userImage,
        emailVerified: userEmailVerified,
        
        // ✅ Legacy fields (for backward compatibility)
        firstName: doctor.users_doctors_user_idTousers.first_name,
        lastName: doctor.users_doctors_user_idTousers.last_name,
        fullName: doctor.users_doctors_user_idTousers.full_name,
        profilePictureUrl: doctor.users_doctors_user_idTousers.profile_picture_url,
        emailVerifiedLegacy: doctor.users_doctors_user_idTousers.email_verified,
        
        // ✅ Additional healthcare fields
        middleName: doctor.users_doctors_user_idTousers.middle_name,
        phone: doctor.users_doctors_user_idTousers.phone,
        dateOfBirth: doctor.users_doctors_user_idTousers.date_of_birth,
        gender: doctor.users_doctors_user_idTousers.gender,
        accountStatus: doctor.users_doctors_user_idTousers.account_status,
        timezone: doctor.users_doctors_user_idTousers.timezone,
        locale: doctor.users_doctors_user_idTousers.locale,
        lastLoginAt: doctor.users_doctors_user_idTousers.created_at
      },
      professional: {
        medicalLicenseNumber: doctor.medical_license_number,
        yearsOfExperience: doctor.years_of_experience,
        consultationFee: doctor.consultation_fee,
        speciality: doctor.specialities ? {
          id: doctor.specialities.id,
          name: doctor.specialities.name,
          description: doctor.specialities.description
        } : null,
        organization: doctor.organizations ? {
          id: doctor.organizations.id,
          name: doctor.organizations.name,
          type: doctor.organizations.type,
          contactInfo: doctor.organizations.contact_info
        } : null
      },
      statistics: {
        totalPatients,
        recentAppointments,
        appointmentCompletionRate,
        accountCreated: doctor.created_at,
        lastUpdated: doctor.updated_at
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
