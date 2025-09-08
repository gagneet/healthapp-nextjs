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

const createMedicationSchema = z.object({
  medicineId: z.string().uuid(),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  rrRule: z.string().optional(), // For recurrence rule
  details: z.any().optional(),
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
    return createForbiddenResponse("Only doctors can add medications");
  }

  const { carePlanId } = params;

  const body = await request.json();
  const validationResult = createMedicationSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { medicineId, description, startDate, endDate, rrRule, details } = validationResult.data;

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

  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
  });
  if (!medicine) {
    return createErrorResponse({ message: "Medicine not found" }, 404);
  }

  const medication = await prisma.medication.create({
    data: {
      carePlan: {
        connect: { id: carePlanId },
      },
      medicine: {
        connect: { id: medicineId },
      },
      participantId: carePlan.patientId, // Assuming the patient is the participant
      organizerId: session.user.profileId, // The doctor is the organizer
      organizerType: 'DOCTOR',
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      rrRule,
      details,
    },
  });

  return createSuccessResponse(medication, 201);
});
