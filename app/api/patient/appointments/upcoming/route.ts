import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/patient/appointments/upcoming
 * Get upcoming appointments for the authenticated patient
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({
        message: 'Only patients can view their appointments'
      }), { status: 403 });
    }

    // Get patient profile
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id }
    });

    if (!patient) {
      return NextResponse.json(handleApiError({
        message: 'Patient profile not found'
      }), { status: 404 });
    }

    // Get upcoming appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        startDate: {
          gte: new Date()
        }
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            specialty: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 10
    });

    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title || 'Medical Appointment',
      description: appointment.description,
      startDate: appointment.startDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      type: appointment.appointmentType || 'consultation',
      status: appointment.status || 'scheduled',
      doctor: appointment.doctor ? {
        name: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        specialty: appointment.doctor.specialty?.name || 'General Medicine'
      } : null,
      location: appointment.location,
      notes: appointment.notes
    }));

    return NextResponse.json(formatApiSuccess(formattedAppointments, 'Upcoming appointments retrieved successfully'));
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}