import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const rescheduleSchema = z.object({
  startDate: z.string().datetime().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
});

/**
 * POST /api/patient/appointments/[id]/reschedule
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can reschedule appointments' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id: params.id, patientId: patient.id },
    });

    if (!appointment) {
      return NextResponse.json(handleApiError({ message: 'Appointment not found' }), { status: 404 });
    }

    const body = await request.json();
    const data = rescheduleSchema.parse(body);

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        startDate: data.startDate ? new Date(data.startDate) : appointment.startDate,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : appointment.endTime,
        status: 'RESCHEDULED',
      },
    });

    return NextResponse.json(formatApiSuccess(updated, 'Appointment rescheduled'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
