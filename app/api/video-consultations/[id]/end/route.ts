import { NextRequest, NextResponse } from 'next/server';
import VideoConsultationService from '@/lib/services/VideoConsultationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';



export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const consultationId = params.id;
    const body = await request.json();
    const { summary } = body;

    const result = await VideoConsultationService.endConsultation(
      consultationId,
      session.user.id,
      summary
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: result.consultation,
      message: 'Video consultation ended successfully'
    });

  } catch (error) {
    console.error('Error ending video consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}