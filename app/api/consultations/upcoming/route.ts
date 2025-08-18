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
    const limit = parseInt(searchParams.get('limit') || '5');

    const result = await ConsultationBookingService.getUpcomingConsultations(
      session.user.id,
      session.user.role,
      limit
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
        count: result.data.length,
        userRole: session.user.role
      },
      message: result.message
    });

  } catch (error) {
    console.error('Error getting upcoming consultations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
