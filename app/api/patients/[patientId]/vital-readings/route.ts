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
    return createErrorResponse(new Error("Patient not found"));
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
          return createErrorResponse(new Error("Doctor profile not found"));
      }
      // Further check if the patient is assigned to the doctor could be added here
  }

  const vitalType = await prisma.vitalType.findUnique({
    where: { id: vitalTypeId },
  });

  if (!vitalType) {
    return createErrorResponse(new Error("Vital type not found"));
  }

  if (vitalType.normalRangeMin && value < vitalType.normalRangeMin) {
    return createErrorResponse(new Error(`Value is below the normal range of ${vitalType.normalRangeMin}`));
  }
  if (vitalType.normalRangeMax && value > vitalType.normalRangeMax) {
      return createErrorResponse(new Error(`Value is above the normal range of ${vitalType.normalRangeMax}`));
  }

  // Sanity checks for common vital types
  if (vitalType.name === 'Temperature' && (value < 30 || value > 45)) {
      return createErrorResponse(new Error('Temperature reading is outside the normal human range.'));
  }
  if (vitalType.name === 'Heart Rate' && (value < 20 || value > 300)) {
        return createErrorResponse(new Error('Heart rate is outside the normal human range.'));
  }
  if (vitalType.name === 'Blood Pressure') {
      // Assuming value is systolic. A more complex implementation would handle diastolic as well.
      if (value < 50 || value > 300) {
        return createErrorResponse(new Error('Blood pressure reading is outside the normal human range.'));
      }
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
