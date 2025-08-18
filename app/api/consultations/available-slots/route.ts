// Force dynamic rendering for API routes using headers/auth
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import ConsultationBookingService from '@/lib/services/ConsultationBookingService';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
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
        totalSlots: result.data?.length || 0,
        availableSlots: result.data?.filter(slot => slot.available).length || 0
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
