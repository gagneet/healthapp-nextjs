// Force dynamic rendering for API routes using headers/auth
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server';
import ConsultationBookingService from '@/lib/services/ConsultationBookingService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';



export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      doctorId,
      appointmentDate,
      duration = 30,
      consultationType = 'scheduled',
      priority = 'medium',
      reason,
      notes
    } = body;

    if (!doctorId || !appointmentDate) {
      return NextResponse.json(
        { error: 'Doctor ID and appointment date are required' },
        { status: 400 }
      );
    }

    // For patients booking their own appointments, or doctors booking for their patients
    let patientId = session.user.id;
    if (session.user.role === 'DOCTOR' && body.patientId) {
      patientId = body.patientId;
    } else if (session.user.role !== 'PATIENT' && session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only patients and doctors can book consultations' },
        { status: 403 }
      );
    }

    const result = await ConsultationBookingService.bookConsultation({
      doctorId,
      patientId,
      appointmentDate: new Date(appointmentDate),
      duration,
      consultationType,
      priority,
      reason,
      notes
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: result.data,
      message: result.message
    });

  } catch (error) {
    console.error('Error booking consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}