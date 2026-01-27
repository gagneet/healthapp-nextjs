import { auth } from '@/lib/auth';
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


export const dynamic = 'force-dynamic';

const dietLogSchema = z.object({
  title: z.string().min(1),
  calories: z.number().int().positive().optional(),
  notes: z.string().optional(),
  loggedAt: z.string().datetime().optional()
});

/**
 * POST /api/patient/diet/log
 * Log a diet entry for the authenticated patient
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({
        message: 'Only patients can log diet entries'
      }), { status: 403 });
    }

    const body = await request.json();
    const validatedData = dietLogSchema.parse(body);

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
        eventType: 'DIET_LOG',
        title: validatedData.title,
        description: validatedData.notes,
        scheduledFor: loggedAt,
        status: 'COMPLETED',
        eventData: {
          calories: validatedData.calories ?? null
        },
        completedAt: loggedAt,
        completedBy: session.user.id,
        createdAt: new Date()
      }
    });

    await prisma.adherenceRecord.create({
      data: {
        patientId: patient.id,
        adherenceType: 'DIET_LOG',
        dueAt: loggedAt,
        recordedAt: loggedAt,
        isCompleted: true,
        responseData: {
          eventId: scheduledEvent.id,
          calories: validatedData.calories ?? null
        },
        notes: validatedData.notes
      }
    });

    return NextResponse.json(formatApiSuccess({
      id: scheduledEvent.id,
      title: scheduledEvent.title,
      scheduledFor: scheduledEvent.scheduledFor
    }, 'Diet entry logged successfully'));
  } catch (error) {
    console.error('Diet log error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(handleApiError({ message: 'Invalid diet entry data' }), { status: 400 });
    }
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
