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

const createSymptomSchema = z.object({
  symptomName: z.string(),
  severity: z.number().min(1).max(10),
  description: z.string().optional(),
  onsetTime: z.string().datetime(),
});

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { carePlanId: string } }
) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  const { carePlanId } = params;

  // A doctor or the patient can add a symptom
  const isDoctor = session.user.role === "DOCTOR";
  const isPatient = session.user.role === "PATIENT";

  if (!isDoctor && !isPatient) {
      return createForbiddenResponse("You are not authorized to add a symptom");
  }

  const body = await request.json();
  const validationResult = createSymptomSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { symptomName, severity, description, onsetTime } = validationResult.data;

  // Verify care plan exists
  const carePlan = await prisma.carePlan.findUnique({
    where: { id: carePlanId },
  });

  if (!carePlan) {
    return createErrorResponse(new Error("Care plan not found"));
  }

  // Authorization check
  if (isDoctor && carePlan.createdByDoctorId !== session.user.profileId) {
    return createForbiddenResponse();
  }
  if (isPatient && carePlan.patientId !== session.user.profileId) {
      return createForbiddenResponse();
  }

  const symptom = await prisma.symptom.create({
    data: {
      carePlanId,
      patientId: carePlan.patientId,
      symptomName,
      severity,
      description,
      onsetTime: new Date(onsetTime),
      recordedAt: new Date(),
    },
  });

  return createSuccessResponse(symptom, 201);
});
