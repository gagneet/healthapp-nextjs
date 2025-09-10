import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import LaboratoryService from '@/lib/services/LaboratoryService';




export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only doctors can create lab orders
    if (session.user.role !== 'DOCTOR') {
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
      doctorId: session.user.id,
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const userRole = session.user.role === 'DOCTOR' ? 'doctor' : 'patient';
    const result = await LaboratoryService.getLabOrders(session.user.id, userRole, status || undefined);

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
        totalOrders: result.orders?.length || 0,
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
