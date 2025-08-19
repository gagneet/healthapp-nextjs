import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { MedicationAlertType, EmergencyPriority, AlertSeverity } from '@prisma/client';

/**
 * GET /api/doctors/critical-alerts
 * Get critical alerts for the authenticated doctor's patients
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors can access this endpoint
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can access this endpoint' } }
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get doctor ID
    const doctor = await prisma.doctors.findFirst({
      where: { user_id: session.user.id }
    });

    if (!doctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
      }, { status: 404 });
    }

    // Get critical alerts from multiple sources
    const [emergencyAlerts, medicationAlerts, recentNotifications] = await Promise.all([
      // Emergency alerts
      prisma.emergencyAlert.findMany({
        where: {
          patients: {
            primary_care_doctor_id: doctor.id
          },
          acknowledged: false,
          resolved: false
        },
        include: {
          patients: {
            include: {
              users_patients_user_idTousers: {
                select: {
                  first_name: true,
                  last_name: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: Math.ceil(limit / 2)
      }),

      // Medication safety alerts
      prisma.medicationSafetyAlert.findMany({
        where: {
          patients: {
            primary_care_doctor_id: doctor.id
          },
          resolved: false
        },
        include: {
          patients: {
            include: {
              users_patients_user_idTousers: {
                select: {
                  first_name: true,
                  last_name: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: Math.ceil(limit / 3)
      }),

      // Critical notifications as alerts
      prisma.notification.findMany({
        where: {
          doctor_id: doctor.id,
          is_urgent: true,
          is_read: false
        },
        include: {
          patients: {
            include: {
              users_patients_user_idTousers: {
                select: {
                  first_name: true,
                  last_name: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: Math.ceil(limit / 3)
      })
    ]);

    // Format and combine all alerts
    const allAlerts = [
      ...emergencyAlerts.map(alert => {
        const patientName = alert.patients?.users_patients_user_idTousers.name || 
                           `${alert.patients?.users_patients_user_idTousers.first_name || ''} ${alert.patients?.users_patients_user_idTousers.last_name || ''}`.trim();
        return {
          id: alert.id,
          type: 'emergency',
          severity: alert.priority_level,
          title: alert.alert_title,
          description: alert.alert_message,
          patientName,
          patientId: alert.patients?.patient_id,
          timestamp: alert.created_at,
          status: alert.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE'
        };
      }),
      ...medicationAlerts.map(alert => {
        const patientName = alert.patients?.users_patients_user_idTousers.name || 
                           `${alert.patients?.users_patients_user_idTousers.first_name || ''} ${alert.patients?.users_patients_user_idTousers.last_name || ''}`.trim();
        return {
          id: alert.id,
          type: 'medication',
          severity: alert.severity || 'HIGH',
          title: alert.alert_title,
          description: alert.alert_message,
          patientName,
          patientId: alert.patients?.patient_id,
          timestamp: alert.created_at,
          status: alert.resolved ? 'RESOLVED' : 'ACTIVE'
        };
      }),
      ...recentNotifications.map(notification => {
        const patientName = notification.patients?.users_patients_user_idTousers.name || 
                           `${notification.patients?.users_patients_user_idTousers.first_name || ''} ${notification.patients?.users_patients_user_idTousers.last_name || ''}`.trim();
        return {
          id: notification.id,
          type: 'notification',
          severity: notification.is_urgent ? 'HIGH' : 'MEDIUM',
          title: notification.title,
          description: notification.message,
          patientName,
          patientId: notification.patients?.patient_id,
          timestamp: notification.created_at,
          status: notification.is_read ? 'READ' : 'ACTIVE'
        };
      })
    ];

    // Sort by timestamp and limit results
    const sortedAlerts = allAlerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
