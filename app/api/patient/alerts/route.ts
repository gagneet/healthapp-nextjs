/**
 * Patient Alerts API
 * Centralizes all patient notifications and alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';

/**
 * GET /api/patient/alerts
 * Retrieve all alerts for the authenticated patient
 * Query params:
 *   - type: filter by alert type (all, medication, appointment, vital, lab_result, emergency, care_plan, message)
 *   - status: filter by status (all, unread, acknowledged)
 *   - limit: number of alerts to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'PATIENT') {
      return NextResponse.json(
        handleApiError({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause for notifications
    const notificationWhere: any = {
      userId: session.user.id,
      deletedAt: null
    };

    // Filter by type if specified
    if (type !== 'all') {
      const typeMap: Record<string, string[]> = {
        medication: ['MEDICATION_DUE', 'MEDICATION_MISSED', 'MEDICATION_REFILL_DUE'],
        appointment: ['APPOINTMENT_REMINDER', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED'],
        vital: ['VITAL_ALERT_HIGH', 'VITAL_ALERT_LOW', 'VITAL_ALERT_CRITICAL'],
        lab_result: ['LAB_RESULT_AVAILABLE', 'LAB_RESULT_ABNORMAL'],
        emergency: ['EMERGENCY_ALERT'],
        care_plan: ['CARE_PLAN_UPDATED', 'CARE_PLAN_REVIEW_DUE'],
        message: ['NEW_MESSAGE', 'MESSAGE_REPLY']
      };

      if (typeMap[type]) {
        notificationWhere.type = { in: typeMap[type] };
      }
    }

    // Filter by status if specified
    if (status === 'unread') {
      notificationWhere.isRead = false;
    } else if (status === 'acknowledged') {
      notificationWhere.isRead = true;
    }

    // Fetch notifications (general alerts)
    const notifications = await prisma.notification.findMany({
      where: notificationWhere,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        priority: true,
        actionUrl: true,
        metadata: true,
        createdAt: true
      }
    });

    // Fetch patient reminders (scheduled alerts)
    const reminderWhere: any = {
      patientId: patient.id
    };

    if (status === 'unread') {
      reminderWhere.status = { in: ['SCHEDULED', 'SENT', 'SNOOZED'] };
    } else if (status === 'acknowledged') {
      reminderWhere.status = 'ACKNOWLEDGED';
    }

    if (type === 'medication' || type === 'all') {
      // Include medication reminders
    }

    const reminders = await prisma.patientReminder.findMany({
      where: reminderWhere,
      orderBy: { scheduledFor: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        scheduledFor: true,
        sentAt: true,
        acknowledgedAt: true,
        status: true,
        relatedId: true,
        relatedType: true
      }
    });

    // Combine and format alerts
    const alerts = [
      ...notifications.map(n => ({
        id: n.id,
        type: n.type?.toLowerCase().replace(/_/g, '-'),
        category: categorizeNotificationType(n.type || ''),
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        priority: n.priority || 'normal',
        actionUrl: n.actionUrl,
        metadata: n.metadata,
        createdAt: n.createdAt,
        source: 'notification'
      })),
      ...reminders.map(r => ({
        id: r.id,
        type: r.type?.toLowerCase().replace(/_/g, '-'),
        category: categorizeReminderType(r.type || 'CUSTOM'),
        title: r.title,
        message: r.message,
        isRead: r.status === 'ACKNOWLEDGED',
        priority: r.scheduledFor < new Date() ? 'high' : 'normal',
        actionUrl: getActionUrlForReminder(r.relatedType, r.relatedId),
        metadata: {
          scheduledFor: r.scheduledFor,
          status: r.status,
          relatedId: r.relatedId,
          relatedType: r.relatedType
        },
        createdAt: r.sentAt || r.scheduledFor,
        source: 'reminder'
      }))
    ];

    // Sort by creation date (most recent first)
    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Count unread alerts
    const unreadCount = alerts.filter(a => !a.isRead).length;

    // Group by category for summary
    const byCategory = alerts.reduce((acc, alert) => {
      const cat = alert.category;
      if (!acc[cat]) {
        acc[cat] = { total: 0, unread: 0 };
      }
      acc[cat].total++;
      if (!alert.isRead) {
        acc[cat].unread++;
      }
      return acc;
    }, {} as Record<string, { total: number; unread: number }>);

    return NextResponse.json(
      formatApiSuccess({
        data: {
          alerts: alerts.slice(0, limit),
          summary: {
            total: alerts.length,
            unread: unreadCount,
            byCategory
          }
        },
        message: 'Alerts retrieved successfully'
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching patient alerts:', error);
    return NextResponse.json(
      handleApiError({ message: 'Failed to fetch alerts' }),
      { status: 500 }
    );
  }
}

// Helper function to categorize notification types
function categorizeNotificationType(type: string): string {
  if (type.includes('MEDICATION')) return 'medication';
  if (type.includes('APPOINTMENT')) return 'appointment';
  if (type.includes('VITAL')) return 'vital';
  if (type.includes('LAB')) return 'lab_result';
  if (type.includes('EMERGENCY')) return 'emergency';
  if (type.includes('CARE_PLAN')) return 'care_plan';
  if (type.includes('MESSAGE')) return 'message';
  return 'general';
}

// Helper function to categorize reminder types
function categorizeReminderType(type: string): string {
  const typeMap: Record<string, string> = {
    'MEDICATION': 'medication',
    'APPOINTMENT': 'appointment',
    'VITAL_RECORDING': 'vital',
    'EXERCISE': 'exercise',
    'MEAL': 'meal',
    'WATER_INTAKE': 'water',
    'CUSTOM': 'general'
  };
  return typeMap[type] || 'general';
}

// Helper function to generate action URLs for reminders
function getActionUrlForReminder(relatedType: string | null, relatedId: string | null): string | null {
  if (!relatedType || !relatedId) return null;

  const urlMap: Record<string, string> = {
    'medication': `/dashboard/patient/medications`,
    'appointment': `/dashboard/patient/appointments/${relatedId}`,
    'vital': `/dashboard/patient/vitals/record`,
    'exercise': `/dashboard/patient/exercise`,
    'meal': `/dashboard/patient/diet`
  };

  return urlMap[relatedType.toLowerCase()] || null;
}
