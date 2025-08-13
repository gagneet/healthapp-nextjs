import { NextRequest, NextResponse } from 'next/server';
import VideoConsultationService from '@/lib/services/VideoConsultationService';
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

    // Only doctors can create consultations
    if (user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only doctors can create video consultations' },
        { status: 403 }
      );

    const body = await request.json();
    const {
      patientId,
      appointmentId,
      scheduledStartTime,
      duration = 30, // default 30 minutes
      consultationType = 'scheduled',
      priority = 'medium',
      notes
    } = body;

    if (!patientId || !scheduledStartTime) {
      return NextResponse.json(
        { error: 'Patient ID and scheduled start time are required' },
        { status: 400 }
      );

    const result = await VideoConsultationService.createConsultation({
      doctorId: user.id,
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

    return NextResponse.json({
      status: 'success',
      data: result.consultation,
      message: 'Video consultation created successfully'
    });

  } catch (error) {
    console.error('Error creating video consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'active' for current consultations

    let result;

    if (status === 'active') {
      // Get active consultations
      const userType = user.role === 'DOCTOR' ? 'doctor' : 'patient';
      result = await VideoConsultationService.getActiveConsultations(user.id, userType);
    } else {
      // Get consultation history
      const userType = user.role === 'DOCTOR' ? 'doctor' : 'patient';
      result = await VideoConsultationService.getConsultationHistory(user.id, userType, page, limit);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 500 }
      );

    return NextResponse.json({
      status: 'success',
      data: result.consultations,
      pagination: result.pagination || undefined,
      message: 'Consultations retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching video consultations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}