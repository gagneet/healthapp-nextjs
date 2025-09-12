import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

const isValidDate = (val: string) => {
  // This validation is for a string, so we don't need to check for !val.
  // The .optional() chain handles cases where the field is not provided.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const [year, month, day] = val.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const calendarQuerySchema = z.object({
  startDate: z.string().refine(isValidDate, {
    message: "Invalid startDate, expected valid date in YYYY-MM-DD format",
  }).optional(),
  endDate: z.string().refine(isValidDate, {
    message: "Invalid endDate, expected valid date in YYYY-MM-DD format",
  }).optional(),
  view: z.enum(['month', 'week', 'day']).default('month'),
  includeAvailability: z.preprocess(val => val !== 'false', z.boolean()).default(true),
  includeAppointments: z.preprocess(val => val !== 'false', z.boolean()).default(true),
  includeBlockedSlots: z.preprocess(val => val === 'true', z.boolean()).default(false),
  timezone: z.string().default('UTC')
});

export async function GET(
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { doctorId } = params;
    const { searchParams } = new URL(request.url);
    
    const queryParams = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      view: searchParams.get('view'),
      includeAvailability: searchParams.get('includeAvailability'),
      includeAppointments: searchParams.get('includeAppointments'),
      includeBlockedSlots: searchParams.get('includeBlockedSlots'),
      timezone: searchParams.get('timezone')
    };

    // Filter out null values so Zod can apply defaults
    const nonNullParams = Object.fromEntries(
      Object.entries(queryParams).filter(([, v]) => v !== null)
    );

    const queryData = calendarQuerySchema.parse(nonNullParams);

    // Verify doctor exists and user has access
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: { select: { name: true, email: true, firstName: true, lastName: true } },
        organization: { select: { id: true, name: true, type: true } }
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Permission check: Doctor themselves, admins, or organization members can view calendar
    const hasAccess = (
      session.user.id === doctor.userId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && doctor.organizationId === session.user.organizationId) ||
      (session.user.role === 'HSP' && doctor.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Calculate date range based on view
    const { startDate, endDate } = calculateDateRange(
      queryData.startDate,
      queryData.endDate,
      queryData.view
    );

    const calendarData: any = {
      doctor: {
        id: doctor.id,
        name: doctor.user.name || `${doctor.user.firstName} ${doctor.user.lastName}`,
        organization: doctor.organization?.name,
        organizationType: doctor.organization?.type
      },
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        view: queryData.view,
        timezone: queryData.timezone
      },
      events: []
    };

    const dateRangeFilter = {
      gte: startDate,
      lte: endDate,
    };

    // Get appointments for the date range
    if (queryData.includeAppointments) {
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          startTime: dateRangeFilter,
        },
        include: {
          patient: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          },
          carePlan: {
            select: { id: true, title: true }
          }
        },
        orderBy: { startTime: 'asc' }
      });

      calendarData.events.push(...appointments.map(appointment => ({
        id: appointment.id,
        type: 'appointment',
        title: `${appointment.description || 'Appointment'} - ${appointment.patient?.user.firstName} ${appointment.patient?.user.lastName}`,
        description: appointment.description,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status?.toLowerCase() || 'scheduled',
        appointmentType: 'consultation', // Default to consultation since field doesn't exist in schema
        priority: 'normal', // Default priority
        patient: appointment.patient ? {
          id: appointment.patient.id,
          name: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
          email: appointment.patient.user.email
        } : null,
        carePlan: appointment.carePlan ? {
          id: appointment.carePlan.id,
          name: appointment.carePlan.title
        } : null,
        metadata: {
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt
        }
      })));
    }

    // Get availability slots if requested
    if (queryData.includeAvailability) {
      const availableSlots = await prisma.appointmentSlot.findMany({
        where: {
          doctorId: doctor.id,
          date: dateRangeFilter,
          isAvailable: true
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      });

      calendarData.events.push(...availableSlots.map(slot => ({
        id: `slot-${slot.id}`,
        type: 'availability',
        title: `Available - ${slot.slotType}`,
        description: slot.notes,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableSpots: (slot.maxAppointments || 0) - (slot.bookedAppointments || 0),
        maxAppointments: slot.maxAppointments,
        bookedAppointments: slot.bookedAppointments,
        slotType: slot.slotType,
        metadata: {
          slotId: slot.id,
          date: slot.date
        }
      })));
    }

    // Get doctor weekly availability pattern
    const weeklyAvailability = await prisma.doctorAvailability.findMany({
      where: { doctorId: doctor.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    calendarData.weeklyPattern = weeklyAvailability.map(avail => ({
      dayOfWeek: avail.dayOfWeek,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][avail.dayOfWeek],
      isAvailable: avail.isAvailable,
      startTime: avail.startTime.toISOString().substr(11, 5),
      endTime: avail.endTime.toISOString().substr(11, 5),
      slotDuration: avail.slotDuration,
      maxAppointmentsPerSlot: avail.maxAppointmentsPerSlot,
      breakTimes: avail.breakStartTime && avail.breakEndTime ? [{
        startTime: avail.breakStartTime.toISOString().substr(11, 5),
        endTime: avail.breakEndTime.toISOString().substr(11, 5)
      }] : []
    }));

    // Calculate statistics
    const appointmentStats = {
      totalAppointments: calendarData.events.filter((e: any) => e.type === 'appointment').length,
      availableSlots: calendarData.events.filter((e: any) => e.type === 'availability').length,
      bookedSlots: calendarData.events.filter((e: any) => e.type === 'appointment').length,
      utilizationRate: 0
    };

    const totalSlots = appointmentStats.totalAppointments + appointmentStats.availableSlots;
    if (totalSlots > 0) {
      appointmentStats.utilizationRate = Math.round((appointmentStats.bookedSlots / totalSlots) * 100);
    }

    calendarData.statistics = appointmentStats;

    // Sort all events by start time
    calendarData.events.sort((a: any, b: any) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return NextResponse.json({
      message: 'Doctor calendar retrieved successfully',
      calendar: calendarData
    });

  } catch (error) {
    console.error('Error fetching doctor calendar:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch doctor calendar' }, { status: 500 });
  }
}

function calculateDateRange(startDate?: string, endDate?: string, view: string = 'month') {
  // If startDate is provided, parse it as UTC to avoid timezone issues.
  // Otherwise, use the current date. Using `new Date(YYYY-MM-DDTHH:mm:ssZ)` is a
  // reliable way to parse as UTC without external libraries.
  const baseDate = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date();

  let calculatedStart: Date;
  let calculatedEnd: Date;

  if (startDate && endDate) {
    // If a specific range is provided, use it.
    calculatedStart = startOfDay(new Date(`${startDate}T00:00:00Z`));
    calculatedEnd = endOfDay(new Date(`${endDate}T00:00:00Z`));
  } else {
    switch (view) {
      case 'day':
        calculatedStart = startOfDay(baseDate);
        calculatedEnd = endOfDay(baseDate);
        break;
      case 'week':
        // date-fns `startOfWeek` defaults to Sunday, which matches our requirement.
        calculatedStart = startOfWeek(baseDate);
        calculatedEnd = endOfWeek(baseDate);
        break;
      case 'month':
      default:
        calculatedStart = startOfMonth(baseDate);
        calculatedEnd = endOfMonth(baseDate);
        break;
    }
  }

  return { startDate: calculatedStart, endDate: calculatedEnd };
}