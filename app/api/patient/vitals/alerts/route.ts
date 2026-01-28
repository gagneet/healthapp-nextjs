import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/vitals/alerts
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view vital alerts' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const alerts = await prisma.vitalReading.findMany({
      where: {
        patientId: patient.id,
        alertLevel: { in: ['WARNING', 'CRITICAL', 'EMERGENCY'] },
      },
      include: { vitalType: true },
      orderBy: { readingTime: 'desc' },
      take: 20,
    });

    const response = alerts.map((reading) => ({
      id: reading.id,
      vitalType: reading.vitalType.name,
      value: reading.value ? Number(reading.value) : null,
      alertLevel: reading.alertLevel,
      recordedAt: reading.readingTime.toISOString(),
    }));

    return NextResponse.json(formatApiSuccess(response, 'Vital alerts retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
