import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import VideoConsultationService from '@/lib/services/VideoConsultationService';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized: Only doctors can create consultation rooms.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      patientId,
      appointmentId,
      scheduledStartTime,
      duration = 30, // Default 30 minutes
      consultationType = 'scheduled',
      priority = 'medium',
      notes
    } = body;

    if (!patientId || !scheduledStartTime) {
      return NextResponse.json(
        { error: 'Patient ID and scheduled start time are required.' },
        { status: 400 }
      );
    }

    const result = await VideoConsultationService.createConsultation({
      doctorId: session.user.id,
      patientId,
      appointmentId,
      scheduledStartTime: new Date(scheduledStartTime),
      duration,
      consultationType,
      priority,
      notes
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: result.consultation,
      message: 'Video consultation room created successfully.'
    });

  } catch (error) {
    console.error('Error creating video consultation room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
