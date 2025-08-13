import { NextRequest, NextResponse } from 'next/server';
import { ConsultationBookingService } from '@/lib/services/ConsultationBookingService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
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
    let patientId = user.id;
    if (user.role === 'DOCTOR' && body.patientId) {
      patientId = body.patientId;
    } else if (user.role !== 'PATIENT' && user.role !== 'DOCTOR') {
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