/**
 * Doctor Profile API Route by User ID
 * Gets doctor profile using the user ID (for internal lookups)
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createUnauthorizedResponse,
  withErrorHandling
} from "@/lib/api-response"

/**
 * GET /api/doctors/profile/[userId]
 * Retrieve doctor profile by user ID
 * Business Logic: Only allow if the user is requesting their own profile or has admin access
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { userId: string } }
) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  const { userId } = params

  // Only allow access to own profile for doctors
  if (session.user.role === 'DOCTOR' && session.user.id !== userId) {
    return createErrorResponse(new Error("Access denied"), 403)
  }

  try {
    // Fetch doctor by user ID
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true
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
            type: true
          }
        }
      }
    })

    if (!doctor) {
      return createErrorResponse(new Error("Doctor profile not found"), 404)
    }

    // Format response
    const profileData = {
      id: doctor.id,
      doctorId: doctor.doctorId,
      user: doctor.user,
      professional: {
        medicalLicenseNumber: doctor.medicalLicenseNumber,
        yearsOfExperience: doctor.yearsOfExperience,
        consultationFee: doctor.consultationFee,
        specialty: doctor.specialty,
        organization: doctor.organization,
        biography: doctor.biography,
        practiceName: doctor.practiceName,
        boardCertifications: doctor.boardCertifications,
      },
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt
    }

    return createSuccessResponse({ doctor: profileData });
  } catch (error) {
    console.error("Failed to fetch doctor profile:", error)
    throw error
  }
})