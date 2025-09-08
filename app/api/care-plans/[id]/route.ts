import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling,
} from "@/lib/api-response";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  const { id } = params;

  const carePlan = await prisma.carePlan.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
      prescribedMedications: true,
      appointments: true,
      symptoms: true,
      vitalRequirements: true,
      vitals: true,
      diets: {
          include: {
              dietPlan: true,
          }
      },
      workouts: {
            include: {
                workoutPlan: true,
            }
      },
    },
  });

  if (!carePlan) {
    return createErrorResponse({ message: "Care plan not found" }, 404);
  }

  // Basic authorization: only the patient, the creating doctor, or an admin can view
  if (
    session.user.role !== "SYSTEM_ADMIN" &&
    carePlan.patient.userId !== session.user.id &&
    carePlan.createdByDoctorId !== session.user.profileId
  ) {
    return createForbiddenResponse();
  }

  return createSuccessResponse(carePlan);
});
