import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const calendarQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  view: z.enum(['month', 'week', 'day']).default('month'),
  includeAvailability: z.boolean().default(true),
  includeAppointments: z.boolean().default(true),
  includeBlockedSlots: z.boolean().default(false),
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
    
    const queryData = calendarQuerySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      view: searchParams.get('view') || 'month',
      includeAvailability: searchParams.get('includeAvailability') !== 'false',
      includeAppointments: searchParams.get('includeAppointments') !== 'false',
      includeBlockedSlots: searchParams.get('includeBlockedSlots') === 'true',
      timezone: searchParams.get('timezone') || 'UTC'
    });

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
  const baseDate = startDate ? new Date(startDate) : new Date();
  let calculatedStart: Date;
  let calculatedEnd: Date;

  if (startDate && endDate) {
    calculatedStart = new Date(startDate);
    calculatedEnd = new Date(endDate);
  } else {
    switch (view) {
      case 'day':
        calculatedStart = new Date(baseDate);
        calculatedStart.setHours(0, 0, 0, 0);
        calculatedEnd = new Date(calculatedStart);
        calculatedEnd.setHours(23, 59, 59, 999);
        break;
      case 'week':
        calculatedStart = new Date(baseDate);
        // Note: Sunday is considered the start of the week (day 0).
        calculatedStart.setDate(baseDate.getDate() - baseDate.getDay());
        calculatedStart.setHours(0, 0, 0, 0);
        calculatedEnd = new Date(calculatedStart);
        calculatedEnd.setDate(calculatedStart.getDate() + 6); // End of week (Saturday)
        calculatedEnd.setHours(23, 59, 59, 999);
        break;
      case 'month':
      default:
        // First day of month
        calculatedStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        calculatedStart.setHours(0, 0, 0, 0);
        // Last day of month
        calculatedEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        calculatedEnd.setHours(23, 59, 59, 999);
        break;
    }
  }

  return { startDate: calculatedStart, endDate: calculatedEnd };
}