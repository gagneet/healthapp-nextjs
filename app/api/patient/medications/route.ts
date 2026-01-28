import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  date: z.string().datetime().optional(),
});

interface MedicationScheduleItem {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  scheduledAt: string | null;
  status: 'TAKEN' | 'MISSED' | 'PENDING';
}

/**
 * GET /api/patient/medications
 * Get patient's medication schedule + summary
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view medications' }), { status: 403 });
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
      date: searchParams.get('date') || undefined,
    });

    const targetDate = query.date ? new Date(query.date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const medications = await prisma.medication.findMany({
      where: {
        participantId: patient.id,
        deletedAt: null,
      },
      select: {
        id: true,
        details: true,
        startDate: true,
        endDate: true,
        medicine: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const logs = await prisma.medicationLog.findMany({
      where: {
        patientId: patient.id,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const logByMedication = new Map<string, typeof logs[0]>();
    for (const log of logs) {
      if (!logByMedication.has(log.medicationId)) {
        logByMedication.set(log.medicationId, log);
      }
    }

    const schedule: MedicationScheduleItem[] = medications.map((med) => {
      const details = (med.details as Record<string, unknown> | null) || {};
      const log = logByMedication.get(med.id);
      const status = log?.adherenceStatus === 'TAKEN' ? 'TAKEN' : log?.adherenceStatus === 'MISSED' ? 'MISSED' : 'PENDING';
      return {
        id: med.id,
        name: med.medicine?.name || 'Medication',
        dosage: typeof details.dosage === 'string' ? details.dosage : null,
        frequency: typeof details.frequency === 'string' ? details.frequency : null,
        instructions: typeof details.instructions === 'string' ? details.instructions : null,
        scheduledAt: log?.scheduledAt ? log.scheduledAt.toISOString() : null,
        status,
      };
    });

    return NextResponse.json(
      formatApiSuccess(
        {
          date: targetDate.toISOString(),
          schedule,
          summary: {
            total: schedule.length,
            taken: schedule.filter((item) => item.status === 'TAKEN').length,
            missed: schedule.filter((item) => item.status === 'MISSED').length,
            pending: schedule.filter((item) => item.status === 'PENDING').length,
          },
        },
        'Medication schedule retrieved successfully'
      )
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
