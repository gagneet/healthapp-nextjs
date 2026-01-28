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

const createAppointmentSchema = z.object({
  description: z.string().optional(),
  startDate: z.string().datetime(),
  startTime: z.string(),
  endTime: z.string(),
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
    return createForbiddenResponse("Only doctors can create appointments");
  }

  const { carePlanId } = params;

  const body = await request.json();
  const validationResult = createAppointmentSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { description, startDate, startTime, endTime } = validationResult.data;

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

  if (!session.user.profileId) {
    return createErrorResponse(new Error("User profile not found"));
  }

  const startDateTime = new Date(`${new Date(startDate).toISOString().split('T')[0]}T${startTime}`);
  const endDateTime = new Date(`${new Date(startDate).toISOString().split('T')[0]}T${endTime}`);
  if (endDateTime <= startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  const appointment = await prisma.appointment.create({
    data: {
      carePlan: {
        connect: { id: carePlanId },
      },
      patient: {
          connect: { id: carePlan.patientId }
      },
      doctor: {
          connect: { id: session.user.profileId }
      },
      participantOneId: session.user.profileId,
      participantOneType: 'DOCTOR',
      participantTwoId: carePlan.patientId,
      participantTwoType: 'PATIENT',
      organizerId: session.user.profileId,
      organizerType: 'DOCTOR',
      description,
      startDate: startDateTime,
      endDate: endDateTime,
      startTime: startDateTime,
      endTime: endDateTime,
      status: 'SCHEDULED',
      createdAt: new Date()
    },
  });

  return createSuccessResponse(appointment, 201);
});
