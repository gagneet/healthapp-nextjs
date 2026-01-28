import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/vitals/trends
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view vitals trends' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const latest = await prisma.vitalReading.findMany({
      where: { patientId: patient.id },
      include: { vitalType: true },
      orderBy: { readingTime: 'desc' },
      take: 20,
    });

    const grouped = new Map<string, typeof latest>();
    for (const reading of latest) {
      const key = reading.vitalType.name;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(reading);
    }

    const trends = Array.from(grouped.entries()).map(([name, readings]) => {
      const current = readings[0];
      const previous = readings[1];
      const currentValue = current.value ? Number(current.value) : 0;
      const previousValue = previous?.value ? Number(previous.value) : 0;
      const change = currentValue - previousValue;
      const changePercent = previousValue ? (change / previousValue) * 100 : 0;
      return {
        vitalType: name,
        current: currentValue,
        previous: previousValue,
        change,
        change_percent: Number(changePercent.toFixed(1)),
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      };
    });

    return NextResponse.json(formatApiSuccess(trends, 'Vitals trends retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
