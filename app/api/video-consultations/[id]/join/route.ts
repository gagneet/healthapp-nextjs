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

    const consultationId = params.id;
    const userType = session.user.role === 'DOCTOR' ? 'doctor' : 'patient';

    const result = await VideoConsultationService.joinConsultation({
      consultationId,
      userId: session.user.id,
      userType
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );

    return NextResponse.json({
      status: 'success',
      data: {
        joinUrl: result.joinUrl,
        roomId: result.roomId,
        consultation: result.consultation
      },
      message: 'Successfully joined video consultation'
    });

  } catch (error) {
    console.error('Error joining video consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}