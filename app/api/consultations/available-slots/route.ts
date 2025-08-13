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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '30');

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: 'Doctor ID and date are required' },
        { status: 400 }
      );
    }

    const result = await ConsultationBookingService.getAvailableSlots(
      doctorId,
      new Date(date),
      duration
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: result.data,
      meta: {
        date: result.date,
        doctorId: result.doctorId,
        totalSlots: result.data.length,
        availableSlots: result.data.filter(slot => slot.available).length
      },
      message: 'Available slots retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting available slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}