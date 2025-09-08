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

const updateMedicationSchema = z.object({
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  rrRule: z.string().optional().nullable(),
  details: z.any().optional(),
});

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { carePlanId: string, medicationId: string } }
) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.user.role !== "DOCTOR") {
    return createForbiddenResponse("Only doctors can update medications");
  }

  const { carePlanId, medicationId } = params;

  const body = await request.json();
  const validationResult = updateMedicationSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { description, startDate, endDate, rrRule, details } = validationResult.data;

  // Verify care plan exists and the doctor is authorized
  const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      include: { carePlan: true }
  });

  if (!medication || medication.carePlanId !== carePlanId) {
      return createErrorResponse({ message: "Medication not found in this care plan" }, 404);
  }

  if (medication.carePlan.createdByDoctorId !== session.user.profileId) {
      return createForbiddenResponse();
  }


  const updatedMedication = await prisma.medication.update({
    where: { id: medicationId },
    data: {
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : (endDate === null ? null : undefined),
      rrRule,
      details,
    },
  });

  return createSuccessResponse(updatedMedication);
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { carePlanId: string, medicationId: string } }
) => {
    const session = await auth();
    if (!session) {
        return createUnauthorizedResponse();
    }

    if (session.user.role !== "DOCTOR") {
        return createForbiddenResponse("Only doctors can delete medications");
    }

    const { carePlanId, medicationId } = params;

    const medication = await prisma.medication.findUnique({
        where: { id: medicationId },
        include: { carePlan: true }
    });

    if (!medication || medication.carePlanId !== carePlanId) {
        return createErrorResponse({ message: "Medication not found in this care plan" }, 404);
    }

    if (medication.carePlan.createdByDoctorId !== session.user.profileId) {
        return createForbiddenResponse();
    }

    await prisma.medication.delete({
        where: { id: medicationId },
    });

    return new NextResponse(null, { status: 204 });
});
