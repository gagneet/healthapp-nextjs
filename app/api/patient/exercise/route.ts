import { auth } from '@/lib/auth';
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


export const dynamic = 'force-dynamic';

const exerciseQuerySchema = z.object({
  limit: z.number().int().positive().max(50).default(20),
  offset: z.number().int().nonnegative().default(0)
});

/**
 * GET /api/patient/exercise
 * Get exercise log entries for authenticated patient
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({
        message: 'Only patients can view exercise entries'
      }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(handleApiError({
        message: 'Patient profile not found'
      }), { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const queryData = exerciseQuerySchema.parse({
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    });

    const exerciseLogs = await prisma.scheduledEvent.findMany({
      where: {
        patientId: patient.id,
        eventType: 'EXERCISE'
      },
      orderBy: { scheduledFor: 'desc' },
      take: queryData.limit,
      skip: queryData.offset
    });

    return NextResponse.json(formatApiSuccess(exerciseLogs.map(log => ({
      id: log.id,
      title: log.title,
      description: log.description,
      loggedAt: log.scheduledFor,
      status: log.status,
      durationMinutes: (log.eventData as Record<string, unknown> | null)?.durationMinutes ?? null
    })), 'Exercise entries retrieved successfully'));
  } catch (error) {
    console.error('Exercise list error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(handleApiError({ message: 'Invalid query parameters' }), { status: 400 });
    }
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
