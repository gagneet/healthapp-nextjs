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

const createVitalReadingSchema = z.object({
  vitalTypeId: z.string().uuid(),
  value: z.number(),
  unit: z.string().optional(),
  readingTime: z.string().datetime(),
  notes: z.string().optional(),
});

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { patientId: string } }
) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  // A doctor can add a vital reading for their patient, or a patient can add their own
  const { patientId } = params;

  const body = await request.json();
  const validationResult = createVitalReadingSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { vitalTypeId, value, unit, readingTime, notes } = validationResult.data;

  // Authorization check
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    return createErrorResponse({ message: "Patient not found" }, 404);
  }

  const isDoctor = session.user.role === "DOCTOR";
  const isPatient = session.user.role === "PATIENT" && session.user.profileId === patientId;

  if (!isDoctor && !isPatient) {
      return createForbiddenResponse("You are not authorized to add a vital reading for this patient");
  }

  if (isDoctor) {
      const doctor = await prisma.doctor.findUnique({
          where: { id: session.user.profileId! }
      });
      if (!doctor) {
          return createErrorResponse({ message: "Doctor profile not found" }, 400);
      }
      // Further check if the patient is assigned to the doctor could be added here
  }


  const vitalReading = await prisma.vitalReading.create({
    data: {
      patientId,
      vitalTypeId,
      value,
      unit,
      readingTime: new Date(readingTime),
      notes,
      validatedBy: isDoctor ? session.user.profileId : null,
      isValidated: isDoctor,
    },
  });

  return createSuccessResponse(vitalReading, 201);
});
