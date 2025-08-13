import { NextRequest, NextResponse } from 'next/server';
import VideoConsultationService from '@/lib/services/VideoConsultationService.js';
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const consultationId = params.id;
    const userType = user.role === 'DOCTOR' ? 'doctor' : 'patient';

    const result = await VideoConsultationService.joinConsultation({
      consultationId,
      userId: user.id,
      userType
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }

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