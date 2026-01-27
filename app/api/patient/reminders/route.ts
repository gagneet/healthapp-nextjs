import { auth } from '@/lib/auth';
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const reminderQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});

/**
 * GET /api/patient/reminders
 * Get scheduled reminders for authenticated patient
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({
        message: 'Only patients can view reminders'
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
    const queryData = reminderQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    });

    const reminders = await prisma.scheduledEvent.findMany({
      where: {
        patientId: patient.id,
        eventType: 'REMINDER',
        ...(queryData.status ? { status: queryData.status } : {})
      },
      orderBy: { scheduledFor: 'asc' },
      take: queryData.limit,
      skip: queryData.offset
    });

    return NextResponse.json(formatApiSuccess(reminders.map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      scheduledFor: reminder.scheduledFor,
      status: reminder.status,
      priority: reminder.priority,
      eventData: reminder.eventData
    })), 'Reminders retrieved successfully'));
  } catch (error) {
    console.error('Get reminders error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(handleApiError({ message: 'Invalid query parameters' }), { status: 400 });
    }
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
