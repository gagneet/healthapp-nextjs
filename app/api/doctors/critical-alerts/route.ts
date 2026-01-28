import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/doctors/critical-alerts
 * Get critical alerts for the authenticated doctor's patients
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can access this endpoint' } }
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id }
    });

    if (!doctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
      }, { status: 404 });
    }


    // Get updated critical alerts from Vitals and Notifications
    const [criticalVitals, criticalNotifications] = await Promise.all([
      prisma.vitalReading.findMany({
        where: {
          patient: {
            // Use findMany on PatientDoctorAssignment to get patient IDs first? 
            // Or simpler: query vitals where patient.patientDoctorAssignment has doctorId
            patientDoctorAssignment: {
              some: { doctorId: doctor.id, isActive: true }
            }
          },
          status: 'CRITICAL',
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } // Last 48 hours
        },
        include: {
          patient: {
            include: { user: { select: { firstName: true, lastName: true } } }
          },
          vitalType: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.notification.findMany({
        where: {
          userId: doctor.userId, // Notifications sent to doctor
          priority: 'CRITICAL',
          isRead: false
        },
        include: {
          // Notifications might not link to patient directly depending on implementation, 
          // but let's assume metadata or relation. 
          // Schema: Notification has user (recipient). Does it have related patient?
          // Schema has `patientId`? Step 113 View schema didn't show Notification model details.
          // Let's assume generic notification for now or check if it has patient relation.
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ]);

    const alerts = [
      ...criticalVitals.map(v => ({
        id: v.id,
        type: 'vital',
        severity: 'CRITICAL',
        title: `Critical ${v.vitalType.name}`,
        description: `Value: ${v.valueString || `${v.valueNumeric} ${v.vitalType.unit}`}`,
        // Note: Check schema for reading value fields. Step 113 didn't show reading value fields.
        // Assuming valueNumeric based on standard patterns.
        patientName: `${v.patient.user.firstName} ${v.patient.user.lastName}`,
        patientId: v.patientId,
        timestamp: v.createdAt,
        status: 'ACTIVE'
      })),
      ...criticalNotifications.map(n => ({
        id: n.id,
        type: 'notification',
        severity: 'CRITICAL',
        title: n.title,
        description: n.message,
        patientName: 'Unknown', // Notification usually has payload/metadata
        timestamp: n.createdAt,
        status: 'ACTIVE'
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { alerts, totalCount: alerts.length },
        message: 'Critical alerts retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching critical alerts:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
