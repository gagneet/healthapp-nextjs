import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ConsultationStatus } from '@prisma/client';

const getAvailableSlotsSchema = z.object({
  doctorId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  appointmentType: z.string().default('consultation'),
  duration: z.enum(['10', '15', '30']).default('30'),
  includeEmergencySlots: z.boolean().default(false),
  timezone: z.string().default('UTC')
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const queryData = getAvailableSlotsSchema.parse({
      doctorId: searchParams.get('doctorId') || '',
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      appointmentType: searchParams.get('appointmentType') || 'consultation',
      duration: searchParams.get('duration') || '30',
      includeEmergencySlots: searchParams.get('includeEmergencySlots') === 'true',
      timezone: searchParams.get('timezone') || 'UTC'
    });

    // Verify doctor exists and user has access
    const doctor = await prisma.doctor.findUnique({
      where: { id: queryData.doctorId },
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { id: true, name: true, type: true } }
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Permission check: Patients, doctors, admins, or organization members can view slots
    const hasAccess = (
      session.user.role === 'PATIENT' ||
      session.user.id === doctor.userId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && doctor.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get doctor availability for the date range
    const startDateObj = new Date(queryData.startDate);
    const endDateObj = new Date(queryData.endDate);
    
    // Generate available slots
    const availableSlots = await generateAvailableSlots({
      doctorId: queryData.doctorId,
      doctorUserId: doctor.userId,
      startDate: startDateObj,
      endDate: endDateObj,
      duration: parseInt(queryData.duration),
      appointmentType: queryData.appointmentType,
      includeEmergencySlots: queryData.includeEmergencySlots,
      timezone: queryData.timezone,
      organizationType: doctor.organization?.type ?? undefined
    });

    return NextResponse.json({
      message: 'Available slots retrieved successfully',
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        organization: doctor.organization?.name
      },
      dateRange: {
        startDate: queryData.startDate,
        endDate: queryData.endDate,
        timezone: queryData.timezone
      },
      slotConfiguration: {
        duration: `${queryData.duration} minutes`,
        appointmentType: queryData.appointmentType,
        includeEmergencySlots: queryData.includeEmergencySlots
      },
      availableSlots,
      totalSlots: availableSlots.length,
      nextSteps: {
        bookAppointment: 'Use POST /api/appointments to book a selected slot',
        checkConflicts: 'Use GET /api/appointments/conflicts before booking'
      }
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch available slots' }, { status: 500 });
  }
}

interface GenerateSlotsParams {
  doctorId: string;
  doctorUserId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  appointmentType: string;
  includeEmergencySlots: boolean;
  timezone: string;
  organizationType?: string;
}

async function generateAvailableSlots(params: GenerateSlotsParams) {
  const {
    doctorUserId,
    startDate,
    endDate,
    duration,
    appointmentType,
    includeEmergencySlots,
    timezone,
    organizationType
  } = params;

  // Get doctor availability
  const availability = await prisma.doctorAvailability.findMany({
    where: { doctorId: doctorUserId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });

  if (availability.length === 0) {
    return [];
  }

  // Get existing appointments for the date range
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorUserId,
      startTime: {
        gte: startDate,
        lte: endDate
      },
      status: {
        in: [ConsultationStatus.SCHEDULED, ConsultationStatus.IN_PROGRESS]
      }
    },
    select: {
      startTime: true,
      endTime: true,
      status: true
    }
  });

  const slots = [];
  const currentDate = new Date(startDate);

  // Generate slots for each day in the date range
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dayAvailability = availability.filter(avail => avail.dayOfWeek === dayOfWeek);

    for (const avail of dayAvailability) {
      if (!avail.isAvailable) continue;

      // Convert availability times to today's date
      const availStart = new Date(currentDate);
      const availEnd = new Date(currentDate);
      
      const startTimeStr = avail.startTime.toISOString().substr(11, 8);
      const endTimeStr = avail.endTime.toISOString().substr(11, 8);
      
      availStart.setHours(
        parseInt(startTimeStr.substr(0, 2)),
        parseInt(startTimeStr.substr(3, 2)),
        0, 0
      );
      availEnd.setHours(
        parseInt(endTimeStr.substr(0, 2)),
        parseInt(endTimeStr.substr(3, 2)),
        0, 0
      );

      // Handle break times
      let breakStart = null;
      let breakEnd = null;
      if (avail.breakStartTime && avail.breakEndTime) {
        breakStart = new Date(currentDate);
        breakEnd = new Date(currentDate);
        
        const breakStartStr = avail.breakStartTime.toISOString().substr(11, 8);
        const breakEndStr = avail.breakEndTime.toISOString().substr(11, 8);
        
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
      }

      // Generate time slots
      const slotDuration = avail.slotDuration || duration;
      let slotTime = new Date(availStart);

      while (slotTime < availEnd) {
        const slotEndTime = new Date(slotTime.getTime() + slotDuration * 60000);

        // Skip if slot would go beyond availability end time
        if (slotEndTime > availEnd) break;

        // Skip if slot conflicts with break time
        if (breakStart && breakEnd) {
          if ((slotTime >= breakStart && slotTime < breakEnd) ||
              (slotEndTime > breakStart && slotEndTime <= breakEnd)) {
            slotTime = new Date(breakEnd);
            continue;
          }
        }

        // Check if slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(appt => {
          if (!appt.startTime || !appt.endTime) return false;
          return (slotTime >= appt.startTime && slotTime < appt.endTime) ||
                 (slotEndTime > appt.startTime && slotEndTime <= appt.endTime) ||
                 (slotTime <= appt.startTime && slotEndTime >= appt.endTime);
        });

        if (!hasConflict) {
          // Check if we can accommodate the appointment type
          const maxAppointments = avail.maxAppointmentsPerSlot || 1;
          const conflictingAppointments = existingAppointments.filter(appt => {
            if (!appt.startTime || !appt.endTime) return false;
            return slotTime >= appt.startTime && slotTime < appt.endTime
          });

          if (conflictingAppointments.length < maxAppointments) {
            slots.push({
              startTime: new Date(slotTime),
              endTime: new Date(slotEndTime),
              duration: slotDuration,
              availableSpots: maxAppointments - conflictingAppointments.length,
              maxAppointments,
              appointmentTypes: [appointmentType],
              isEmergencySlot: false,
              slotType: 'regular',
              timezone
            });
          }
        }

        // Move to next slot
        slotTime = new Date(slotTime.getTime() + slotDuration * 60000);
      }

      // Generate emergency slots if requested and enabled
      if (includeEmergencySlots && organizationType === 'hospital') {
        // Add emergency slot logic here
        const emergencySlot = {
          startTime: new Date(availEnd.getTime() - 15 * 60000), // 15 min emergency slot at end
          endTime: new Date(availEnd),
          duration: 15,
          availableSpots: 1,
          maxAppointments: 1,
          appointmentTypes: ['emergency'],
          isEmergencySlot: true,
          slotType: 'emergency',
          timezone
        };

        // Check if emergency slot doesn't conflict
        const hasEmergencyConflict = existingAppointments.some(appt => {
          if (!appt.startTime || !appt.endTime) return false;
          return (emergencySlot.startTime >= appt.startTime && emergencySlot.startTime < appt.endTime) ||
                 (emergencySlot.endTime > appt.startTime && emergencySlot.endTime <= appt.endTime);
        });

        if (!hasEmergencyConflict) {
          slots.push(emergencySlot);
        }
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Sort slots by start time
  return slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}