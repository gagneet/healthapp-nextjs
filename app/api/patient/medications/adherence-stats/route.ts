import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

interface AdherenceStats {
  total: number;
  taken: number;
  missed: number;
  adherenceRate: number;
}

/**
 * GET /api/patient/medications/adherence-stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view adherence stats' }), { status: 403 });
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
    });

    const where: Record<string, unknown> = { patientId: patient.id };
    if (query.startDate || query.endDate) {
      where.scheduledAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const [total, taken, missed] = await Promise.all([
      prisma.medicationLog.count({ where }),
      prisma.medicationLog.count({ where: { ...where, adherenceStatus: 'TAKEN' } }),
      prisma.medicationLog.count({ where: { ...where, adherenceStatus: 'MISSED' } }),
    ]);

    const stats: AdherenceStats = {
      total,
      taken,
      missed,
      adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 0,
    };

    return NextResponse.json(formatApiSuccess(stats, 'Medication adherence stats retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
