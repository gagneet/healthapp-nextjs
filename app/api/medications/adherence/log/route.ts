import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';

interface LogFilter {
  patientId?: string;
  relatedMedicationId?: string;
  status?: string;
  recordedBy?: string;
  scheduledDatetime?: {
    gte?: Date;
    lte?: Date;
  };
}

const logAdherenceSchema = z.object({
  relatedMedicationId: z.string().uuid(),
  scheduledDatetime: z.string().datetime(),
  actualDatetime: z.string().datetime().optional(),
  status: z.enum(['taken', 'missed', 'late', 'partial']),
  actualDose: z.number().positive().optional(),
  patientNotes: z.string().optional(),
  recordedBy: z.enum(['manual', 'iot_device', 'smartphone_app', 'caregiver']).default('manual'),
  deviceReadingId: z.string().uuid().optional(),
  sideEffectsReported: z.array(z.string()).optional(),
  location: z.string().optional(),
  reminderEffectiveness: z.enum(['HELPFUL', 'NOT_HELPFUL', 'NO_REMINDER']).optional()
});

const getLogsSchema = z.object({
  relatedMedicationId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  status: z.enum(['taken', 'missed', 'late', 'partial']).optional(),
  recordedBy: z.enum(['manual', 'iot_device', 'smartphone_app', 'caregiver']).optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0)
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = logAdherenceSchema.parse(body);

    // Verify medication exists and user has access
    const medication = await prisma.medication.findUnique({
      where: { id: validatedData.relatedMedicationId },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        medicine: { 
          select: { name: true, type: true, details: true }
        }
      }
    });

    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    // Permission check: Patient themselves, their doctors, caregivers, or admins
    let hasAccess = false;
    const loggedBy = session.user.id;

    if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id }
      });
      hasAccess = patient?.id === medication.patientId;
    } else if (session.user.role === 'DOCTOR') {
      const doctorAccess = await prisma.patient.findFirst({
        where: {
          id: medication.patientId,
          OR: [
            { primaryCareDoctorId: session.user.id },
            {
              patientDoctorAssignments: {
                some: {
                  doctorId: session.user.id,
                  status: 'ACTIVE'
                }
              }
            }
          ]
        }
      });
      hasAccess = !!doctorAccess;
    } else if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'HSP'].includes(session.user.role)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions to log medication adherence' }, { status: 403 });
    }

    // Validate business rules
    const scheduledTime = new Date(validatedData.scheduledDatetime);
    const actualTime = validatedData.actualDatetime ? new Date(validatedData.actualDatetime) : null;
    const now = new Date();

    // Check if scheduled time is within medication period
    if (medication.startDate && scheduledTime < medication.startDate) {
      return NextResponse.json({ 
        error: 'Cannot log adherence for date before medication start date' 
      }, { status: 400 });
    }

    if (medication.endDate && scheduledTime > medication.endDate) {
      return NextResponse.json({ 
        error: 'Cannot log adherence for date after medication end date' 
      }, { status: 400 });
    }

    // Validate adherence status logic
    if (validatedData.status === 'taken' && actualTime && actualTime > scheduledTime) {
      const delayMinutes = (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
      if (delayMinutes > 60) { // More than 1 hour late
        return NextResponse.json({ 
          error: 'Medication taken more than 1 hour late should be logged as late status' 
        }, { status: 400 });
      }
    }

    if (validatedData.status === 'late' && (!actualTime || actualTime <= scheduledTime)) {
      return NextResponse.json({ 
        error: 'late status requires actualDatetime to be after scheduledDatetime' 
      }, { status: 400 });
    }

    // Check for duplicate logs
    const existingLog = await prisma.adherenceLog.findFirst({
      where: {
        relatedMedicationId: validatedData.relatedMedicationId,
        scheduledDatetime: scheduledTime
      }
    });

    if (existingLog) {
      return NextResponse.json({ 
        error: 'Adherence already logged for this medication at this scheduled time',
        existingLog: {
          id: existingLog.id,
          status: existingLog.status,
          loggedAt: existingLog.createdAt
        }
      }, { status: 409 });
    }

    // Validate device reading if provided
    let deviceReading = null;
    if (validatedData.deviceReadingId) {
      deviceReading = await prisma.deviceReading.findUnique({
        where: { id: validatedData.deviceReadingId },
        include: {
          device: { select: { deviceName: true, deviceType: true } }
        }
      });
      
      if (!deviceReading) {
        return NextResponse.json({ error: 'Device reading not found' }, { status: 404 });
      }
      
      // Verify device reading matches medication timing
      const readingTime = new Date(deviceReading.createdAt);
      const timeDiff = Math.abs(readingTime.getTime() - (actualTime?.getTime() || scheduledTime.getTime()));
      if (timeDiff > 30 * 60 * 1000) { // More than 30 minutes difference
        return NextResponse.json({ 
          error: 'Device reading time does not match medication time within acceptable range' 
        }, { status: 400 });
      }
    }

    // Create adherence log entry
    const adherenceLog = await prisma.adherenceLog.create({
      data: {
        patientId: medication.patientId,
        adherenceType: 'medication',
        relatedMedicationId: validatedData.relatedMedicationId,
        scheduledDatetime: scheduledTime,
        actualDatetime: actualTime,
        status: validatedData.status,
        prescribedDose: medication.dosage,
        actualDose: validatedData.actualDose,
        patientNotes: validatedData.patientNotes,
        recordedBy: validatedData.recordedBy,
        deviceReadingId: validatedData.deviceReadingId,
        sideEffectsReported: validatedData.sideEffectsReported || [],
        location: validatedData.location,
        reminderEffectiveness: validatedData.reminderEffectiveness,
        recordedByUserId: loggedBy,
        organizationId: session.user.organizationId
      },
      include: {
        relatedMedication: {
          include: {
            medicine: { select: { name: true, type: true, details: true } },
            patient: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    // Check if this creates any adherence alerts
    const shouldCreateAlert = await checkForAdherenceAlerts({
      medicationId: validatedData.relatedMedicationId,
      patientId: medication.patientId,
      status: validatedData.status,
      recentLogs: 5 // Check last 5 logs
    });

    let alert = null;
    if (shouldCreateAlert) {
      alert = await createAdherenceAlert({
        patientId: medication.patientId,
        medicationId: validatedData.relatedMedicationId,
        alertType: shouldCreateAlert.type,
        severity: shouldCreateAlert.severity,
        message: shouldCreateAlert.message
      });
    }

    // Calculate updated adherence rate
    const recentAdherenceRate = await calculateRecentAdherenceRate(
      validatedData.medicationId,
      30 // Last 30 days
    );

    return NextResponse.json({
      message: 'Medication adherence logged successfully',
      adherenceLog: {
        id: adherenceLog.id,
        medication: {
          name: adherenceLog.relatedMedication?.medicine?.name || 'Unknown',
          dosageForm: (adherenceLog.relatedMedication?.medicine?.details as any)?.dosage_form || null
        },
        patient: {
          name: `${adherenceLog.patient.user.firstName} ${adherenceLog.patient.user.lastName}`
        },
        scheduledTime: adherenceLog.scheduledDatetime,
        actualTime: adherenceLog.actualDatetime,
        status: adherenceLog.status,
        dosageTaken: adherenceLog.actualDose,
        recordedBy: adherenceLog.recordedBy,
        isIoTVerified: false, // Remove device reading for now
        deviceInfo: null,
        loggedAt: adherenceLog.createdAt
      },
      adherenceMetrics: {
        recentAdherenceRate: recentAdherenceRate,
        missedDosesLast7Days: await countMissedDoses(validatedData.medicationId, 7),
        streakDays: await calculateAdherenceStreak(validatedData.medicationId)
      },
      alert: alert ? {
        type: alert.alertType,
        severity: alert.severity,
        message: alert.message
      } : null,
      nextSteps: {
        viewTimeline: `Use GET /api/medications/adherence/timeline?medicationId=${validatedData.medicationId}`,
        viewAnalytics: `Use GET /api/medications/adherence/analytics?patientId=${medication.patientId}`,
        manageReminders: 'Configure medication reminders for better adherence'
      }
    });

  } catch (error) {
    console.error('Error logging medication adherence:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to log medication adherence' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const queryData = getLogsSchema.parse({
      relatedMedicationId: searchParams.get('medicationId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') || undefined,
      recordedBy: searchParams.get('recordedBy') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
    });

    // Build filter based on user permissions
    const logFilter: LogFilter = {};
    let hasAccess = false;

    if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id },
      });
      if (patient) {
        logFilter.patientId = patient.id;
        hasAccess = true;
      }
    } else if (session.user.role === 'DOCTOR') {
      if (queryData.patientId) {
        const doctorAccess = await prisma.patient.findFirst({
          where: {
            id: queryData.patientId,
            OR: [
              { primaryCareDoctorId: session.user.id },
              {
                patientDoctorAssignments: {
                  some: {
                    doctorId: session.user.id,
                    status: 'ACTIVE',
                  },
                },
              },
            ],
          },
        });
        if (doctorAccess) {
          logFilter.patientId = queryData.patientId;
          hasAccess = true;
        }
      }
    } else if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      if (queryData.patientId) {
        logFilter.patientId = queryData.patientId;
      }
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Add additional filters
    if (queryData.relatedMedicationId) logFilter.relatedMedicationId = queryData.relatedMedicationId;
    if (queryData.status) logFilter.status = queryData.status.toLowerCase();
    if (queryData.recordedBy) logFilter.recordedBy = queryData.recordedBy;
    if (queryData.startDate || queryData.endDate) {
      logFilter.scheduledDatetime = {
        ...(queryData.startDate && { gte: new Date(queryData.startDate) }),
        ...(queryData.endDate && { lte: new Date(queryData.endDate + 'T23:59:59.999Z') }),
      };
    }

    // Get logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.adherenceLog.findMany({
        where: logFilter,
        include: {
          relatedMedication: {
            include: {
              medicine: { select: { name: true, type: true, details: true } },
              patient: {
                include: {
                  user: { select: { firstName: true, lastName: true } }
                }
              }
            }
          },
          patient: {
            include: {
              user: { select: { firstName: true, lastName: true } }
            }
          }
        },
        orderBy: { scheduledDatetime: 'desc' },
        take: queryData.limit,
        skip: queryData.offset
      }),
      prisma.adherenceLog.count({ where: logFilter })
    ]);

    return NextResponse.json({
      message: 'Medication adherence logs retrieved successfully',
      logs: logs.map(log => ({
        id: log.id,
        medication: {
          id: log.relatedMedicationId,
          name: log.relatedMedication?.medicine?.name || 'Unknown',
          dosageForm: (log.relatedMedication?.medicine?.details as any)?.dosage_form || null,
          category: (log.relatedMedication?.medicine?.details as any)?.drug_class || null
        },
        patient: session.user.role !== 'PATIENT' ? {
          name: `${log.patient.user.firstName} ${log.patient.user.lastName}`
        } : undefined,
        scheduledTime: log.scheduledDatetime,
        actualTime: log.actualDatetime,
        status: log.status,
        dosageTaken: log.actualDose,
        notes: log.notes,
        recordedBy: log.recordedBy,
        sideEffectsReported: log.sideEffectsReported,
        location: log.location,
        reminderEffectiveness: log.reminderEffectiveness,
        isIoTVerified: !!log.deviceReading,
        deviceInfo: log.deviceReading ? {
          deviceName: log.deviceReading.device.deviceName,
          deviceType: log.deviceReading.device.deviceType
        } : null,
        loggedAt: log.createdAt
      })),
      pagination: {
        total: totalCount,
        limit: queryData.limit,
        offset: queryData.offset,
        hasMore: queryData.offset + queryData.limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching adherence logs:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch adherence logs' }, { status: 500 });
  }
}

async function checkForAdherenceAlerts(params: {
  medicationId: string;
  patientId: string;
  status: string;
  recentLogs: number;
}) {
  const { medicationId, patientId, status, recentLogs } = params;

  // Get recent adherence logs
  const recent = await prisma.adherenceLog.findMany({
    where: {
      relatedMedicationId: medicationId,
      scheduledDatetime: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    orderBy: { scheduledDatetime: 'desc' },
    take: recentLogs
  });

  // Check for patterns that warrant alerts
  const missedCount = recent.filter(log => log.status === 'missed').length;
  const lateCount = recent.filter(log => log.status === 'late').length;

  if (missedCount >= 3) {
    return {
      type: 'HIGH_MISSED_DOSES',
      severity: 'HIGH',
      message: `${missedCount} missed doses in the last 7 days`
    };
  }

  if (lateCount >= 3) {
    return {
      type: 'FREQUENT_LATE_DOSES',
      severity: 'MEDIUM',
      message: `${lateCount} late doses in the last 7 days`
    };
  }

  return null;
}

async function createAdherenceAlert(params: {
  patientId: string;
  medicationId: string;
  alertType: string;
  severity: string;
  message: string;
}) {
  return await prisma.patientAlert.create({
    data: {
      patientId: params.patientId,
      medicationId: params.medicationId,
      alertType: 'MEDICATION',
      severity: params.severity,
      message: params.message,
      isActive: true,
      createdAt: new Date()
    }
  });
}

async function calculateRecentAdherenceRate(medicationId: string, days: number) {
  const logs = await prisma.adherenceLog.findMany({
    where: {
      relatedMedicationId: medicationId,
      scheduledDatetime: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    }
  });

  if (logs.length === 0) return 0;

  const takenOrLate = logs.filter(log => 
    log.status === 'taken' || log.status === 'late'
  ).length;

  return Math.round((takenOrLate / logs.length) * 100);
}

async function countMissedDoses(medicationId: string, days: number) {
  return await prisma.adherenceLog.count({
    where: {
      relatedMedicationId: medicationId,
      status: 'missed',
      scheduledDatetime: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    }
  });
}

async function calculateAdherenceStreak(medicationId: string) {
  const recentLogs = await prisma.adherenceLog.findMany({
    where: {
      relatedMedicationId: medicationId,
      scheduledDatetime: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    orderBy: { scheduledDatetime: 'desc' },
    take: 30
  });

  let streak = 0;
  for (const log of recentLogs) {
    if (log.status === 'taken' || log.status === 'late') {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
