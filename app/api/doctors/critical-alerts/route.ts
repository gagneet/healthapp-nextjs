import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/doctors/critical-alerts
 * Get critical alerts for the authenticated doctor's patients
 */
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
      prisma.emergency_alerts.findMany({
        where: {
          patients: {
            primary_care_doctor_id: doctor.id,
            is_active: true
          },
          status: 'ACTIVE',
          severity_level: { in: ['CRITICAL', 'HIGH'] }
        },
        include: {
          patients: {
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
      prisma.medication_safety_alerts.findMany({
        where: {
          patients: {
            primary_care_doctor_id: doctor.id,
            is_active: true
          },
          status: 'ACTIVE',
          alert_type: { in: ['DRUG_INTERACTION', 'ALLERGY_WARNING', 'DOSAGE_CONCERN'] }
        },
        include: {
          patients: {
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
      prisma.vital_readings.findMany({
        where: {
          patients: {
            primary_care_doctor_id: doctor.id,
            is_active: true
          },
          alert_level: { in: ['critical', 'emergency'] }
        },
        include: {
          patients: {
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
          vital_types: {
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
        severity: alert.severity_level,
        title: alert.alert_type || 'Emergency Alert',
        description: alert.description,
        patientName: `${alert.patients?.user?.first_name || ''} ${alert.patients?.user?.last_name || ''}`.trim(),
        patientId: alert.patients?.patient_id,
        timestamp: alert.created_at,
        status: alert.status
      })),
      ...medicationAlerts.map(alert => ({
        id: alert.id,
        type: 'medication',
        severity: alert.severity_level || 'HIGH',
        title: alert.alert_type || 'Medication Alert',
        description: alert.description,
        patientName: `${alert.patients?.user?.first_name || ''} ${alert.patients?.user?.last_name || ''}`.trim(),
        patientId: alert.patients?.patient_id,
        timestamp: alert.created_at,
        status: alert.status
      })),
      ...vitalAlerts.map(alert => ({
        id: alert.id,
        type: 'vital',
        severity: alert.alert_level?.toUpperCase() || 'HIGH',
        title: `${alert.vital_types?.name || 'Vital'} Alert`,
        description: `${alert.vital_types?.name || 'Vital'}: ${alert.value} ${alert.vital_types?.unit || ''}`,
        patientName: `${alert.patients?.user?.first_name || ''} ${alert.patients?.user?.last_name || ''}`.trim(),
        patientId: alert.patients?.patient_id,
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
