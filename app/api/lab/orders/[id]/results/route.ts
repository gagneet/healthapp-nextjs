import { NextRequest, NextResponse } from 'next/server';
import LaboratoryService from '@/lib/services/LaboratoryService';
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

export async function GET(
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

    const orderId = params.id;
    const userRole = user.role === 'DOCTOR' ? 'doctor' : 'patient';

    const result = await LaboratoryService.getLabResults(orderId, user.id, userRole);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Access denied' ? 403 : 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        order: result.order,
        results: result.results,
        summary: result.summary
      },
      message: result.message
    });

  } catch (error) {
    console.error('Error fetching lab results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // This endpoint is typically called by lab system webhooks
    // Implement proper authentication for external systems
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.LAB_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    const orderId = params.id;
    const body = await request.json();

    const result = await LaboratoryService.processLabResults({
      orderId,
      testResults: body.testResults,
      labId: body.labId,
      collectedAt: body.collectedAt ? new Date(body.collectedAt) : undefined,
      processedAt: body.processedAt ? new Date(body.processedAt) : undefined,
      reviewedBy: body.reviewedBy
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        order: result.order,
        results: result.results
      },
      message: result.message
    });

  } catch (error) {
    console.error('Error processing lab results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}