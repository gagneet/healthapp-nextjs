import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/patient/events/[eventId]/complete
 * Mark a scheduled event as completed
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
    const { completed_at } = body;

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
        status: 'COMPLETED',
        completedAt: completed_at ? new Date(completed_at) : new Date(),
        updatedAt: new Date()
      }
    });

    // Create adherence record if it's a medication or vital check
    if (event.eventType === 'MEDICATION' || event.eventType === 'VITAL_CHECK') {
      await prisma.adherenceRecord.create({
        data: {
          patientId: event.patientId,
          adherenceType: event.eventType === 'MEDICATION' ? 'MEDICATION' : 'VITAL_CHECK',
          scheduledAt: event.scheduledFor,
          completedAt: new Date(completed_at || new Date()),
          isCompleted: true,
          notes: `Completed via patient dashboard`
        }
      });
    }

    return NextResponse.json(formatApiSuccess(updatedEvent, 'Event marked as completed'));
  } catch (error) {
    console.error('Complete event error:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
