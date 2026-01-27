import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

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

    const [emergencyAlerts, medicationAlerts, recentNotifications] = await Promise.all([
      prisma.emergencyAlert.findMany({
        where: {
          patient: {
            primaryCareDoctorId: doctor.id
          },
          acknowledged: false,
          resolved: false
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Math.ceil(limit / 2)
      }),

      prisma.medicationSafetyAlert.findMany({
        where: {
          patient: {
            primaryCareDoctorId: doctor.id
          },
          resolved: false
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Math.ceil(limit / 3)
      }),

      prisma.notification.findMany({
        where: {
          doctorId: doctor.id,
          isUrgent: true,
          readAt: null
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Math.ceil(limit / 3)
      })
    ]);

    const allAlerts = [
      ...emergencyAlerts.map(alert => {
        const patientName = alert.patient?.user.name || 
                           `${alert.patient?.user.firstName || ''} ${alert.patient?.user.lastName || ''}`.trim();
        return {
          id: alert.id,
          type: 'emergency',
          severity: alert.priorityLevel,
          title: alert.alertTitle,
          description: alert.alertMessage,
          patientName,
          patientId: alert.patient?.patientId,
          timestamp: alert.createdAt,
          status: alert.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE'
        };
      }),
      ...medicationAlerts.map(alert => {
        const patientName = alert.patient?.user.name || 
                           `${alert.patient?.user.firstName || ''} ${alert.patient?.user.lastName || ''}`.trim();
        return {
          id: alert.id,
          type: 'medication',
          severity: alert.severity || 'HIGH',
          title: alert.alertTitle,
          description: alert.alertMessage,
          patientName,
          patientId: alert.patient?.patientId,
          timestamp: alert.createdAt,
          status: alert.resolved ? 'RESOLVED' : 'ACTIVE'
        };
      }),
      ...recentNotifications.map(notification => {
        const patientName = notification.patient?.user.name ||
                           `${notification.patient?.user.firstName || ''} ${notification.patient?.user.lastName || ''}`.trim();
        return {
          id: notification.id,
          type: 'notification',
          severity: notification.isUrgent ? 'HIGH' : 'MEDIUM',
          title: notification.title,
          description: notification.message,
          patientName,
          patientId: notification.patient?.patientId,
          timestamp: notification.createdAt,
          status: notification.readAt ? 'READ' : 'ACTIVE'
        };
      })
    ];

    const sortedAlerts = allAlerts
      .sort((a, b) => new Date(b.timestamp as any).getTime() - new Date(a.timestamp as any).getTime())
      .slice(0, limit);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { 
          alerts: sortedAlerts,
          totalCount: allAlerts.length
        },
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
