import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.string().optional(),
});

/**
 * GET /api/patient/appointments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view appointments' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      status: searchParams.get('status') || undefined,
    });
    const normalizedStatus = query.status ? query.status.toUpperCase() : undefined;

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      },
      include: {
        doctor: { include: { user: true, specialty: true } },
      },
      orderBy: { startDate: 'desc' },
      take: 50,
    });

    const response = appointments.map((appointment) => ({
      id: appointment.id,
      doctor_name: appointment.doctor?.user?.fullName || appointment.doctor?.user?.name || 'Doctor',
      doctor_speciality: appointment.doctor?.specialty?.name || 'General',
      appointment_date: appointment.startDate?.toISOString().split('T')[0] || '',
      appointment_time: appointment.startTime?.toISOString().split('T')[1]?.slice(0, 5) || '',
      duration: appointment.details && typeof appointment.details === 'object' && 'duration' in appointment.details
        ? Number((appointment.details as Record<string, unknown>).duration || 30)
        : 30,
      type: (appointment.appointmentType || 'in-person').toLowerCase(),
      status: (appointment.status || 'scheduled').toLowerCase(),
      location: appointment.location || appointment.providerName || '',
      notes: appointment.notes || '',
      reminder_sent: false,
    }));

    return NextResponse.json(formatApiSuccess(response, 'Appointments retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
