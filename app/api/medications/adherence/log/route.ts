import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface LogFilter {
  patientId?: string;
  medicationId?: string;
  adherenceStatus?: string;
  logMethod?: string;
  scheduledTime?: {
    gte?: Date;
    lte?: Date;
  };
}

const logAdherenceSchema = z.object({
  medicationId: z.string().uuid(),
  scheduledTime: z.string().datetime(),
  actualTime: z.string().datetime().optional(),
  adherenceStatus: z.enum(['TAKEN', 'MISSED', 'LATE', 'PARTIAL']),
  dosageTaken: z.number().positive().optional(),
  notes: z.string().optional(),
  logMethod: z.enum(['MANUAL', 'IOT_DEVICE', 'SMARTPHONE_APP', 'CAREGIVER']).default('MANUAL'),
  deviceReadingId: z.string().uuid().optional(),
  sideEffects: z.array(z.string()).optional(),
  location: z.string().optional(),
  reminderEffectiveness: z.enum(['HELPFUL', 'NOT_HELPFUL', 'NO_REMINDER']).optional()
});

const getLogsSchema = z.object({
  medicationId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  status: z.enum(['TAKEN', 'MISSED', 'LATE', 'PARTIAL']).optional(),
  logMethod: z.enum(['MANUAL', 'IOT_DEVICE', 'SMARTPHONE_APP', 'CAREGIVER']).optional(),
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
      where: { id: validatedData.medicationId },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        medicine: { 
          select: { name: true, dosageForm: true, category: true }
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
    const scheduledTime = new Date(validatedData.scheduledTime);
    const actualTime = validatedData.actualTime ? new Date(validatedData.actualTime) : null;
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
    if (validatedData.adherenceStatus === 'TAKEN' && actualTime && actualTime > scheduledTime) {
      const delayMinutes = (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
      if (delayMinutes > 60) { // More than 1 hour late
        return NextResponse.json({ 
          error: 'Medication taken more than 1 hour late should be logged as LATE status' 
        }, { status: 400 });
      }
    }

    if (validatedData.adherenceStatus === 'LATE' && (!actualTime || actualTime <= scheduledTime)) {
      return NextResponse.json({ 
        error: 'LATE status requires actualTime to be after scheduledTime' 
      }, { status: 400 });
    }

    // Check for duplicate logs
    const existingLog = await prisma.adherenceLog.findFirst({
      where: {
        medicationId: validatedData.medicationId,
        scheduledTime: scheduledTime
      }
    });

    if (existingLog) {
      return NextResponse.json({ 
        error: 'Adherence already logged for this medication at this scheduled time',
        existingLog: {
          id: existingLog.id,
          status: existingLog.adherenceStatus,
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
          medicalDevice: { select: { deviceName: true, deviceType: true } }
        }
      });
      
      if (!deviceReading) {
        return NextResponse.json({ error: 'Device reading not found' }, { status: 404 });
      }
      
      // Verify device reading matches medication timing
      const readingTime = new Date(deviceReading.recordedAt);
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
        medicationId: validatedData.medicationId,
        scheduledTime,
        actualTime,
        adherenceStatus: validatedData.adherenceStatus,
        dosageTaken: validatedData.dosageTaken || medication.dosage,
        notes: validatedData.notes,
        logMethod: validatedData.logMethod,
        deviceReadingId: validatedData.deviceReadingId,
        sideEffects: validatedData.sideEffects || [],
        location: validatedData.location,
        reminderEffectiveness: validatedData.reminderEffectiveness,
        loggedBy,
        patientId: medication.patientId,
        createdAt: now
      },
      include: {
        medication: {
          include: {
            medicine: { select: { name: true, dosageForm: true } },
            patient: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        },
        deviceReading: {
          include: {
            medicalDevice: { select: { deviceName: true, deviceType: true } }
          }
        }
      }
    });

    // Check if this creates any adherence alerts
    const shouldCreateAlert = await checkForAdherenceAlerts({
      medicationId: validatedData.medicationId,
      patientId: medication.patientId,
      adherenceStatus: validatedData.adherenceStatus,
      recentLogs: 5 // Check last 5 logs
    });

    let alert = null;
    if (shouldCreateAlert) {
      alert = await createAdherenceAlert({
        patientId: medication.patientId,
        medicationId: validatedData.medicationId,
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
          name: adherenceLog.medication.medicine.name,
          dosageForm: adherenceLog.medication.medicine.dosageForm
        },
        patient: {
          name: `${adherenceLog.medication.patient.user.firstName} ${adherenceLog.medication.patient.user.lastName}`
        },
        scheduledTime: adherenceLog.scheduledTime,
        actualTime: adherenceLog.actualTime,
        status: adherenceLog.adherenceStatus,
        dosageTaken: adherenceLog.dosageTaken,
        logMethod: adherenceLog.logMethod,
        isIoTVerified: !!adherenceLog.deviceReading,
        deviceInfo: adherenceLog.deviceReading ? {
          deviceName: adherenceLog.deviceReading.medicalDevice.deviceName,
          deviceType: adherenceLog.deviceReading.medicalDevice.deviceType
        } : null,
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
      medicationId: searchParams.get('medicationId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') || undefined,
      logMethod: searchParams.get('logMethod') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0')
    });

    // Build filter based on user permissions
    let hasAccess = false;
    const logFilter: LogFilter = {};

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
    if (queryData.medicationId) logFilter.medicationId = queryData.medicationId;
    if (queryData.status) logFilter.adherenceStatus = queryData.status;
    if (queryData.logMethod) logFilter.logMethod = queryData.logMethod;
    if (queryData.startDate || queryData.endDate) {
      logFilter.scheduledTime = {
        ...(queryData.startDate && { gte: new Date(queryData.startDate) }),
        ...(queryData.endDate && { lte: new Date(queryData.endDate + 'T23:59:59.999Z') }),
      };
    }

    // Get logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.adherenceLog.findMany({
        where: logFilter,
        include: {
          medication: {
            include: {
              medicine: { select: { name: true, dosageForm: true, category: true } },
              patient: {
                include: {
                  user: { select: { firstName: true, lastName: true } }
                }
              }
            }
          },
          deviceReading: {
            include: {
              medicalDevice: { select: { deviceName: true, deviceType: true } }
            }
          }
        },
        orderBy: { scheduledTime: 'desc' },
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
          id: log.medicationId,
          name: log.medication.medicine.name,
          dosageForm: log.medication.medicine.dosageForm,
          category: log.medication.medicine.category
        },
        patient: session.user.role !== 'PATIENT' ? {
          name: `${log.medication.patient.user.firstName} ${log.medication.patient.user.lastName}`
        } : undefined,
        scheduledTime: log.scheduledTime,
        actualTime: log.actualTime,
        status: log.adherenceStatus,
        dosageTaken: log.dosageTaken,
        notes: log.notes,
        logMethod: log.logMethod,
        sideEffects: log.sideEffects,
        location: log.location,
        reminderEffectiveness: log.reminderEffectiveness,
        isIoTVerified: !!log.deviceReading,
        deviceInfo: log.deviceReading ? {
          deviceName: log.deviceReading.medicalDevice.deviceName,
          deviceType: log.deviceReading.medicalDevice.deviceType
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
  adherenceStatus: string;
  recentLogs: number;
}) {
  const { medicationId, patientId, adherenceStatus, recentLogs } = params;

  // Get recent adherence logs
  const recent = await prisma.adherenceLog.findMany({
    where: {
      medicationId,
      scheduledTime: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    orderBy: { scheduledTime: 'desc' },
    take: recentLogs
  });

  // Check for patterns that warrant alerts
  const missedCount = recent.filter(log => log.adherenceStatus === 'MISSED').length;
  const lateCount = recent.filter(log => log.adherenceStatus === 'LATE').length;

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
  return await prisma.adherenceAlert.create({
    data: {
      patientId: params.patientId,
      medicationId: params.medicationId,
      alertType: params.alertType,
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
      medicationId,
      scheduledTime: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    }
  });

  if (logs.length === 0) return 0;

  const takenOrLate = logs.filter(log => 
    log.adherenceStatus === 'TAKEN' || log.adherenceStatus === 'LATE'
  ).length;

  return Math.round((takenOrLate / logs.length) * 100);
}

async function countMissedDoses(medicationId: string, days: number) {
  return await prisma.adherenceLog.count({
    where: {
      medicationId,
      adherenceStatus: 'MISSED',
      scheduledTime: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    }
  });
}

async function calculateAdherenceStreak(medicationId: string) {
  const recentLogs = await prisma.adherenceLog.findMany({
    where: {
      medicationId,
      scheduledTime: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    orderBy: { scheduledTime: 'desc' },
    take: 30
  });

  let streak = 0;
  for (const log of recentLogs) {
    if (log.adherenceStatus === 'TAKEN' || log.adherenceStatus === 'LATE') {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}