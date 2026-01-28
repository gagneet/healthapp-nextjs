import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {

  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling,
  HealthcareApiError,
  HealthcareErrorCodes,
} from "@/lib/api-response";
import { z } from "zod";


export const dynamic = 'force-dynamic';

const updateAppointmentSchema = z.object({
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { carePlanId: string, appointmentId: string } }
) => {
  const session = await auth();
  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.user.role !== "DOCTOR") {
    return createForbiddenResponse("Only doctors can update appointments");
  }

  const { carePlanId, appointmentId } = params;

  const body = await request.json();
  const validationResult = updateAppointmentSchema.safeParse(body);

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { description, startDate, startTime, endTime } = validationResult.data;

  // Verify appointment exists in the care plan and the doctor is authorized
  const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { carePlan: true }
  });

  if (!appointment || appointment.carePlanId !== carePlanId) {
      return createErrorResponse(
        new HealthcareApiError(
          HealthcareErrorCodes.PATIENT_NOT_FOUND,
          "Appointment not found in this care plan",
          404
        )
      );
  }

  if (!appointment.carePlan || appointment.carePlan.createdByDoctorId !== session.user.profileId) {
      return createForbiddenResponse();
  }

  const startDateTime = startDate && startTime ? new Date(`${new Date(startDate).toISOString().split('T')[0]}T${startTime}`) : undefined;
  const endDateTime = startDate && endTime ? new Date(`${new Date(startDate).toISOString().split('T')[0]}T${endTime}`) : undefined;


  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      description,
      startDate: startDateTime,
      startTime: startDateTime,
      endTime: endDateTime,
    },
  });

  return createSuccessResponse(updatedAppointment);
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { carePlanId: string, appointmentId: string } }
) => {
    const session = await auth();
    if (!session) {
        return createUnauthorizedResponse();
    }

    if (session.user.role !== "DOCTOR") {
        return createForbiddenResponse("Only doctors can delete appointments");
    }

    const { carePlanId, appointmentId } = params;

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { carePlan: true }
    });

    if (!appointment || appointment.carePlanId !== carePlanId) {
        return createErrorResponse(
          new HealthcareApiError(
            HealthcareErrorCodes.PATIENT_NOT_FOUND,
            "Appointment not found in this care plan",
            404
          )
        );
    }

    if (!appointment.carePlan || appointment.carePlan.createdByDoctorId !== session.user.profileId) {
        return createForbiddenResponse();
    }

    await prisma.appointment.delete({
        where: { id: appointmentId },
    });

    return new NextResponse(null, { status: 204 });
});
