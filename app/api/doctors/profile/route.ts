/**
 * Doctor Profile Management API Route
 * Handles doctor profile CRUD operations with healthcare business logic compliance
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling
} from "@/lib/api-response"
import { UpdateDoctorSchema } from "@/lib/validations/healthcare"

/**
 * GET /api/doctors/profile
 * Get doctor profile information
 * Business Logic: Doctors can view their own profile, admins can view any doctor profile
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const doctorId = searchParams.get('doctorId')

  try {
    let targetDoctorId: string

    // Business Logic: Determine which doctor profile to fetch
    if (doctorId) {
      // Admin requesting specific doctor's profile
      if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
        return createForbiddenResponse("Only administrators can view other doctor profiles")
      }
      targetDoctorId = doctorId
    } else {
      // Doctor requesting their own profile
      if (session.user.role !== 'DOCTOR') {
        return createForbiddenResponse("Only doctors can access doctor profiles")
      }
      if (!session.user.profileId) {
        return createErrorResponse(new Error("Doctor profile not found"))
      }
      targetDoctorId = session.user.profileId
    }

    // Fetch doctor profile with comprehensive data
    const doctor = await prisma.doctors.findUnique({
      where: { id: targetDoctorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            middle_name: true,
            phone: true,
            date_of_birth: true,
            gender: true,
            account_status: true,
            profile_picture_url: true,
            timezone: true,
            locale: true,
            created_at: true,
            updated_at: true,
            last_login_at: true
          }
        },
        speciality: {
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
            contact_info: true
          }
        },
        // Include statistics for dashboard
        patients: {
          select: {
            id: true
          }
        },
        appointments: {
          where: {
            scheduled_date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
            }
          },
          select: {
            id: true,
            status: true,
            appointment_type: true
          }
        }
      }
    })

    if (!doctor) {
      return createErrorResponse(new Error("Doctor profile not found"), 404)
    }

    // Calculate statistics
    const totalPatients = doctor.patients.length
    const recentAppointments = doctor.appointments.length
    const completedAppointments = doctor.appointments.filter(apt => apt.status === 'COMPLETED').length
    const appointmentCompletionRate = recentAppointments > 0 
      ? Math.round((completedAppointments / recentAppointments) * 100) 
      : 0

    // Format response data
    const profileData = {
      id: doctor.id,
      doctorId: doctor.doctor_id,
      user: {
        id: doctor.user.id,
        email: doctor.user.email,
        name: `${doctor.user.first_name} ${doctor.user.last_name}`.trim(),
        firstName: doctor.user.first_name,
        lastName: doctor.user.last_name,
        middleName: doctor.user.middle_name,
        phone: doctor.user.phone,
        dateOfBirth: doctor.user.date_of_birth,
        gender: doctor.user.gender,
        accountStatus: doctor.user.account_status,
        profilePictureUrl: doctor.user.profile_picture_url,
        timezone: doctor.user.timezone,
        locale: doctor.user.locale,
        lastLoginAt: doctor.user.last_login_at
      },
      professional: {
        medicalLicenseNumber: doctor.medical_license_number,
        yearsOfExperience: doctor.years_of_experience,
        consultationFee: doctor.consultation_fee,
        speciality: doctor.speciality ? {
          id: doctor.speciality.id,
          name: doctor.speciality.name,
          description: doctor.speciality.description
        } : null,
        credentials: doctor.credentials || [],
        boardCertifications: doctor.board_certifications || [],
        clinicAddress: doctor.clinic_address,
        organization: doctor.organization ? {
          id: doctor.organization.id,
          name: doctor.organization.name,
          type: doctor.organization.type,
          contactInfo: doctor.organization.contact_info
        } : null
      },
      statistics: {
        totalPatients,
        recentAppointments,
        completedAppointments,
        appointmentCompletionRate,
        accountCreated: doctor.created_at,
        lastUpdated: doctor.updated_at
      },
      settings: {
        notificationPreferences: doctor.notification_preferences || {},
        availability: doctor.availability || {},
        consultationSettings: {
          virtualConsultationsEnabled: doctor.virtual_consultations_enabled || false,
          acceptNewPatients: doctor.accept_new_patients !== false
        }
      }
    }

    return createSuccessResponse(profileData)
  } catch (error) {
    console.error("Failed to fetch doctor profile:", error)
    throw error
  }
})

/**
 * PUT /api/doctors/profile
 * Update doctor profile information
 * Business Logic: Doctors can update their own profile, admins can update any doctor profile
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  const body = await request.json()
  const { doctorId, ...updateData } = body

  // Validate update data
  const validationResult = UpdateDoctorSchema.safeParse(updateData)
  if (!validationResult.success) {
    return createErrorResponse(validationResult.error)
  }

  try {
    let targetDoctorId: string

    // Business Logic: Determine which doctor profile to update
    if (doctorId) {
      // Admin updating specific doctor's profile
      if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
        return createForbiddenResponse("Only administrators can update other doctor profiles")
      }
      targetDoctorId = doctorId
    } else {
      // Doctor updating their own profile
      if (session.user.role !== 'DOCTOR') {
        return createForbiddenResponse("Only doctors can update doctor profiles")
      }
      if (!session.user.profileId) {
        return createErrorResponse(new Error("Doctor profile not found"))
      }
      targetDoctorId = session.user.profileId
    }

    const validatedData = validationResult.data

    // Update doctor and user records in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user information
      const userUpdateData: any = {}
      if (validatedData.firstName) userUpdateData.first_name = validatedData.firstName
      if (validatedData.lastName) userUpdateData.last_name = validatedData.lastName
      if (validatedData.phone) userUpdateData.phone = validatedData.phone
      
      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updated_at = new Date()
        
        const doctor = await tx.doctors.findUnique({
          where: { id: targetDoctorId },
          select: { user_id: true }
        })

        if (doctor) {
          await tx.user.update({
            where: { id: doctor.user_id },
            data: userUpdateData
          })
        }
      }

      // Update doctor-specific information
      const doctorUpdateData: any = {}
      if (validatedData.medicalLicenseNumber) doctorUpdateData.medical_license_number = validatedData.medicalLicenseNumber
      if (validatedData.specialityId) doctorUpdateData.speciality_id = validatedData.specialityId
      if (validatedData.yearsOfExperience !== undefined) doctorUpdateData.years_of_experience = validatedData.yearsOfExperience
      if (validatedData.consultationFee !== undefined) doctorUpdateData.consultation_fee = validatedData.consultationFee
      if (validatedData.clinicAddress) doctorUpdateData.clinic_address = validatedData.clinicAddress
      if (validatedData.organizationId) doctorUpdateData.organization_id = validatedData.organizationId
      if (validatedData.credentials) doctorUpdateData.credentials = validatedData.credentials
      if (validatedData.boardCertifications) doctorUpdateData.board_certifications = validatedData.boardCertifications
      
      if (Object.keys(doctorUpdateData).length > 0) {
        doctorUpdateData.updated_at = new Date()
        
        const updatedDoctor = await tx.doctors.update({
          where: { id: targetDoctorId },
          data: doctorUpdateData,
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                phone: true,
                updated_at: true
              }
            }
          }
        })

        return updatedDoctor
      }

      return await tx.doctors.findUnique({
        where: { id: targetDoctorId },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              phone: true,
              updated_at: true
            }
          }
        }
      })
    })

    if (!result) {
      return createErrorResponse(new Error("Failed to update doctor profile"))
    }

    // Format response
    const responseData = {
      id: result.id,
      doctorId: result.doctor_id,
      message: "Doctor profile updated successfully",
      updatedAt: result.updated_at
    }

    return createSuccessResponse(responseData)
  } catch (error) {
    console.error("Failed to update doctor profile:", error)
    throw error
  }
})