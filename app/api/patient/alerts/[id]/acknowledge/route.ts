/**
 * Acknowledge Alert API
 * Marks an alert as read/acknowledged
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';

/**
 * POST /api/patient/alerts/[id]/acknowledge
 * Mark an alert as acknowledged/read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'PATIENT') {
      return NextResponse.json(
        handleApiError({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const alertId = params.id;

    // Get patient profile
    const patient = await prisma.patient.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(
        handleApiError({ message: 'Patient profile not found' }),
        { status: 404 }
      );
    }

    // Try to find as notification first
    const notification = await prisma.notification.findFirst({
      where: {
        id: alertId,
        userId: session.user.id
      }
    });

    if (notification) {
      // Update notification as read
      await prisma.notification.update({
        where: { id: alertId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return NextResponse.json(
        formatApiSuccess({
          data: { id: alertId, acknowledged: true, type: 'notification' },
          message: 'Alert acknowledged successfully'
        }),
        { status: 200 }
      );
    }

    // Try to find as reminder
    const reminder = await prisma.patientReminder.findFirst({
      where: {
        id: alertId,
        patientId: patient.id
      }
    });

    if (reminder) {
      // Update reminder as acknowledged
      await prisma.patientReminder.update({
        where: { id: alertId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date()
        }
      });

      return NextResponse.json(
        formatApiSuccess({
          data: { id: alertId, acknowledged: true, type: 'reminder' },
          message: 'Reminder acknowledged successfully'
        }),
        { status: 200 }
      );
    }

    // Alert not found
    return NextResponse.json(
      handleApiError({ message: 'Alert not found or access denied' }),
      { status: 404 }
    );

  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      handleApiError({ message: 'Failed to acknowledge alert' }),
      { status: 500 }
    );
  }
}
