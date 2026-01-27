import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/patient/events/[eventId]/missed
 * Mark a scheduled event as missed
 */

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = params;
    const body = await request.json();
    const { missed_at } = body;

    // Get the event to verify ownership
    const event = await prisma.scheduledEvent.findUnique({
      where: { id: eventId },
      include: {
        patient: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(handleApiError({
        message: 'Event not found'
      }), { status: 404 });
    }

    // Check if user can access this event
    if (session.user.role === 'PATIENT' && event.patient?.userId !== session.user.id) {
      return NextResponse.json(handleApiError({
        message: 'Access denied'
      }), { status: 403 });
    }

    // Update the event
    const updatedEvent = await prisma.scheduledEvent.update({
      where: { id: eventId },
      data: {
        status: 'MISSED',
        updatedAt: new Date()
      }
    });

    // Create adherence record for missed event
    if (event.eventType === 'MEDICATION' || event.eventType === 'VITAL_CHECK') {
      await prisma.adherenceRecord.create({
        data: {
          patientId: event.patientId,
          adherenceType: event.eventType === 'MEDICATION' ? 'MEDICATION' : 'VITAL_CHECK',
          scheduledAt: event.scheduledFor,
          completedAt: null,
          isCompleted: false,
          notes: `Marked as missed via patient dashboard`
        }
      });
    }

    return NextResponse.json(formatApiSuccess(updatedEvent, 'Event marked as missed'));
  } catch (error) {
    console.error('Mark event missed error:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
