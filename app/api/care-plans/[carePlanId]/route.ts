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


export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { carePlanId: string } }
) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  const { carePlanId } = params;

  const carePlan = await prisma.carePlan.findUnique({
    where: { id: carePlanId },
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
      prescribedMedications: {
        include: {
          medicine: true,
        },
      },
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
    return createErrorResponse(new Error("Care plan not found"));
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
