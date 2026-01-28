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


export const dynamic = 'force-dynamic';

const createVitalRequirementSchema = z.object({
  vitalTypeId: z.string().uuid(),
  frequency: z.string(),
  preferredTime: z.string().optional(),
  isCritical: z.boolean().optional(),
  monitoringNotes: z.string().optional(),
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
    return createForbiddenResponse("Only doctors can add vital requirements");
  }

  const { carePlanId } = params;

  const body = await request.json();
  const validationResult = createVitalRequirementSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { vitalTypeId, frequency, preferredTime, isCritical, monitoringNotes } = validationResult.data;

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

  const vitalType = await prisma.vitalType.findUnique({
    where: { id: vitalTypeId },
  });
  if (!vitalType) {
    return createErrorResponse(new Error("Vital type not found"));
  }

  const vitalRequirement = await prisma.vitalRequirement.create({
    data: {
      id: crypto.randomUUID(),
      carePlanId,
      vitalTypeId,
      frequency,
      // Prisma handles the Time type as a DateTime, so we use a dummy date.
      preferredTime: preferredTime ? new Date(`1970-01-01T${preferredTime}Z`) : null,
      isCritical,
      monitoringNotes,
      createdAt: new Date(),
    },
  });

  return createSuccessResponse(vitalRequirement, 201);
});
