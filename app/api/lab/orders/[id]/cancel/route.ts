import { NextRequest, NextResponse } from 'next/server';
import LaboratoryService from '@/lib/services/LaboratoryService.js';
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

    // Only doctors can cancel lab orders
    if (user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only doctors can cancel lab orders' },
        { status: 403 }
      );
    }

    const orderId = params.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    const result = await LaboratoryService.cancelLabOrder(orderId, user.id, reason);

    if (!result.success) {
      const statusCode = result.error?.includes('Access denied') || result.error?.includes('Only the ordering') ? 403 : 400;
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: result.order,
      message: result.message
    });

  } catch (error) {
    console.error('Error cancelling lab order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}