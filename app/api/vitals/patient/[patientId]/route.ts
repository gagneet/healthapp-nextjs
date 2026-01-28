import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/auth-helpers";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vitals/patient/[patientId]
 * Get vital readings for a specific patient
 */

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    if (!['DOCTOR', 'HSP', 'PATIENT', 'admin'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const user = session.user;
    const patientId = params.patientId;

    // Additional authorization: patients can only access their own vitals
    if (user.role === 'PATIENT' && user.patientId !== patientId) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You can only access your own vital signs data'
      }), { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const vitalType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const whereClause: any = {
      patientId: patientId
    };

    if (vitalType) {
      whereClause.vitalTypeId = vitalType;
    }

    if (startDate || endDate) {
      whereClause.readingTime = {};
      if (startDate) {
        whereClause.readingTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.readingTime.lte = new Date(endDate);
      }
    }

    // Get vital readings for the specific patient
    const vitals = await prisma.vitalReading.findMany({
      where: whereClause,
      include: {
        vitalType: {
          select: {
            name: true,
            unit: true,
            normalRangeMin: true,
            normalRangeMax: true,
            description: true
          }
        }
      },
      orderBy: {
        readingTime: 'desc'
      },
      take: limit,
      skip: (page - 1) * limit
    });

    // Transform the data to match frontend expectations
    const transformedVitals = vitals.map(vital => ({
      id: vital.id,
      type: vital.vitalType?.name || 'Unknown Vital',
      value: vital.value,
      systolicValue: vital.systolicValue,
      diastolicValue: vital.diastolicValue,
      unit: vital.vitalType?.unit || '',
      readingTime: vital.readingTime.toISOString(),
      isFlagged: vital.isFlagged,
      notes: vital.notes,
      recordedBy: vital.recordedBy,
      alertLevel: vital.alertLevel,
      alertReasons: vital.alertReasons,
      normalRange: {
        min: vital.vitalType?.normalRangeMin,
        max: vital.vitalType?.normalRangeMax
      },
      vitalType: vital.vitalType,
      createdAt: vital.createdAt.toISOString()
    }));

    // Get total count for pagination
    const totalCount = await prisma.vitalReading.count({
      where: whereClause
    });

    const responseData = {
      vitals: transformedVitals,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    return NextResponse.json(formatApiSuccess(
      responseData,
      'Patient vital signs retrieved successfully'
    ));

  } catch (error) {
    console.error('Error fetching patient vitals:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
