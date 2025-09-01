import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const recordVitalSchema = z.object({
  patientId: z.string().uuid(),
  vitalTemplateId: z.string().uuid(),
  value: z.number().positive(),
  unit: z.string().min(1),
  deviceReadingId: z.string().uuid().optional(),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.object({
    deviceName: z.string().optional(),
    deviceSerial: z.string().optional(),
    calibrationDate: z.string().datetime().optional(),
    batteryLevel: z.number().min(0).max(100).optional(),
    signalStrength: z.number().optional()
  }).optional()
});

const getVitalsSchema = z.object({
  patientId: z.string().uuid().optional(),
  vitalTemplateId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  alertLevel: z.enum(['NORMAL', 'WARNING', 'CRITICAL', 'EMERGENCY']).optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0),
  includeDeviceInfo: z.boolean().default(false),
  includeTrends: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = recordVitalSchema.parse(body);

    // Verify patient exists and user has access
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        primaryCareDoctor: {
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Permission check: Patient themselves, their doctors, HSPs, or admins
    let hasAccess = false;
    if (session.user.role === 'PATIENT') {
      hasAccess = session.user.id === patient.userId;
    } else if (session.user.role === 'DOCTOR') {
      const doctorAccess = await prisma.patient.findFirst({
        where: {
          id: validatedData.patientId,
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
      return NextResponse.json({ error: 'Insufficient permissions to record vital signs' }, { status: 403 });
    }

    // Get vital template for validation
    const vitalTemplate = await prisma.vitalTemplate.findUnique({
      where: { id: validatedData.vitalTemplateId }
    });

    if (!vitalTemplate) {
      return NextResponse.json({ error: 'Vital template not found' }, { status: 404 });
    }

    // Validate unit compatibility
    if (validatedData.unit !== vitalTemplate.unit) {
      return NextResponse.json({ 
        error: `Unit mismatch: expected ${vitalTemplate.unit}, got ${validatedData.unit}` 
      }, { status: 400 });
    }

    // Validate device reading if provided
    let deviceReading = null;
    if (validatedData.deviceReadingId) {
      deviceReading = await prisma.deviceReading.findUnique({
        where: { id: validatedData.deviceReadingId },
        include: {
          medicalDevice: { select: { deviceName: true, deviceType: true, serialNumber: true } }
        }
      });
      
      if (!deviceReading) {
        return NextResponse.json({ error: 'Device reading not found' }, { status: 404 });
      }

      // Verify device reading timestamp is recent (within 1 hour)
      const readingAge = Date.now() - deviceReading.recordedAt.getTime();
      if (readingAge > 60 * 60 * 1000) {
        return NextResponse.json({ 
          error: 'Device reading is too old. Please use a recent reading.' 
        }, { status: 400 });
      }
    }

    // Calculate alert level based on vital value
    const alertAnalysis = calculateVitalAlert(validatedData.value, vitalTemplate);

    // Create vital reading record
    const recordedAt = validatedData.recordedAt ? new Date(validatedData.recordedAt) : new Date();
    
    const vitalReading = await prisma.vitalReading.create({
      data: {
        patientId: validatedData.patientId,
        vitalTemplateId: validatedData.vitalTemplateId,
        value: validatedData.value,
        unit: validatedData.unit,
        deviceReadingId: validatedData.deviceReadingId,
        readingTime: recordedAt,
        recordedBy: session.user.id,
        alertLevel: alertAnalysis.alertLevel,
        alertReasons: alertAnalysis.reasons,
        notes: validatedData.notes,
        location: validatedData.location,
        tags: validatedData.tags,
        metadata: validatedData.metadata || {},
        isVerified: !!deviceReading,
        verifiedAt: deviceReading ? new Date() : null,
        verifiedBy: deviceReading ? session.user.id : null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        vitalTemplate: { select: { name: true, category: true, unit: true } },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        deviceReading: {
          include: {
            medicalDevice: { select: { deviceName: true, deviceType: true } }
          }
        }
      }
    });

    // Create alert if needed
    let alertCreated = null;
    if (alertAnalysis.alertLevel !== 'NORMAL') {
      alertCreated = await createVitalAlert({
        patientId: validatedData.patientId,
        vitalReadingId: vitalReading.id,
        alertLevel: alertAnalysis.alertLevel,
        vitalName: vitalTemplate.name,
        value: validatedData.value,
        unit: validatedData.unit,
        reasons: alertAnalysis.reasons,
        recommendedActions: alertAnalysis.recommendedActions
      });

      // Notify healthcare providers if critical
      if (['CRITICAL', 'EMERGENCY'].includes(alertAnalysis.alertLevel)) {
        await notifyHealthcareProviders({
          patientId: validatedData.patientId,
          alertLevel: alertAnalysis.alertLevel,
          vitalName: vitalTemplate.name,
          value: validatedData.value,
          unit: validatedData.unit,
          patientName: `${patient.user.firstName} ${patient.user.lastName}`
        });
      }
    }

    // Calculate trends
    const trends = await calculateVitalTrends({
      patientId: validatedData.patientId,
      vitalTemplateId: validatedData.vitalTemplateId,
      currentValue: validatedData.value,
      timeframe: '7d'
    });

    return NextResponse.json({
      message: 'Vital signs recorded successfully',
      vitalReading: {
        id: vitalReading.id,
        vitalTemplate: vitalReading.vitalTemplate,
        patient: {
          name: `${vitalReading.patient.user.firstName} ${vitalReading.patient.user.lastName}`
        },
        value: vitalReading.value,
        unit: vitalReading.unit,
        recordedAt: vitalReading.readingTime,
        alertLevel: vitalReading.alertLevel,
        alertReasons: vitalReading.alertReasons,
        isVerified: vitalReading.isVerified,
        deviceInfo: vitalReading.deviceReading ? {
          deviceName: vitalReading.deviceReading.medicalDevice.deviceName,
          deviceType: vitalReading.deviceReading.medicalDevice.deviceType
        } : null,
        notes: vitalReading.notes,
        location: vitalReading.location,
        tags: vitalReading.tags
      },
      alert: alertCreated ? {
        id: alertCreated.id,
        level: alertCreated.alertLevel,
        message: alertCreated.message,
        recommendedActions: alertCreated.recommendedActions
      } : null,
      trends: trends,
      nextSteps: getVitalNextSteps(alertAnalysis.alertLevel, vitalTemplate.name, trends)
    });

  } catch (error) {
    console.error('Error recording vital signs:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to record vital signs' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const queryData = getVitalsSchema.parse({
      patientId: searchParams.get('patientId') || undefined,
      vitalTemplateId: searchParams.get('vitalTemplateId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      alertLevel: searchParams.get('alertLevel') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
      includeDeviceInfo: searchParams.get('includeDeviceInfo') === 'true',
      includeTrends: searchParams.get('includeTrends') === 'true'
    });

    // Build filter based on user permissions
    const vitalsFilter: any = {};
    let hasAccess = false;

    if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id }
      });
      if (patient) {
        vitalsFilter.patientId = patient.id;
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
                    status: 'ACTIVE'
                  }
                }
              }
            ]
          }
        });
        if (doctorAccess) {
          vitalsFilter.patientId = queryData.patientId;
          hasAccess = true;
        }
      }
    } else if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      if (queryData.patientId) {
        vitalsFilter.patientId = queryData.patientId;
      }
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Add additional filters
    if (queryData.vitalTemplateId) {
      vitalsFilter.vitalTemplateId = queryData.vitalTemplateId;
    }

    if (queryData.alertLevel) {
      vitalsFilter.alertLevel = queryData.alertLevel;
    }

    if (queryData.startDate || queryData.endDate) {
      vitalsFilter.readingTime = {};
      if (queryData.startDate) {
        vitalsFilter.readingTime.gte = new Date(queryData.startDate);
      }
      if (queryData.endDate) {
        vitalsFilter.readingTime.lte = new Date(queryData.endDate + 'T23:59:59.999Z');
      }
    }

    // Get vitals with pagination
    const [vitals, totalCount] = await Promise.all([
      prisma.vitalReading.findMany({
        where: vitalsFilter,
        include: {
          vitalTemplate: { select: { name: true, category: true, unit: true, normalRange: true } },
          patient: session.user.role !== 'PATIENT' ? {
            include: {
              user: { select: { firstName: true, lastName: true } }
            }
          } : false,
          deviceReading: queryData.includeDeviceInfo ? {
            include: {
              medicalDevice: { select: { deviceName: true, deviceType: true, serialNumber: true } }
            }
          } : false
        },
        orderBy: { readingTime: 'desc' },
        take: queryData.limit,
        skip: queryData.offset
      }),
      prisma.vitalReading.count({ where: vitalsFilter })
    ]);

    return NextResponse.json({
      message: 'Vital readings retrieved successfully',
      vitals: vitals.map(vital => ({
        id: vital.id,
        vitalTemplate: vital.vitalTemplate,
        patient: vital.patient ? {
          name: `${vital.patient.user.firstName} ${vital.patient.user.lastName}`
        } : undefined,
        value: vital.value,
        unit: vital.unit,
        recordedAt: vital.readingTime,
        alertLevel: vital.alertLevel,
        alertReasons: vital.alertReasons,
        isVerified: vital.isVerified,
        verifiedAt: vital.verifiedAt,
        deviceInfo: vital.deviceReading ? {
          deviceName: vital.deviceReading.medicalDevice.deviceName,
          deviceType: vital.deviceReading.medicalDevice.deviceType,
          serialNumber: vital.deviceReading.medicalDevice.serialNumber
        } : null,
        notes: vital.notes,
        location: vital.location,
        tags: vital.tags,
        metadata: vital.metadata
      })),
      pagination: {
        total: totalCount,
        limit: queryData.limit,
        offset: queryData.offset,
        hasMore: queryData.offset + queryData.limit < totalCount
      },
      summary: {
        totalReadings: totalCount,
        alertBreakdown: await getAlertBreakdown(vitalsFilter),
        lastReading: vitals.length > 0 ? vitals[0].readingTime : null
      }
    });

  } catch (error) {
    console.error('Error fetching vital readings:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch vital readings' }, { status: 500 });
  }
}

function calculateVitalAlert(value: number, vitalTemplate: any) {
  const normalRange = vitalTemplate.normalRange || {};
  
  let alertLevel = 'NORMAL';
  const reasons = [];
  const recommendedActions = [];

  // Check against normal ranges
  if (normalRange.min !== null && value < normalRange.min) {
    if (value < normalRange.min * 0.8) {
      alertLevel = 'CRITICAL';
      reasons.push(`Value significantly below normal range (${normalRange.min}${vitalTemplate.unit})`);
      recommendedActions.push('Immediate medical consultation required');
    } else {
      alertLevel = 'WARNING';
      reasons.push(`Value below normal range (${normalRange.min}${vitalTemplate.unit})`);
      recommendedActions.push('Monitor closely and consult healthcare provider');
    }
  }

  if (normalRange.max !== null && value > normalRange.max) {
    if (value > normalRange.max * 1.2) {
      alertLevel = 'CRITICAL';
      reasons.push(`Value significantly above normal range (${normalRange.max}${vitalTemplate.unit})`);
      recommendedActions.push('Immediate medical consultation required');
    } else {
      alertLevel = 'WARNING';
      reasons.push(`Value above normal range (${normalRange.max}${vitalTemplate.unit})`);
      recommendedActions.push('Monitor closely and consult healthcare provider');
    }
  }

  // Check emergency thresholds
  if (vitalTemplate.name.toLowerCase().includes('blood pressure')) {
    if (value > 180) {
      alertLevel = 'EMERGENCY';
      reasons.push('Hypertensive crisis detected');
      recommendedActions.push('Seek emergency medical care immediately');
    }
  }

  if (vitalTemplate.name.toLowerCase().includes('heart rate')) {
    if (value > 120 || value < 50) {
      alertLevel = value > 150 || value < 40 ? 'EMERGENCY' : 'CRITICAL';
      reasons.push(`${value > 120 ? 'Tachycardia' : 'Bradycardia'} detected`);
      recommendedActions.push('Contact healthcare provider immediately');
    }
  }

  return { alertLevel, reasons, recommendedActions };
}

async function createVitalAlert(params: {
  patientId: string;
  vitalReadingId: string;
  alertLevel: string;
  vitalName: string;
  value: number;
  unit: string;
  reasons: string[];
  recommendedActions: string[];
}) {
  return await prisma.vitalAlert.create({
    data: {
      patientId: params.patientId,
      vitalReadingId: params.vitalReadingId,
      alertLevel: params.alertLevel,
      vitalType: params.vitalName,
      message: `${params.vitalName}: ${params.value}${params.unit} - ${params.reasons.join(', ')}`,
      reasons: params.reasons,
      recommendedActions: params.recommendedActions,
      isActive: true,
      createdAt: new Date()
    }
  });
}

async function notifyHealthcareProviders(params: {
  patientId: string;
  alertLevel: string;
  vitalName: string;
  value: number;
  unit: string;
  patientName: string;
}) {
  console.log(`🚨 ${params.alertLevel} ALERT: ${params.patientName} - ${params.vitalName}: ${params.value}${params.unit}`);
  
  return {
    smsNotifications: 1,
    pushNotifications: 1,
    emailNotifications: 1,
    emergencyAlerts: params.alertLevel === 'EMERGENCY' ? 1 : 0
  };
}

async function calculateVitalTrends(params: {
  patientId: string;
  vitalTemplateId: string;
  currentValue: number;
  timeframe: string;
}) {
  const days = params.timeframe === '7d' ? 7 : 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const historicalReadings = await prisma.vitalReading.findMany({
    where: {
      patientId: params.patientId,
      vitalTemplateId: params.vitalTemplateId,
      readingTime: { gte: startDate }
    },
    orderBy: { readingTime: 'asc' },
    select: { value: true, readingTime: true }
  });

  if (historicalReadings.length < 2) {
    return { trend: 'INSUFFICIENT_DATA', change: 0, readings: historicalReadings.length };
  }

  const values = historicalReadings.map(r => r.value);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const change = params.currentValue - average;
  const percentChange = (change / average) * 100;

  let trend: string;
  if (Math.abs(percentChange) < 5) {
    trend = 'STABLE';
  } else if (change > 0) {
    trend = 'INCREASING';
  } else {
    trend = 'DECREASING';
  }

  return {
    trend,
    change: Math.round(change * 100) / 100,
    percentChange: Math.round(percentChange * 100) / 100,
    average: Math.round(average * 100) / 100,
    readings: historicalReadings.length,
    timeframe: params.timeframe
  };
}

async function getAlertBreakdown(filter: any) {
  const alertCounts = await prisma.vitalReading.groupBy({
    by: ['alertLevel'],
    where: filter,
    _count: { alertLevel: true }
  });

  return alertCounts.reduce((acc, item) => {
    acc[item.alertLevel] = item._count.alertLevel;
    return acc;
  }, {} as Record<string, number>);
}

function getVitalNextSteps(alertLevel: string, vitalName: string, trends: any) {
  const steps = [];

  if (alertLevel === 'EMERGENCY') {
    steps.push({
      priority: 'CRITICAL',
      action: 'SEEK_EMERGENCY_CARE',
      message: 'Seek immediate emergency medical care',
      timeframe: 'IMMEDIATE'
    });
  } else if (alertLevel === 'CRITICAL') {
    steps.push({
      priority: 'HIGH',
      action: 'CONTACT_PROVIDER',
      message: 'Contact your healthcare provider immediately',
      timeframe: 'WITHIN_1_HOUR'
    });
  } else if (alertLevel === 'WARNING') {
    steps.push({
      priority: 'MEDIUM',
      action: 'MONITOR_CLOSELY',
      message: 'Monitor closely and schedule appointment with healthcare provider',
      timeframe: 'WITHIN_24_HOURS'
    });
  }

  if (trends && trends.trend !== 'STABLE') {
    steps.push({
      priority: 'LOW',
      action: 'TRACK_TRENDS',
      message: `${vitalName} shows ${trends.trend.toLowerCase()} trend. Continue monitoring.`,
      timeframe: 'ONGOING'
    });
  }

  return steps;
}
