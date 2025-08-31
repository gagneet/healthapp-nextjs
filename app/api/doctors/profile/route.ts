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
    // Determine target doctor (only self since role is already DOCTOR)
    const targetUserId = session.user.id!

    // Fetch basic doctor information
    const doctor = await prisma.doctor.findUnique({
      where: { userId: targetUserId },
      include: {
        user: true,
        specialty: true,
        organization: true,
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
            id: true,
            status: true,
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
    const completedAppointments = doctor.appointments.filter(a => a.status === 'COMPLETED').length
    const appointmentCompletionRate = recentAppointments > 0 
      ? Math.round((completedAppointments / recentAppointments) * 100) 
      : 0

    // Helper to get name with fallbacks
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
        name: userName,
        image: userImage,
        emailVerified: userEmailVerified,
        firstName: doctor.user.firstName,
        lastName: doctor.user.lastName,
        fullName: doctor.user.fullName,
        profilePictureUrl: doctor.user.profilePictureUrl,
        emailVerifiedLegacy: doctor.user.emailVerifiedLegacy,
        middleName: doctor.user.middleName,
        phone: doctor.user.phone,
        dateOfBirth: doctor.user.dateOfBirth,
        gender: doctor.user.gender,
        accountStatus: doctor.user.accountStatus,
        timezone: doctor.user.timezone,
        locale: doctor.user.locale,
        lastLoginAt: doctor.user.lastLoginAt
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
        notification_preferences: doctor.notificationPreferences,
        availability_schedule: doctor.availabilitySchedule,
      },
      qualification_details: doctor.qualificationDetails,
      bio: doctor.practiceName,
      availability_schedule: doctor.availabilitySchedule,
      practice_address: doctor.practiceAddress,
      board_certifications: doctor.boardCertifications,
      languages_spoken: doctor.languagesSpoken,
      profilePictureUrl: doctor.profilePictureUrl,
      average_rating: doctor.averageRating,
      total_patients: totalPatients,
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

  if (session.user.role !== 'DOCTOR') {
    return createForbiddenResponse("Only doctors can update doctor profiles")
  }

  try {
    const body = await request.json();

    const allowedDoctorFields = [
      "practiceName", "practiceAddress", "languagesSpoken", "consultationFee",
      "yearsOfExperience", "medicalLicenseNumber", "notificationPreferences",
      "availabilitySchedule", "bio", "board_certifications"
    ];
    const allowedUserFields = ["phone"];

    const doctorUpdateData: any = {};
    const userUpdateData: any = {};

    // This logic handles both flat and nested properties from the frontend
    const processObject = (obj: any, prefix = '') => {
        for (const key in obj) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                processObject(obj[key], newPrefix);
            } else {
                if (newPrefix.startsWith('user.')) {
                    const userKey = newPrefix.substring(5);
                    if (allowedUserFields.includes(userKey)) {
                        userUpdateData[userKey] = obj[key];
                    }
                } else if (newPrefix.startsWith('professional.')) {
                    const profKey = newPrefix.substring(13);
                     if (allowedDoctorFields.includes(profKey)) {
                        doctorUpdateData[profKey] = obj[key];
                    }
                } else {
                    if (allowedDoctorFields.includes(key)) {
                        doctorUpdateData[key] = obj[key];
                    }
                }
            }
        }
    }

    processObject(body);

    if (Object.keys(doctorUpdateData).length === 0 && Object.keys(userUpdateData).length === 0) {
      return createErrorResponse(new Error("No valid fields provided for update"), 400);
    }

    const updatePayload: any = { ...doctorUpdateData };
    if (Object.keys(userUpdateData).length > 0) {
        updatePayload.user = {
            update: userUpdateData
        }
    }

    const updatedDoctor = await prisma.doctor.update({
        where: { userId: session.user.id },
        data: updatePayload,
    });
    return createSuccessResponse(updatedDoctor, "Profile updated successfully");
  } catch (error) {
    console.error("Failed to update doctor profile:", error)
    throw error
  }
})
