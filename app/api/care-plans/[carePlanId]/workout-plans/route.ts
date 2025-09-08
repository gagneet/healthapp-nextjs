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
import { z } from "zod";

const addWorkoutPlanSchema = z.object({
  workoutPlanId: z.string(),
});

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { carePlanId: string } }
) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.user.role !== "DOCTOR") {
    return createForbiddenResponse("Only doctors can add workout plans");
  }

  const { carePlanId } = params;

  const body = await request.json();
  const validationResult = addWorkoutPlanSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { workoutPlanId } = validationResult.data;

  // Verify care plan exists and the doctor is authorized
  const carePlan = await prisma.carePlan.findUnique({
    where: { id: carePlanId },
  });

  if (!carePlan) {
    return createErrorResponse({ message: "Care plan not found" }, 404);
  }

  if (carePlan.createdByDoctorId !== session.user.profileId) {
    return createForbiddenResponse();
  }

  const workoutPlanAssociation = await prisma.carePlanToWorkoutPlan.create({
    data: {
      carePlanId,
      workoutPlanId,
      assignedBy: session.user.name || "Doctor",
    },
  });

  return createSuccessResponse(workoutPlanAssociation, 201);
});
