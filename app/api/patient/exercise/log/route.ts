import { auth } from '@/lib/auth';
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const exerciseLogSchema = z.object({
  title: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  notes: z.string().optional(),
  loggedAt: z.string().datetime().optional()
});

/**
 * POST /api/patient/exercise/log
 * Log an exercise entry for the authenticated patient
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({
        message: 'Only patients can log exercise entries'
      }), { status: 403 });
    }

    const body = await request.json();
    const validatedData = exerciseLogSchema.parse(body);

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(handleApiError({
        message: 'Patient profile not found'
      }), { status: 404 });
    }

    const loggedAt = validatedData.loggedAt ? new Date(validatedData.loggedAt) : new Date();

    const scheduledEvent = await prisma.scheduledEvent.create({
      data: {
        patientId: patient.id,
        eventType: 'EXERCISE',
        title: validatedData.title,
        description: validatedData.notes,
        scheduledFor: loggedAt,
        status: 'COMPLETED',
        eventData: {
          durationMinutes: validatedData.durationMinutes
        },
        completedAt: loggedAt,
        completedBy: session.user.id,
        createdAt: new Date()
      }
    });

    await prisma.adherenceRecord.create({
      data: {
        patientId: patient.id,
        adherenceType: 'EXERCISE',
        dueAt: loggedAt,
        recordedAt: loggedAt,
        isCompleted: true,
        responseData: {
          eventId: scheduledEvent.id,
          durationMinutes: validatedData.durationMinutes
        },
        notes: validatedData.notes
      }
    });

    return NextResponse.json(formatApiSuccess({
      id: scheduledEvent.id,
      title: scheduledEvent.title,
      scheduledFor: scheduledEvent.scheduledFor
    }, 'Exercise entry logged successfully'));
  } catch (error) {
    console.error('Exercise log error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(handleApiError({ message: 'Invalid exercise entry data' }), { status: 400 });
    }
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
