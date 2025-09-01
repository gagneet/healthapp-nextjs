import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const timelineQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  medicationId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  includeAnalytics: z.boolean().default(true),
  includeTrends: z.boolean().default(true),
  includeAlerts: z.boolean().default(false)
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const queryData = timelineQuerySchema.parse({
      patientId: searchParams.get('patientId') || undefined,
      medicationId: searchParams.get('medicationId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      granularity: searchParams.get('granularity') || 'daily',
      includeAnalytics: searchParams.get('includeAnalytics') !== 'false',
      includeTrends: searchParams.get('includeTrends') !== 'false',
      includeAlerts: searchParams.get('includeAlerts') === 'true'
    });

    // Determine access permissions and filter criteria
    let patientFilter: any = {};
    let hasAccess = false;

    if (session.user.role === 'PATIENT') {
      // Patients can only view their own medication adherence
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id }
      });
      if (!patient) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
      }
      patientFilter = { patientId: patient.id };
      hasAccess = true;
    } else if (session.user.role === 'DOCTOR') {
      // Doctors can view their assigned patients' adherence
      if (queryData.patientId) {
        const hasPatientAccess = await prisma.patient.findFirst({
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
        if (hasPatientAccess) {
          patientFilter = { patientId: queryData.patientId };
          hasAccess = true;
        }
      } else {
        // Get all patients assigned to this doctor
        const assignedPatients = await prisma.patient.findMany({
          where: {
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
          },
          select: { id: true }
        });
        
        if (assignedPatients.length > 0) {
          patientFilter = { 
            patientId: { in: assignedPatients.map(p => p.id) } 
          };
          hasAccess = true;
        }
      }
    } else if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      // Admins can view all or specific patient adherence
      if (queryData.patientId) {
        patientFilter = { patientId: queryData.patientId };
      }
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions to view medication adherence' }, { status: 403 });
    }

    // Calculate date range
    const { startDate, endDate } = calculateDateRange(
      queryData.startDate,
      queryData.endDate,
      queryData.granularity
    );

    // Build medication filter
    const medicationFilter: any = {
      ...patientFilter,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (queryData.medicationId) {
      medicationFilter.medicationId = queryData.medicationId;
    }

    // Get adherence logs
    const adherenceLogs = await prisma.adherenceLog.findMany({
      where: medicationFilter,
      include: {
        medication: {
          include: {
            medicine: { 
              select: { name: true, dosageForm: true, category: true }
            },
            patient: {
              include: {
                user: { 
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        },
        deviceReading: {
          include: {
            medicalDevice: { 
              select: { deviceName: true, deviceType: true }
            }
          }
        }
      },
      orderBy: { scheduledTime: 'asc' }
    });

    // Process timeline data based on granularity
    const timelineData = processTimelineData(adherenceLogs, queryData.granularity);

    // Calculate analytics if requested
    let analytics = null;
    if (queryData.includeAnalytics) {
      analytics = calculateAdherenceAnalytics(adherenceLogs, startDate, endDate);
    }

    // Calculate trends if requested
    let trends = null;
    if (queryData.includeTrends) {
      trends = calculateAdherenceTrends(adherenceLogs, queryData.granularity);
    }

    // Get alerts if requested
    let alerts = null;
    if (queryData.includeAlerts) {
      alerts = await getAdherenceAlerts(patientFilter, medicationFilter);
    }

    // Prepare response
    const response = {
      message: 'Medication adherence timeline retrieved successfully',
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        granularity: queryData.granularity
      },
      timeline: timelineData,
      summary: {
        totalLogs: adherenceLogs.length,
        uniqueMedications: new Set(adherenceLogs.map(log => log.medicationId)).size,
        uniquePatients: session.user.role === 'PATIENT' ? 1 : new Set(adherenceLogs.map(log => log.medication.patientId)).size,
        datesCovered: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    };

    if (analytics) response.analytics = analytics;
    if (trends) response.trends = trends;
    if (alerts) response.alerts = alerts;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching medication adherence timeline:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch medication adherence timeline' }, { status: 500 });
  }
}

function calculateDateRange(startDate?: string, endDate?: string, granularity: string = 'daily') {
  const now = new Date();
  let calculatedStart: Date;
  let calculatedEnd: Date;

  if (startDate && endDate) {
    calculatedStart = new Date(startDate);
    calculatedEnd = new Date(endDate);
  } else {
    switch (granularity) {
      case 'daily':
        calculatedStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        calculatedEnd = new Date(now);
        break;
      case 'weekly':
        calculatedStart = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        calculatedEnd = new Date(now);
        break;
      case 'monthly':
        calculatedStart = new Date(now.getFullYear() - 1, now.getMonth(), 1); // Last 12 months
        calculatedEnd = new Date(now);
        break;
      default:
        calculatedStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        calculatedEnd = new Date(now);
    }
  }

  return { startDate: calculatedStart, endDate: calculatedEnd };
}

function processTimelineData(adherenceLogs: any[], granularity: string) {
  const timelineMap = new Map();

  adherenceLogs.forEach(log => {
    let timeKey: string;
    const logDate = new Date(log.scheduledTime);

    switch (granularity) {
      case 'daily':
        timeKey = logDate.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(logDate);
        weekStart.setDate(logDate.getDate() - logDate.getDay());
        timeKey = `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`;
        break;
      case 'monthly':
        timeKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        timeKey = logDate.toISOString().split('T')[0];
    }

    if (!timelineMap.has(timeKey)) {
      timelineMap.set(timeKey, {
        period: timeKey,
        logs: [],
        summary: {
          total: 0,
          taken: 0,
          missed: 0,
          late: 0,
          adherenceRate: 0
        },
        medications: new Set(),
        patients: new Set()
      });
    }

    const timeEntry = timelineMap.get(timeKey);
    timeEntry.logs.push({
      id: log.id,
      medicationName: log.medication.medicine.name,
      patientName: `${log.medication.patient.user.firstName} ${log.medication.patient.user.lastName}`,
      scheduledTime: log.scheduledTime,
      actualTime: log.actualTime,
      status: log.adherenceStatus,
      dosage: log.dosageTaken,
      method: log.logMethod,
      notes: log.notes,
      isIoTVerified: !!log.deviceReading
    });

    timeEntry.medications.add(log.medication.medicine.name);
    timeEntry.patients.add(`${log.medication.patient.user.firstName} ${log.medication.patient.user.lastName}`);
    
    timeEntry.summary.total++;
    switch (log.adherenceStatus) {
      case 'TAKEN':
        timeEntry.summary.taken++;
        break;
      case 'MISSED':
        timeEntry.summary.missed++;
        break;
      case 'LATE':
        timeEntry.summary.late++;
        timeEntry.summary.taken++; // Late is still taken
        break;
    }
    
    timeEntry.summary.adherenceRate = Math.round(
      (timeEntry.summary.taken / timeEntry.summary.total) * 100
    );
  });

  // Convert map to array and convert Sets to arrays
  return Array.from(timelineMap.values()).map(entry => ({
    ...entry,
    medications: Array.from(entry.medications),
    patients: Array.from(entry.patients)
  })).sort((a, b) => a.period.localeCompare(b.period));
}

function calculateAdherenceAnalytics(adherenceLogs: any[], startDate: Date, endDate: Date) {
  const totalLogs = adherenceLogs.length;
  if (totalLogs === 0) {
    return {
      overallAdherenceRate: 0,
      statusBreakdown: { TAKEN: 0, MISSED: 0, LATE: 0 },
      averageDelay: 0,
      iotVerificationRate: 0,
      riskFactors: []
    };
  }

  const statusCounts = { TAKEN: 0, MISSED: 0, LATE: 0 };
  let totalDelay = 0;
  let delayCount = 0;
  let iotVerified = 0;

  adherenceLogs.forEach(log => {
    statusCounts[log.adherenceStatus as keyof typeof statusCounts]++;
    
    if (log.adherenceStatus === 'LATE' && log.actualTime && log.scheduledTime) {
      const delay = (new Date(log.actualTime).getTime() - new Date(log.scheduledTime).getTime()) / (1000 * 60);
      totalDelay += delay;
      delayCount++;
    }
    
    if (log.deviceReading) {
      iotVerified++;
    }
  });

  const adherenceRate = Math.round(((statusCounts.TAKEN + statusCounts.LATE) / totalLogs) * 100);
  const averageDelay = delayCount > 0 ? Math.round(totalDelay / delayCount) : 0;
  const iotVerificationRate = Math.round((iotVerified / totalLogs) * 100);

  // Identify risk factors
  const riskFactors = [];
  if (adherenceRate < 80) riskFactors.push('LOW_ADHERENCE_RATE');
  if (statusCounts.MISSED / totalLogs > 0.2) riskFactors.push('HIGH_MISSED_DOSES');
  if (averageDelay > 120) riskFactors.push('FREQUENT_DELAYS');
  if (iotVerificationRate < 50) riskFactors.push('LOW_VERIFICATION_RATE');

  return {
    overallAdherenceRate: adherenceRate,
    statusBreakdown: statusCounts,
    averageDelay,
    iotVerificationRate,
    riskFactors,
    recommendations: generateAdherenceRecommendations(adherenceRate, statusCounts, averageDelay)
  };
}

function calculateAdherenceTrends(adherenceLogs: any[], granularity: string) {
  const trendData = processTimelineData(adherenceLogs, granularity);
  
  if (trendData.length < 2) {
    return { trend: 'INSUFFICIENT_DATA', change: 0, periods: trendData.length };
  }

  const rates = trendData.map(d => d.summary.adherenceRate);
  const firstHalf = rates.slice(0, Math.floor(rates.length / 2));
  const secondHalf = rates.slice(Math.floor(rates.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  let trend: string;
  
  if (Math.abs(change) < 5) {
    trend = 'STABLE';
  } else if (change > 0) {
    trend = 'IMPROVING';
  } else {
    trend = 'DECLINING';
  }

  return {
    trend,
    change: Math.round(change * 100) / 100,
    periods: trendData.length,
    recentRate: rates[rates.length - 1],
    bestRate: Math.max(...rates),
    worstRate: Math.min(...rates)
  };
}

async function getAdherenceAlerts(patientFilter: any, medicationFilter: any) {
  // Get recent missed doses
  const recentMissed = await prisma.adherenceLog.count({
    where: {
      ...patientFilter,
      adherenceStatus: 'MISSED',
      scheduledTime: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }
  });

  // Get medications with low adherence
  const lowAdherenceMeds = await prisma.adherenceLog.groupBy({
    by: ['medicationId'],
    where: {
      ...patientFilter,
      scheduledTime: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    _count: {
      adherenceStatus: true
    },
    having: {
      adherenceStatus: {
        _count: {
          gte: 5 // At least 5 logs
        }
      }
    }
  });

  const alerts = [];
  
  if (recentMissed > 3) {
    alerts.push({
      type: 'HIGH_MISSED_DOSES',
      severity: 'HIGH',
      message: `${recentMissed} missed doses in the last 7 days`,
      actionRequired: true
    });
  }
  
  if (lowAdherenceMeds.length > 0) {
    alerts.push({
      type: 'LOW_ADHERENCE_MEDICATIONS',
      severity: 'MEDIUM',
      message: `${lowAdherenceMeds.length} medications with concerning adherence patterns`,
      actionRequired: false
    });
  }

  return alerts;
}

function generateAdherenceRecommendations(adherenceRate: number, statusCounts: any, averageDelay: number) {
  const recommendations = [];

  if (adherenceRate < 80) {
    recommendations.push({
      type: 'ADHERENCE_SUPPORT',
      message: 'Consider medication adherence counseling or support programs',
      priority: 'HIGH'
    });
  }

  if (statusCounts.MISSED > statusCounts.TAKEN * 0.2) {
    recommendations.push({
      type: 'REMINDER_SYSTEM',
      message: 'Implement or enhance medication reminder systems',
      priority: 'MEDIUM'
    });
  }

  if (averageDelay > 120) {
    recommendations.push({
      type: 'TIMING_OPTIMIZATION',
      message: 'Review and optimize medication scheduling to reduce delays',
      priority: 'MEDIUM'
    });
  }

  return recommendations;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}