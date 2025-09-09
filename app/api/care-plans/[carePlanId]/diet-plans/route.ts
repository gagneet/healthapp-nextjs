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

const addDietPlanSchema = z.object({
  dietPlanId: z.string(),
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
    return createForbiddenResponse("Only doctors can add diet plans");
  }

  const { carePlanId } = params;

  const body = await request.json();
  const validationResult = addDietPlanSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { dietPlanId } = validationResult.data;

  // Verify care plan exists and the doctor is authorized
  const carePlan = await prisma.carePlan.findUnique({
    where: { id: carePlanId },
  });

  if (!carePlan) {
    return createErrorResponse(new Error("Care plan not found"));
  }

  if (carePlan.createdByDoctorId !== session.user.profileId) {
    return createForbiddenResponse();
  }

  const dietPlanAssociation = await prisma.carePlanToDietPlan.create({
    data: {
      carePlanId,
      dietPlanId,
      assignedBy: session.user.name || "Doctor",
    },
  });

  return createSuccessResponse(dietPlanAssociation, 201);
});
