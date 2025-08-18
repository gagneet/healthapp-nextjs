import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

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
    const [emergencyAlerts, medicationAlerts, vitalAlerts] = await Promise.all([
      // Emergency alerts
      prisma.EmergencyAlert.findMany({
        where: {
          patient: {
            primary_care_doctor_id: doctor.id,
            is_active: true
          },
          acknowledged: false,
          resolved: false,
          priority_level: { in: ['CRITICAL', 'HIGH'] }
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
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

      // Medication safety alerts
      prisma.MedicationSafetyAlert.findMany({
        where: {
          patient: {
            primary_care_doctor_id: doctor.id,
            is_active: true
          },
          resolved: false,
          alert_type: { in: ['DRUG_INTERACTION', 'ALLERGY_WARNING', 'DOSAGE_CONCERN'] }
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
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

      // Critical vital readings
      prisma.VitalReading.findMany({
        where: {
          patient: {
            primary_care_doctor_id: doctor.id,
            is_active: true
          },
          alert_level: { in: ['critical', 'emergency'] }
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          },
          vital_type: {
            select: {
              name: true,
              unit: true
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
      ...emergencyAlerts.map(alert => ({
        id: alert.id,
        type: 'emergency',
        severity: alert.priority_level,
        title: alert.alert_title,
        description: alert.alert_message,
        patientName: `${alert.patient?.User?.first_name || ''} ${alert.patient?.User?.last_name || ''}`.trim(),
        patientId: alert.patient?.patient_id,
        timestamp: alert.created_at,
        status: alert.acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE'
      })),
      ...medicationAlerts.map(alert => ({
        id: alert.id,
        type: 'medication',
        severity: alert.severity || 'HIGH',
        title: alert.alert_title,
        description: alert.alert_message,
        patientName: `${alert.patient?.User?.first_name || ''} ${alert.patient?.User?.last_name || ''}`.trim(),
        patientId: alert.patient?.patient_id,
        timestamp: alert.created_at,
        status: alert.resolved ? 'RESOLVED' : 'ACTIVE'
      })),
      ...vitalAlerts.map(alert => ({
        id: alert.id,
        type: 'vital',
        severity: alert.alert_level?.toUpperCase() || 'HIGH',
        title: `${alert.vital_type?.name || 'Vital'} Alert`,
        description: `${alert.vital_type?.name || 'Vital'}: ${alert.value} ${alert.vital_type?.unit || ''}`,
        patientName: `${alert.patient?.User?.first_name || ''} ${alert.patient?.User?.last_name || ''}`.trim(),
        patientId: alert.patient?.patient_id,
        timestamp: alert.created_at,
        status: 'ACTIVE'
      }))
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
