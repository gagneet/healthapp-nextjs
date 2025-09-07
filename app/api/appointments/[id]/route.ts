import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/auth-helpers";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from "@/lib/prisma";

/**
 * GET /api/appointments/{id}
 * Get a single appointment by its ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    if (!['DOCTOR', 'HSP', 'PATIENT', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const appointmentId = params.id;
    const user = session.user;

    // Get the appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            organization: {
              select: {
                name: true,
                type: true
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            userId: true,
          }
        },
        carePlan: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json(handleApiError({
        message: 'Appointment not found'
      }), { status: 404 });
    }

    // Authorization: Check if user has access to this appointment
    let hasAccess = false;
    
    if (user.role === 'PATIENT' && (user as any).patientId === appointment.patientId) {
      hasAccess = true;
    } else if (user.role === 'DOCTOR') {
      // Check if doctor is the appointment's doctor
      const doctorProfile = await prisma.doctor.findFirst({
        where: { userId: user.id }
      });
      
      if (doctorProfile && appointment.doctorId === doctorProfile.id) {
        hasAccess = true;
      }
    } else if (['ADMIN', 'HSP'].includes(user.role)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You do not have permission to view this appointment'
      }), { status: 403 });
    }

    // Transform the data
    const transformedAppointment = {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      title: appointment.description || 'General Consultation',
      type: 'consultation',
      startTime: appointment.startTime?.toISOString(),
      endTime: appointment.endTime?.toISOString(),
      status: appointment.status,
      notes: appointment.description,
      doctor: appointment.doctor ? {
        id: appointment.doctor.id,
        name: `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        firstName: appointment.doctor.user.firstName,
        lastName: appointment.doctor.user.lastName,
        email: appointment.doctor.user.email,
        organization: appointment.doctor.organization
      } : null,
      carePlan: appointment.carePlan,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString()
    };

    return NextResponse.json(formatApiSuccess(
      { appointment: transformedAppointment },
      'Appointment retrieved successfully'
    ));

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * PUT /api/appointments/{id}
 * Update an appointment
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors can update appointments
    if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and HSPs can update appointments' } }
      }, { status: 403 });
    }

    const appointmentId = params.id;
    const body = await request.json();

    // Get current appointment to verify access
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!currentAppointment) {
      return NextResponse.json(handleApiError({
        message: 'Appointment not found'
      }), { status: 404 });
    }

    // Verify doctor has access (is the appointment's doctor)
    if (session.user.role === 'DOCTOR' && currentAppointment.doctor?.userId !== session.user.id) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You can only update your own appointments'
      }), { status: 403 });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        description: body.notes,
        status: body.status,
        updatedAt: new Date()
      },
      include: {
        doctor: {
          include: {
            user: true,
            organization: true
          }
        },
        carePlan: true
      }
    });

    return NextResponse.json(formatApiSuccess(
      { appointment: updatedAppointment },
      'Appointment updated successfully'
    ));

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}