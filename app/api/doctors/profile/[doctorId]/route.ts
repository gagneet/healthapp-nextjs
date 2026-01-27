/**
 * Doctor Profile API Route by Doctor ID
 * Gets doctor profile using the doctor ID (business ID)
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
 * GET /api/doctors/profile/[doctorId]
 * Retrieve doctor profile by doctor ID
 * Business Logic: Only allow if the user is requesting their own profile or has admin access
 */

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) => {
  const session = await auth()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  const { doctorId } = params;

  if (!doctorId || typeof doctorId !== 'string') {
    return createErrorResponse(new Error('Invalid doctor ID format'), 400);
  }

  // Only allow access to own profile for doctors
  if (session.user.role === 'DOCTOR' && session.user.businessId !== doctorId) {
    return createErrorResponse(new Error("Access denied"), 403)
  }

  console.log("Doctor Profile Doctor ID: ", doctorId);

  try {
    // Fetch doctor by doctor ID
    const doctor = await prisma.doctor.findUnique({
      where: { doctorId },
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

    console.log("Doctor Profile ID fetched: ", doctor ? doctor.id : "Not Found");

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
