import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import VideoConsultationService from '@/lib/services/VideoConsultationService';


export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Unauthorized: Only doctors can manage recordings.' },
        { status: 403 }
      );
    }

    const consultationId = params.id;
    const { action } = await request.json();

    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json(
        { error: 'A valid action (start/stop) is required.' },
        { status: 400 }
      );
    }

    const result = await VideoConsultationService.toggleRecording(
      consultationId,
      action,
      session.user.id
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
      message: `Recording successfully ${action === 'start' ? 'started' : 'stopped'}.`
    });

  } catch (error) {
    console.error('Error managing recording:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
