import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/appointments/{id}
 * Get appointments for a specific patient
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors and HSPs can access patient appointments
    if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and HSPs can access patient appointments' } }
      }, { status: 403 });
    }

    const { id: patientId } = params;

    // Get doctor ID if user is a doctor
    let doctorId = null;
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: session.user.id }
      });
      
      if (!doctor) {
        return NextResponse.json({
          status: false,
          statusCode: 404,
          payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
        }, { status: 404 });
      }
      
      doctorId = doctor.id;
    }

    // Verify access to patient - patientId is the Patient primary key
    const patient = await prisma.patient.findFirst({
      where: { 
        id: patientId,
        ...(doctorId ? { primary_care_doctor_id: doctorId } : {})
      }
    });

    if (!patient) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Patient not found or access denied' } }
      }, { status: 404 });
    }

    // Get appointments for this patient
    const appointments = await prisma.appointment.findMany({
      where: {
        patient_id: patient.id, // appointments table uses patient primary key
        ...(doctorId ? { doctor_id: doctorId } : {})
      },
      orderBy: {
        start_time: 'desc'
      }
    });

    // Transform to expected format
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.description || 'Appointment',
      type: appointment.appointment_type?.toLowerCase() || 'consultation',
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status || 'scheduled',
      is_virtual: appointment.is_virtual || false,
      notes: appointment.notes,
      created_at: appointment.created_at
    }));

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          appointments: formattedAppointments
        },
        message: 'Patient appointments retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}