import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const conflictCheckSchema = z.object({
  doctorId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  appointmentType: z.string().default('consultation'),
  duration: z.number().min(10).max(180).default(30), // minutes
  excludeAppointmentId: z.string().uuid().optional(),
  checkAvailability: z.boolean().default(true),
  checkDoubleBooking: z.boolean().default(true),
  checkBreakTimes: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const queryData = conflictCheckSchema.parse({
      doctorId: searchParams.get('doctorId') || '',
      startTime: searchParams.get('startTime') || '',
      endTime: searchParams.get('endTime') || undefined,
      appointmentType: searchParams.get('appointmentType') || 'consultation',
      duration: parseInt(searchParams.get('duration') || '30'),
      excludeAppointmentId: searchParams.get('excludeAppointmentId') || undefined,
      checkAvailability: searchParams.get('checkAvailability') !== 'false',
      checkDoubleBooking: searchParams.get('checkDoubleBooking') !== 'false',
      checkBreakTimes: searchParams.get('checkBreakTimes') !== 'false'
    });

    // Verify doctor exists and user has access to check conflicts
    const doctor = await prisma.doctor.findUnique({
      where: { id: queryData.doctorId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        organization: { select: { id: true, name: true, type: true } }
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Permission check: Patients, doctors, admins, or organization members can check conflicts
    const hasAccess = (
      session.user.role === 'PATIENT' ||
      session.user.id === doctor.userId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && doctor.organizationId === session.user.organizationId) ||
      (session.user.role === 'HSP' && doctor.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const startTime = new Date(queryData.startTime);
    const endTime = queryData.endTime ? 
      new Date(queryData.endTime) : 
      new Date(startTime.getTime() + queryData.duration * 60000);

    // Comprehensive conflict checking
    const conflictAnalysis = await checkComprehensiveConflicts({
      doctorId: queryData.doctorId,
      doctorUserId: doctor.userId,
      startTime,
      endTime,
      appointmentType: queryData.appointmentType,
      excludeAppointmentId: queryData.excludeAppointmentId,
      options: {
        checkAvailability: queryData.checkAvailability,
        checkDoubleBooking: queryData.checkDoubleBooking,
        checkBreakTimes: queryData.checkBreakTimes
      }
    });

    return NextResponse.json({
      message: 'Conflict analysis completed',
      doctor: {
        id: doctor.id,
        name: `${doctor.user.firstName} ${doctor.user.lastName}`,
        organization: doctor.organization?.name
      },
      requestedSlot: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: Math.round((endTime.getTime() - startTime.getTime()) / 60000),
        appointmentType: queryData.appointmentType
      },
      conflictAnalysis,
      recommendations: generateRecommendations(conflictAnalysis, startTime, endTime),
      nextSteps: conflictAnalysis.hasConflicts ? {
        findAlternatives: `Use GET /api/appointments/slots/available?doctorId=${queryData.doctorId}&startDate=${startTime.toISOString().split('T')[0]}&endDate=${startTime.toISOString().split('T')[0]}`,
        contactDoctor: 'Consider contacting the doctor for emergency appointments or scheduling alternatives'
      } : {
        bookAppointment: 'Use POST /api/appointments to book this time slot',
        reserveSlot: 'Consider reserving this slot if available'
      }
    });

  } catch (error) {
    console.error('Error checking appointment conflicts:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to check appointment conflicts' }, { status: 500 });
  }
}

interface ConflictCheckParams {
  doctorId: string;
  doctorUserId: string;
  startTime: Date;
  endTime: Date;
  appointmentType: string;
  excludeAppointmentId?: string;
  options: {
    checkAvailability: boolean;
    checkDoubleBooking: boolean;
    checkBreakTimes: boolean;
  };
}

async function checkComprehensiveConflicts(params: ConflictCheckParams) {
  const {
    doctorUserId,
    startTime,
    endTime,
    appointmentType,
    excludeAppointmentId,
    options
  } = params;

  const conflicts = {
    hasConflicts: false,
    conflictTypes: [] as string[],
    appointmentConflicts: [] as any[],
    availabilityConflicts: [] as any[],
    breakTimeConflicts: [] as any[],
    slotCapacityIssues: [] as any[],
    summary: {
      totalConflicts: 0,
      canBeBooked: false,
      requiresOverride: false,
      severity: 'NONE' as 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    }
  };

  // 1. Check existing appointment conflicts
  if (options.checkDoubleBooking) {
    const appointmentConflicts = await prisma.appointment.findMany({
      where: {
        doctorId: doctorUserId,
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED'] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime }
          }
        ]
      },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        carePlan: { select: { planName: true } }
      }
    });

    if (appointmentConflicts.length > 0) {
      conflicts.hasConflicts = true;
      conflicts.conflictTypes.push('APPOINTMENT_OVERLAP');
      conflicts.appointmentConflicts = appointmentConflicts.map(appt => ({
        appointmentId: appt.id,
        conflictTime: {
          start: appt.startTime,
          end: appt.endTime
        },
        patient: `${appt.patient.user.firstName} ${appt.patient.user.lastName}`,
        appointmentType: appt.appointmentType,
        status: appt.status,
        priority: appt.priority,
        isCarePlan: !!appt.carePlanId,
        overlapDuration: calculateOverlap(startTime, endTime, appt.startTime, appt.endTime)
      }));
    }
  }

  // 2. Check doctor availability
  if (options.checkAvailability) {
    const dayOfWeek = startTime.getDay();
    const startTimeStr = startTime.toTimeString().substr(0, 5);
    const endTimeStr = endTime.toTimeString().substr(0, 5);
    
    const doctorAvailability = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: doctorUserId,
        dayOfWeek,
        isAvailable: true
      }
    });

    let hasValidAvailability = false;
    const availabilityIssues = [];

    for (const avail of doctorAvailability) {
      const availStartStr = avail.startTime.toISOString().substr(11, 5);
      const availEndStr = avail.endTime.toISOString().substr(11, 5);

      if (startTimeStr >= availStartStr && endTimeStr <= availEndStr) {
        hasValidAvailability = true;
        break;
      } else {
        availabilityIssues.push({
          availabilityPeriod: {
            start: availStartStr,
            end: availEndStr
          },
          requestedTime: {
            start: startTimeStr,
            end: endTimeStr
          },
          issue: startTimeStr < availStartStr ? 'TOO_EARLY' : 'TOO_LATE'
        });
      }
    }

    if (!hasValidAvailability) {
      conflicts.hasConflicts = true;
      conflicts.conflictTypes.push('OUTSIDE_AVAILABILITY');
      conflicts.availabilityConflicts = availabilityIssues;
    }
  }

  // 3. Check break time conflicts
  if (options.checkBreakTimes) {
    const dayOfWeek = startTime.getDay();
    
    const breakTimes = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: doctorUserId,
        dayOfWeek,
        isAvailable: true,
        breakStartTime: { not: null },
        breakEndTime: { not: null }
      },
      select: {
        breakStartTime: true,
        breakEndTime: true
      }
    });

    for (const breakTime of breakTimes) {
      if (breakTime.breakStartTime && breakTime.breakEndTime) {
        const breakStart = new Date(startTime);
        const breakEnd = new Date(startTime);
        
        const breakStartStr = breakTime.breakStartTime.toISOString().substr(11, 8);
        const breakEndStr = breakTime.breakEndTime.toISOString().substr(11, 8);
        
        breakStart.setHours(
          parseInt(breakStartStr.substr(0, 2)),
          parseInt(breakStartStr.substr(3, 2)),
          0, 0
        );
        breakEnd.setHours(
          parseInt(breakEndStr.substr(0, 2)),
          parseInt(breakEndStr.substr(3, 2)),
          0, 0
        );

        // Check if appointment overlaps with break time
        if ((startTime >= breakStart && startTime < breakEnd) ||
            (endTime > breakStart && endTime <= breakEnd) ||
            (startTime <= breakStart && endTime >= breakEnd)) {
          
          conflicts.hasConflicts = true;
          conflicts.conflictTypes.push('BREAK_TIME_CONFLICT');
          conflicts.breakTimeConflicts.push({
            breakTime: {
              start: breakStart,
              end: breakEnd
            },
            overlapDuration: calculateOverlap(startTime, endTime, breakStart, breakEnd)
          });
        }
      }
    }
  }

  // 4. Check appointment slot capacity
  const appointmentSlot = await prisma.appointmentSlot.findFirst({
    where: {
      doctorId: doctorUserId,
      startTime: startTime,
      endTime: endTime
    }
  });

  if (appointmentSlot) {
    if (appointmentSlot.bookedAppointments >= appointmentSlot.maxAppointments) {
      conflicts.hasConflicts = true;
      conflicts.conflictTypes.push('SLOT_CAPACITY_EXCEEDED');
      conflicts.slotCapacityIssues.push({
        slotId: appointmentSlot.id,
        maxAppointments: appointmentSlot.maxAppointments,
        bookedAppointments: appointmentSlot.bookedAppointments,
        availableSpots: appointmentSlot.maxAppointments - appointmentSlot.bookedAppointments
      });
    }
  }

  // Calculate conflict summary
  conflicts.summary.totalConflicts = 
    conflicts.appointmentConflicts.length +
    conflicts.availabilityConflicts.length +
    conflicts.breakTimeConflicts.length +
    conflicts.slotCapacityIssues.length;

  // Determine severity
  if (conflicts.appointmentConflicts.some(c => c.isCarePlan)) {
    conflicts.summary.severity = 'CRITICAL';
  } else if (conflicts.appointmentConflicts.length > 0) {
    conflicts.summary.severity = 'HIGH';
  } else if (conflicts.availabilityConflicts.length > 0 || conflicts.breakTimeConflicts.length > 0) {
    conflicts.summary.severity = 'MEDIUM';
  } else if (conflicts.slotCapacityIssues.length > 0) {
    conflicts.summary.severity = 'LOW';
  }

  conflicts.summary.canBeBooked = !conflicts.hasConflicts;
  conflicts.summary.requiresOverride = conflicts.summary.severity === 'HIGH' || conflicts.summary.severity === 'CRITICAL';

  return conflicts;
}

function calculateOverlap(start1: Date, end1: Date, start2: Date, end2: Date): number {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
  
  if (overlapStart >= overlapEnd) return 0;
  
  return Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000); // minutes
}

function generateRecommendations(conflictAnalysis: any, requestedStart: Date, requestedEnd: Date) {
  const recommendations = [];

  if (!conflictAnalysis.hasConflicts) {
    recommendations.push({
      type: 'SUCCESS',
      message: 'No conflicts detected - slot is available for booking',
      priority: 'HIGH'
    });
  } else {
    if (conflictAnalysis.availabilityConflicts.length > 0) {
      recommendations.push({
        type: 'TIMING_ADJUSTMENT',
        message: 'Consider scheduling during doctor\'s available hours',
        priority: 'HIGH',
        suggestion: 'Check doctor availability schedule for alternative times'
      });
    }

    if (conflictAnalysis.appointmentConflicts.length > 0) {
      const carePlanConflicts = conflictAnalysis.appointmentConflicts.filter((c: any) => c.isCarePlan);
      if (carePlanConflicts.length > 0) {
        recommendations.push({
          type: 'CARE_PLAN_CONFLICT',
          message: 'Conflicts with existing care plan appointments - contact provider',
          priority: 'CRITICAL'
        });
      } else {
        recommendations.push({
          type: 'RESCHEDULE_EXISTING',
          message: 'Consider rescheduling existing appointments or finding alternative time',
          priority: 'MEDIUM'
        });
      }
    }

    if (conflictAnalysis.slotCapacityIssues.length > 0) {
      recommendations.push({
        type: 'FIND_ALTERNATIVE',
        message: 'This time slot is fully booked - try nearby times',
        priority: 'MEDIUM'
      });
    }
  }

  return recommendations;
}