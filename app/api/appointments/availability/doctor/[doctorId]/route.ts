import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@/prisma/generated/prisma';

// Schema for setting doctor availability
const setAvailabilitySchema = z.object({
  availabilityType: z.enum(['individual', 'clinic', 'hospital_provider']),
  weeklySchedule: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
    isAvailable: z.boolean(),
    shifts: z.array(z.object({
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      slotDuration: z.enum(['10', '15', '30']).default('30'), // minutes
      maxAppointmentsPerSlot: z.number().int().positive().max(10).default(1),
      appointmentTypes: z.array(z.string()).default(['consultation']),
      breakTimes: z.array(z.object({
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        reason: z.string().optional()
      })).default([])
    }))
  })),
  clinicHours: z.object({
    monday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    tuesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    wednesday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    thursday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    friday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    saturday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional(),
    sunday: z.object({ start: z.string(), end: z.string(), closed: z.boolean().default(false) }).optional()
  }).optional(),
  organizationTemplate: z.string().uuid().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().optional(),
  vacationDates: z.array(z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
    reason: z.string().optional()
  })).default([]),
  emergencyAvailability: z.object({
    enabled: z.boolean().default(false),
    maxEmergencySlots: z.number().int().min(0).max(5).default(0),
    emergencySlotDuration: z.enum(['10', '15', '30']).default('15')
  }).optional()
});

const getAvailabilitySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  includeVacations: z.boolean().default(false),
  includeBookedSlots: z.boolean().default(false),
  appointmentType: z.string().optional()
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
    
    const queryData = getAvailabilitySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      includeVacations: searchParams.get('includeVacations') === 'true',
      includeBookedSlots: searchParams.get('includeBookedSlots') === 'true',
      appointmentType: searchParams.get('appointmentType') || undefined,
    });

    // Verify doctor exists and user has access
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { id: true, name: true, type: true } }
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Permission check: Only the doctor themselves, admins, or hospital/provider admins can view availability
    const hasAccess = (
      session.user.id === doctor.userId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && doctor.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get doctor availability records
    const availability = await prisma.doctorAvailability.findMany({
      where: { doctorId: doctor.userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    // Determine availability type based on doctor's organization
    let availabilityType = 'individual';
    let organizationConstraints = null;

    if (doctor.organization) {
      if (doctor.organization.type === 'hospital' || doctor.organization.type === 'provider') {
        availabilityType = 'hospital_provider';
        
        // Get organization-wide availability templates
        // For now, we'll use a simplified approach - in a full implementation,
        // this would query organization availability templates
        organizationConstraints = {
          workingHours: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
            saturday: { start: '09:00', end: '13:00' },
            sunday: { closed: true }
          }
        };
      } else if (doctor.organization.type === 'clinic') {
        availabilityType = 'clinic';
      }
    }

    // Format availability data
    const formattedAvailability = {
      doctorId: doctor.id,
      doctorName: doctor.user.name,
      availabilityType,
      organization: doctor.organization ? {
        id: doctor.organization.id,
        name: doctor.organization.name,
        type: doctor.organization.type,
        constraints: organizationConstraints
      } : null,
      weeklySchedule: Array.from({ length: 7 }, (_, dayIndex) => {
        const dayAvailability = availability.filter(avail => avail.dayOfWeek === dayIndex);
        
        return {
          dayOfWeek: dayIndex,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex],
          isAvailable: dayAvailability.length > 0,
          shifts: dayAvailability.map((avail: any) => ({
            startTime: avail.startTime.toISOString().substr(11, 5), // HH:MM format
            endTime: avail.endTime.toISOString().substr(11, 5),
            slotDuration: avail.slotDuration || 30,
            maxAppointmentsPerSlot: avail.maxAppointmentsPerSlot || 1,
            breakTimes: avail.breakStartTime && avail.breakEndTime ? [{
              startTime: avail.breakStartTime.toISOString().substr(11, 5),
              endTime: avail.breakEndTime.toISOString().substr(11, 5),
              reason: 'Lunch break'
            }] : []
          }))
        };
      }),
      metadata: {
        lastUpdated: availability.length > 0 ? availability[0].updatedAt : null,
        totalAvailableHours: availability.reduce((total: number, avail: any) => {
          const start = new Date(`2000-01-01T${avail.startTime.toISOString().substr(11, 8)}`);
          const end = new Date(`2000-01-01T${avail.endTime.toISOString().substr(11, 8)}`);
          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0)
      }
    };

    // If specific date range requested, generate actual available slots
    if (queryData.startDate && queryData.endDate) {
      // This would be implemented in the slots API
      (formattedAvailability as any).requestedDateRange = {
        startDate: queryData.startDate,
        endDate: queryData.endDate,
        note: 'Use /api/appointments/slots/available for actual time slots'
      };
    }

    return NextResponse.json({
      message: 'Doctor availability retrieved successfully',
      availability: formattedAvailability
    });

  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch doctor availability' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { doctorId } = params;
    const body = await request.json();
    const validatedData = setAvailabilitySchema.parse(body);

    // Verify doctor exists and user has permission to set availability
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { id: true, name: true, type: true } }
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Permission check: Only the doctor themselves, admins, or hospital/provider admins can set availability
    const hasAccess = (
      session.user.id === doctor.userId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && doctor.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions to set doctor availability' }, { status: 403 });
    }

    // Validate availability type matches doctor's organization
    if (doctor.organization) {
      const orgType = doctor.organization.type;
      if ((orgType === 'hospital' || orgType === 'provider') && validatedData.availabilityType !== 'hospital_provider') {
        return NextResponse.json({ 
          error: 'Hospital/Provider doctors must use hospital_provider availability type' 
        }, { status: 400 });
      }
      if (orgType === 'clinic' && validatedData.availabilityType === 'hospital_provider') {
        return NextResponse.json({ 
          error: 'Clinic doctors cannot use hospital_provider availability type' 
        }, { status: 400 });
      }
    }

    // Validate clinic hours if required
    if (validatedData.availabilityType === 'clinic' && !validatedData.clinicHours) {
      return NextResponse.json({ 
        error: 'Clinic hours must be provided for clinic availability type' 
      }, { status: 400 });
    }

    // Begin transaction to update availability
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete existing availability for this doctor
      await tx.doctorAvailability.deleteMany({
        where: { doctorId: doctor.userId }
      });

      // Create new availability records
      const availabilityRecords = [];

      for (const daySchedule of validatedData.weeklySchedule) {
        if (!daySchedule.isAvailable) continue;

        for (const shift of daySchedule.shifts) {
          // Convert time strings to Date objects
          const startTime = new Date(`2000-01-01T${shift.startTime}:00`);
          const endTime = new Date(`2000-01-01T${shift.endTime}:00`);
          
          let breakStartTime = null;
          let breakEndTime = null;
          
          if (shift.breakTimes.length > 0) {
            breakStartTime = new Date(`2000-01-01T${shift.breakTimes[0].startTime}:00`);
            breakEndTime = new Date(`2000-01-01T${shift.breakTimes[0].endTime}:00`);
          }

          const availabilityRecord = await tx.doctorAvailability.create({
            data: {
              doctorId: doctor.userId,
              dayOfWeek: daySchedule.dayOfWeek,
              startTime,
              endTime,
              isAvailable: true,
              slotDuration: parseInt(shift.slotDuration),
              maxAppointmentsPerSlot: shift.maxAppointmentsPerSlot,
              breakStartTime,
              breakEndTime,
              createdAt: new Date(),
            }
          });
          
          availabilityRecords.push(availabilityRecord);
        }
      }

      return availabilityRecords;
    });

    // Store additional metadata (this would typically go in a separate table in a full implementation)
    const metadata = {
      availabilityType: validatedData.availabilityType,
      clinicHours: validatedData.clinicHours,
      organizationTemplate: validatedData.organizationTemplate,
      effectiveFrom: validatedData.effectiveFrom,
      effectiveUntil: validatedData.effectiveUntil,
      vacationDates: validatedData.vacationDates,
      emergencyAvailability: validatedData.emergencyAvailability,
      setBy: session.user.id,
      setAt: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'Doctor availability updated successfully',
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        organization: doctor.organization?.name
      },
      availabilityType: validatedData.availabilityType,
      weeklySchedule: validatedData.weeklySchedule,
      recordsCreated: result.length,
      metadata,
      nextSteps: {
        generateSlots: 'Use POST /api/appointments/slots/generate to create bookable time slots',
        viewCalendar: `Use GET /api/appointments/calendar/doctor/${doctorId} to view calendar`
      }
    });

  } catch (error) {
    console.error('Error setting doctor availability:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to set doctor availability' }, { status: 500 });
  }
}