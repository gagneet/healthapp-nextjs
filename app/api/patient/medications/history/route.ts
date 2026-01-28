import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(50),
});

/**
 * GET /api/patient/medications/history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view history' }), { status: 403 });
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
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
    });

    const where: Record<string, unknown> = {
      patientId: patient.id,
    };

    if (query.startDate || query.endDate) {
      where.scheduledAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const logs = await prisma.medicationLog.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: query.limit,
      include: {
        medication: {
          select: {
            id: true,
            details: true,
            medicine: { select: { name: true } },
          },
        },
      },
    });

    const history = logs.map((log) => {
      const details = (log.medication.details as Record<string, unknown> | null) || {};
      return {
        id: log.id,
        medicationId: log.medicationId,
        medicationName: log.medication.medicine?.name || 'Medication',
        scheduledAt: log.scheduledAt.toISOString(),
        takenAt: log.takenAt ? log.takenAt.toISOString() : null,
        status: log.adherenceStatus || 'MISSED',
        dosageTaken: log.dosageTaken,
        notes: log.notes,
        frequency: typeof details.frequency === 'string' ? details.frequency : null,
      };
    });

    return NextResponse.json(formatApiSuccess(history, 'Medication history retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
