import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const rescheduleSchema = z.object({
  newStartTime: z.string().datetime(),
  newEndTime: z.string().datetime().optional(),
  reason: z.string().min(1, 'Reason is required for rescheduling'),
  notifyPatient: z.boolean().default(true),
  notifyDoctor: z.boolean().default(true)
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = rescheduleSchema.parse(body);

    // Get the existing appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            organization: { select: { name: true, type: true } }
          }
        },
        carePlan: { select: { id: true, planName: true } }
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Permission check: Patient, Doctor, or Admin can reschedule
    const hasAccess = (
      session.user.id === appointment.patientId ||
      session.user.id === appointment.doctorId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && appointment.doctor.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions to reschedule appointment' }, { status: 403 });
    }

    // Business rule validation: Check appointment status
    if (!['SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
      return NextResponse.json({ 
        error: `Cannot reschedule appointment with status: ${appointment.status}` 
      }, { status: 400 });
    }

    // Business rule: 24-hour rescheduling policy
    const now = new Date();
    const appointmentStart = new Date(appointment.startTime);
    const hoursUntilAppointment = (appointmentStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < 24) {
      // For appointments < 24 hours, only doctors and hospital admins can reschedule
      if (!['DOCTOR', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ 
          error: 'Cannot reschedule appointment less than 24 hours in advance. Contact your healthcare provider.' 
        }, { status: 400 });
      }
    }

    // Validate new appointment time
    const newStart = new Date(validatedData.newStartTime);
    const newEnd = validatedData.newEndTime ? 
      new Date(validatedData.newEndTime) : 
      new Date(newStart.getTime() + (appointment.endTime.getTime() - appointment.startTime.getTime()));

    // Check if new time is in the future
    if (newStart <= now) {
      return NextResponse.json({ error: 'New appointment time must be in the future' }, { status: 400 });
    }

    // Check for conflicts with doctor's schedule
    const conflictCheck = await checkAppointmentConflicts({
      doctorId: appointment.doctorId,
      startTime: newStart,
      endTime: newEnd,
      excludeAppointmentId: appointment.id
    });

    if (conflictCheck.hasConflicts) {
      return NextResponse.json({ 
        error: 'New time slot conflicts with existing appointments or doctor availability',
        conflicts: conflictCheck.conflicts 
      }, { status: 409 });
    }

    // Check if new time falls within doctor availability
    const dayOfWeek = newStart.getDay();
    const timeStr = newStart.toTimeString().substr(0, 5);
    
    const doctorAvailability = await prisma.doctorAvailability.findFirst({
      where: {
        doctorId: appointment.doctorId,
        dayOfWeek,
        isAvailable: true,
        startTime: { lte: new Date(`2000-01-01T${timeStr}:00`) },
        endTime: { gte: new Date(`2000-01-01T${newEnd.toTimeString().substr(0, 5)}:00`) }
      }
    });

    if (!doctorAvailability) {
      return NextResponse.json({ 
        error: 'New time slot is outside doctor availability hours' 
      }, { status: 400 });
    }

    // Special handling for Care Plan appointments
    if (appointment.carePlanId) {
      const carePlan = await prisma.carePlan.findUnique({
        where: { id: appointment.carePlanId }
      });
      
      if (carePlan && hoursUntilAppointment < 24) {
        // Care plan appointments that are rescheduled < 24hrs may need special handling
        // Log this as a potential care plan disruption
      }
    }

    // Begin transaction for rescheduling
    const result = await prisma.$transaction(async (tx) => {
      // Update the appointment
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: {
          startTime: newStart,
          endTime: newEnd,
          status: 'RESCHEDULED',
          notes: appointment.notes ? 
            `${appointment.notes}\n\n[RESCHEDULED] ${validatedData.reason}` : 
            `[RESCHEDULED] ${validatedData.reason}`,
          updatedAt: new Date()
        },
        include: {
          patient: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } }
            }
          },
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } }
            }
          }
        }
      });

      // Update appointment slot availability if applicable
      const originalSlot = await tx.appointmentSlot.findFirst({
        where: {
          doctorId: appointment.doctorId,
          startTime: appointment.startTime,
          endTime: appointment.endTime
        }
      });

      if (originalSlot) {
        // Decrease booked appointments for original slot
        await tx.appointmentSlot.update({
          where: { id: originalSlot.id },
          data: {
            bookedAppointments: { decrement: 1 },
            isAvailable: originalSlot.bookedAppointments - 1 < originalSlot.maxAppointments
          }
        });
      }

      const newSlot = await tx.appointmentSlot.findFirst({
        where: {
          doctorId: appointment.doctorId,
          startTime: newStart,
          endTime: newEnd
        }
      });

      if (newSlot) {
        // Increase booked appointments for new slot
        await tx.appointmentSlot.update({
          where: { id: newSlot.id },
          data: {
            bookedAppointments: { increment: 1 },
            isAvailable: newSlot.bookedAppointments + 1 < newSlot.maxAppointments
          }
        });
      }

      // Create audit log entry
      await tx.appointmentAuditLog.create({
        data: {
          appointmentId: appointment.id,
          action: 'RESCHEDULE',
          performedBy: session.user.id,
          details: {
            originalStartTime: appointment.startTime,
            originalEndTime: appointment.endTime,
            newStartTime: newStart,
            newEndTime: newEnd,
            reason: validatedData.reason
          },
          timestamp: new Date()
        }
      });

      return updatedAppointment;
    });

    // TODO: Send notifications if requested
    const notifications = [];
    if (validatedData.notifyPatient) {
      notifications.push({
        type: 'patient',
        email: result.patient.user.email,
        message: `Your appointment has been rescheduled to ${newStart.toLocaleString()}`
      });
    }
    if (validatedData.notifyDoctor) {
      notifications.push({
        type: 'doctor',
        email: result.doctor.user.email,
        message: `Appointment with ${result.patient.user.firstName} ${result.patient.user.lastName} has been rescheduled to ${newStart.toLocaleString()}`
      });
    }

    return NextResponse.json({
      message: 'Appointment rescheduled successfully',
      appointment: {
        id: result.id,
        previousTime: {
          startTime: appointment.startTime,
          endTime: appointment.endTime
        },
        newTime: {
          startTime: result.startTime,
          endTime: result.endTime
        },
        status: result.status,
        reason: validatedData.reason,
        patient: {
          name: `${result.patient.user.firstName} ${result.patient.user.lastName}`
        },
        doctor: {
          name: `${result.doctor.user.firstName} ${result.doctor.user.lastName}`
        }
      },
      notifications: notifications.length > 0 ? notifications : undefined,
      nextSteps: {
        viewAppointment: `Use GET /api/appointments/${id} to view updated appointment`,
        viewCalendar: `Use GET /api/appointments/calendar/doctor/${appointment.doctorId} or /api/appointments/calendar/patient/${appointment.patientId}`
      }
    });

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to reschedule appointment' }, { status: 500 });
  }
}

interface ConflictCheckParams {
  doctorId: string;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: string;
}

async function checkAppointmentConflicts(params: ConflictCheckParams) {
  const { doctorId, startTime, endTime, excludeAppointmentId } = params;
  
  const conflictingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED'] },
      OR: [
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime }
        }
      ]
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      patient: {
        select: {
          user: { select: { firstName: true, lastName: true } }
        }
      }
    }
  });

  return {
    hasConflicts: conflictingAppointments.length > 0,
    conflicts: conflictingAppointments.map(appt => ({
      appointmentId: appt.id,
      conflictTime: {
        start: appt.startTime,
        end: appt.endTime
      },
      patient: `${appt.patient.user.firstName} ${appt.patient.user.lastName}`,
      status: appt.status
    }))
  };
}