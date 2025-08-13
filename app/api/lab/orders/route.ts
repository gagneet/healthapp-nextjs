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

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only doctors can create lab orders
    if (user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only doctors can create lab orders' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      patientId,
      testCodes,
      priority = 'routine',
      fastingRequired,
      specialInstructions,
      expectedCollectionDate,
      orderReason
    } = body;

    if (!patientId || !testCodes || !Array.isArray(testCodes) || testCodes.length === 0) {
      return NextResponse.json(
        { error: 'Patient ID and test codes are required' },
        { status: 400 }
      );
    }

    const result = await LaboratoryService.createLabOrder({
      doctorId: user.id,
      patientId,
      testCodes,
      priority,
      fastingRequired,
      specialInstructions,
      expectedCollectionDate: expectedCollectionDate ? new Date(expectedCollectionDate) : undefined,
      orderReason
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: result.order,
      message: result.message
    });

  } catch (error) {
    console.error('Error creating lab order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    const status = searchParams.get('status');

    const userRole = user.role === 'DOCTOR' ? 'doctor' : 'patient';
    const result = await LaboratoryService.getLabOrders(user.id, userRole, status || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: result.orders,
      meta: {
        totalOrders: result.orders.length,
        userRole,
        status: status || 'all'
      },
      message: result.message
    });

  } catch (error) {
    console.error('Error fetching lab orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}