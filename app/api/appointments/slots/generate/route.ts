import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AppointmentSlotType } from '@prisma/client';

const generateSlotsSchema = z.object({
  doctorId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  slotDuration: z.enum(['10', '15', '30']).default('30'),
  maxAppointmentsPerSlot: z.number().int().positive().max(10).default(1),
  appointmentTypes: z.array(z.string()).default(['consultation']),
  includeEmergencySlots: z.boolean().default(false),
  overwriteExisting: z.boolean().default(false),
  timezone: z.string().default('UTC')
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = generateSlotsSchema.parse(body);

    // Verify doctor exists and user has permission to generate slots
    const doctor = await prisma.doctor.findUnique({
      where: { id: validatedData.doctorId },
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { id: true, name: true, type: true } }
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Permission check: Only the doctor themselves, admins, or hospital/provider admins can generate slots
    const hasAccess = (
      session.user.id === doctor.userId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && doctor.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions to generate appointment slots' }, { status: 403 });
    }

    // Get doctor availability to base slot generation on
    const availability = await prisma.doctorAvailability.findMany({
      where: { doctorId: doctor.userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    if (availability.length === 0) {
      return NextResponse.json({ 
        error: 'No doctor availability found. Please set doctor availability first.' 
      }, { status: 400 });
    }

    // Begin transaction to generate slots
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing slots if overwrite is requested
      if (validatedData.overwriteExisting) {
        await tx.appointmentSlot.deleteMany({
          where: {
            doctorId: doctor.userId,
            date: {
              gte: new Date(validatedData.startDate),
              lte: new Date(validatedData.endDate)
            }
          }
        });
      }

      const slotsToCreate = [];
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);
      const currentDate = new Date(startDate);

      // Generate slots for each day in the date range
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const dayAvailability = availability.filter(avail => avail.dayOfWeek === dayOfWeek);

        for (const avail of dayAvailability) {
          if (!avail.isAvailable) continue;

          // Convert availability times to current date
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

          // Generate time slots based on availability
          const slotDuration = parseInt(validatedData.slotDuration);
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

            // Create slot data
            const slotData = {
              doctorId: doctor.userId,
              date: new Date(currentDate.toDateString()), // Date only
              startTime: slotTime,
              endTime: slotEndTime,
              maxAppointments: validatedData.maxAppointmentsPerSlot,
              bookedAppointments: 0,
              isAvailable: true,
              slotType: AppointmentSlotType.REGULAR,
              notes: `Generated slot - Duration: ${slotDuration}min, Types: ${validatedData.appointmentTypes.join(', ')}`,
              createdAt: new Date()
            };

            slotsToCreate.push(slotData);

            // Move to next slot
            slotTime = new Date(slotTime.getTime() + slotDuration * 60000);
          }

          // Generate emergency slots if requested
          if (validatedData.includeEmergencySlots && doctor.organization?.type === 'hospital') {
            const emergencySlotData = {
              doctorId: doctor.userId,
              date: new Date(currentDate.toDateString()),
              startTime: new Date(availEnd.getTime() - 15 * 60000),
              endTime: new Date(availEnd),
              maxAppointments: 1,
              bookedAppointments: 0,
              isAvailable: true,
              slotType: AppointmentSlotType.EMERGENCY,
              notes: 'Emergency slot - 15 minutes',
              createdAt: new Date()
            };

            slotsToCreate.push(emergencySlotData);
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Batch create all slots
      if (slotsToCreate.length > 0) {
        // Check for existing slots to avoid duplicates if not overwriting
        if (!validatedData.overwriteExisting) {
          const existingSlots = await tx.appointmentSlot.findMany({
            where: {
              doctorId: doctor.userId,
              date: {
                gte: new Date(validatedData.startDate),
                lte: new Date(validatedData.endDate)
              }
            },
            select: {
              date: true,
              startTime: true,
              endTime: true
            }
          });

          // Filter out slots that already exist
          const filteredSlots = slotsToCreate.filter(newSlot => {
            return !existingSlots.some(existing => 
              existing.date.getTime() === newSlot.date.getTime() &&
              existing.startTime.getTime() === newSlot.startTime.getTime()
            );
          });

          if (filteredSlots.length === 0) {
            throw new Error('All slots for this date range already exist. Use overwriteExisting: true to replace them.');
          }

          slotsToCreate.length = 0;
          slotsToCreate.push(...filteredSlots);
        }

        const createdSlots = await tx.appointmentSlot.createMany({
          data: slotsToCreate,
          skipDuplicates: !validatedData.overwriteExisting
        });

        return {
          slotsGenerated: createdSlots.count,
          dateRange: {
            startDate: validatedData.startDate,
            endDate: validatedData.endDate
          },
          configuration: {
            slotDuration: validatedData.slotDuration,
            maxAppointmentsPerSlot: validatedData.maxAppointmentsPerSlot,
            appointmentTypes: validatedData.appointmentTypes,
            includeEmergencySlots: validatedData.includeEmergencySlots
          }
        };
      } else {
        throw new Error('No slots could be generated. Check doctor availability settings.');
      }
    });

    return NextResponse.json({
      message: 'Appointment slots generated successfully',
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        organization: doctor.organization?.name
      },
      result,
      nextSteps: {
        viewSlots: `Use GET /api/appointments/slots/available?doctorId=${validatedData.doctorId}&startDate=${validatedData.startDate}&endDate=${validatedData.endDate}`,
        manageAppointments: 'Use POST /api/appointments to book appointments in these slots',
        viewCalendar: `Use GET /api/appointments/calendar/doctor/${validatedData.doctorId} to view the calendar`
      }
    });

  } catch (error) {
    console.error('Error generating appointment slots:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('already exist')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to generate appointment slots' }, { status: 500 });
  }
}