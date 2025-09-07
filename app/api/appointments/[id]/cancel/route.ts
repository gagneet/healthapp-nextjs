import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const cancelSchema = z.object({
  reason: z.string().min(1, 'Reason is required for cancellation'),
  cancelledBy: z.enum(['PATIENT', 'DOCTOR', 'SYSTEM']).optional(),
  notifyPatient: z.boolean().default(true),
  notifyDoctor: z.boolean().default(true),
  allowRefund: z.boolean().default(false)
});

export async function DELETE(
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
    const validatedData = cancelSchema.parse(body);

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
        carePlan: { 
          select: { 
            id: true, 
            title: true
          } 
        }
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Permission check: Patient, Doctor, or Admin can cancel
    const hasAccess = (
      session.user.id === appointment.patientId ||
      session.user.id === appointment.doctorId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && appointment.doctor && appointment.doctor.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions to cancel appointment' }, { status: 403 });
    }

    // Business rule validation: Check appointment status
    if (!appointment.status || !['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'].includes(appointment.status)) {
      return NextResponse.json({ 
        error: `Cannot cancel appointment with status: ${appointment.status}` 
      }, { status: 400 });
    }

    if (!appointment.startTime) {
        return NextResponse.json({ error: 'Appointment start time not found' }, { status: 404 });
    }

    // Business rule: Cancellation policy enforcement
    const now = new Date();
    const appointmentStart = new Date(appointment.startTime);
    const hoursUntilAppointment = (appointmentStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let cancellationPolicy = 'ALLOWED';
    let requiresOverride = false;

    if (hoursUntilAppointment < 0.5) { // Less than 30 minutes
      cancellationPolicy = 'APPOINTMENT_LAPSED';
      requiresOverride = true;
    } else if (hoursUntilAppointment < 24) { // Less than 24 hours
      if (appointment.carePlanId) {
        cancellationPolicy = 'CARE_PLAN_PERMANENT_LAPSE';
        // Care plan appointments cancelled < 24hrs lapse permanently
      } else {
        cancellationPolicy = 'REQUIRES_MANUAL_OVERRIDE';
        requiresOverride = true;
      }
    }

    // Check if manual override is needed and user has authority
    if (requiresOverride && !['DOCTOR', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: `Cancellation requires manual override from healthcare provider. Policy: ${cancellationPolicy}`,
        policy: {
          type: cancellationPolicy,
          hoursUntilAppointment: Math.round(hoursUntilAppointment * 100) / 100,
          requiresAuthorization: true
        }
      }, { status: 403 });
    }

    // Determine cancellation status based on policy
    let finalStatus = 'CANCELLED';
    if (cancellationPolicy === 'APPOINTMENT_LAPSED') {
      finalStatus = 'LAPSED';
    } else if (cancellationPolicy === 'CARE_PLAN_PERMANENT_LAPSE') {
      finalStatus = 'CARE_PLAN_LAPSED';
    }

    // Begin transaction for cancellation
    const result = await prisma.$transaction(async (tx) => {
      // Update the appointment
      const cancelledAppointment = await tx.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
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

      // Update appointment slot availability
      if (appointment.doctorId && appointment.startTime && appointment.endTime) {
        const appointmentSlot = await tx.appointmentSlot.findFirst({
          where: {
            doctorId: appointment.doctorId,
            startTime: appointment.startTime,
            endTime: appointment.endTime
          }
        });

        if (appointmentSlot && appointmentSlot.bookedAppointments != null && appointmentSlot.maxAppointments != null) {
          await tx.appointmentSlot.update({
            where: { id: appointmentSlot.id },
            data: {
              bookedAppointments: { decrement: 1 },
              isAvailable: appointmentSlot.bookedAppointments - 1 < appointmentSlot.maxAppointments
            }
          });
        }
      }

      // Handle care plan impacts
      // if (appointment.carePlanId && finalStatus === 'CARE_PLAN_LAPSED') {
      //   // Mark care plan appointment as missed/lapsed
      //   // In a full implementation, this might trigger care plan reassessment
        
      //   // Log care plan disruption
      //   // await tx.carePlanLog.create({
      //   //   data: {
      //   //     carePlanId: appointment.carePlanId,
      //   //     patientId: appointment.patientId,
      //   //     doctorId: appointment.doctorId,
      //   //     logType: 'APPOINTMENT_LAPSED',
      //   //     description: `Care plan appointment cancelled with < 24hr notice: ${validatedData.reason}`,
      //   //     severity: 'HIGH',
      //   //     createdBy: session.user.id
      //   //   }
      //   // });
      // }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          action: 'CANCEL',
          resource: 'appointment',
          entityId: appointment.id,
          userId: session.user.id,
          patientId: appointment.patientId,
          dataChanges: {
            originalStartTime: appointment.startTime,
            originalEndTime: appointment.endTime,
            cancellationPolicy,
            finalStatus,
            hoursUntilAppointment: Math.round(hoursUntilAppointment * 100) / 100,
            reason: validatedData.reason,
            cancelledBy: validatedData.cancelledBy || session.user.role
          },
          timestamp: new Date(),
          accessGranted: true,
        }
      });

      // Handle potential refunds for paid appointments
      if (validatedData.allowRefund && hoursUntilAppointment >= 24) {
        // TODO: Implement refund logic here
        // This would interface with payment systems
      }

      return cancelledAppointment;
    });

    // TODO: Send notifications if requested
    const notifications = [];
    if (validatedData.notifyPatient && result.patient?.user?.email) {
      const patientMessage = finalStatus === 'CARE_PLAN_LAPSED' ? 
        `Your care plan appointment has been cancelled and will not be automatically rescheduled. Please contact your provider to discuss next steps.` :
        `Your appointment scheduled for ${appointmentStart.toLocaleString()} has been cancelled.`;
        
      notifications.push({
        type: 'patient',
        email: result.patient.user.email,
        message: patientMessage,
        priority: finalStatus === 'CARE_PLAN_LAPSED' ? 'HIGH' : 'MEDIUM'
      });
    }
    
    if (validatedData.notifyDoctor && result.doctor?.user?.email) {
      notifications.push({
        type: 'doctor',
        email: result.doctor.user.email,
        message: `Appointment with ${result.patient?.user?.firstName || ''} ${result.patient?.user?.lastName || ''} scheduled for ${appointmentStart.toLocaleString()} has been cancelled.`,
        carePlanImpact: !!appointment.carePlanId && finalStatus === 'CARE_PLAN_LAPSED'
      });
    }

    // Prepare response based on cancellation type
    const responseMessage = {
      'CANCELLED': 'Appointment cancelled successfully',
      'LAPSED': 'Appointment marked as lapsed due to last-minute cancellation',
      'CARE_PLAN_LAPSED': 'Care plan appointment cancelled - permanent lapse recorded'
    }[finalStatus] || 'Appointment cancelled';

    return NextResponse.json({
      message: responseMessage,
      appointment: {
        id: result.id,
        originalTime: {
          startTime: appointment.startTime,
          endTime: appointment.endTime
        },
        status: result.status,
        cancellationPolicy,
        carePlanImpact: !!appointment.carePlanId && finalStatus === 'CARE_PLAN_LAPSED',
        patient: {
          name: `${result.patient?.user?.firstName || ''} ${result.patient?.user?.lastName || ''}`.trim()
        },
        doctor: {
          name: `${result.doctor?.user?.firstName || ''} ${result.doctor?.user?.lastName || ''}`.trim()
        }
      },
      policy: {
        type: cancellationPolicy,
        hoursUntilAppointment: Math.round(hoursUntilAppointment * 100) / 100,
        finalStatus,
        refundEligible: hoursUntilAppointment >= 24 && validatedData.allowRefund
      },
      notifications: notifications.length > 0 ? notifications : undefined,
      nextSteps: finalStatus === 'CARE_PLAN_LAPSED' ? {
        contactProvider: 'Contact your healthcare provider to reschedule care plan appointments',
        reviewCarePlan: `Use GET /api/care-plans/${appointment.carePlanId} to review impact`
      } : {
        rebookAppointment: `Use GET /api/appointments/slots/available?doctorId=${appointment.doctorId} to find new available slots`,
        viewCalendar: `Use GET /api/appointments/calendar/patient/${appointment.patientId}`
      }
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}