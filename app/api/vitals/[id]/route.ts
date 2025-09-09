import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/auth-helpers";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vitals/{id}
 * Get a single vital reading by its ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

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

    const vitalReadingId = params.id;
    const user = session.user;

    // Get the vital reading with all related data
    const vitalReading = await prisma.vitalReading.findUnique({
      where: {
        id: vitalReadingId
      },
      include: {
        vitalType: {
          select: {
            name: true,
            unit: true,
            normalRangeMin: true,
            normalRangeMax: true,
            category: true,
            description: true
          }
        },
        patient: {
          select: {
            id: true,
            userId: true,
            primaryCareDoctorId: true
          }
        }
      }
    });

    if (!vitalReading) {
      return NextResponse.json(handleApiError({
        message: 'Vital reading not found'
      }), { status: 404 });
    }

    // Authorization: Check if user has access to this vital reading
    let hasAccess = false;
    
    if (user.role === 'PATIENT' && user.patientId === vitalReading.patientId) {
      hasAccess = true;
    } else if (user.role === 'DOCTOR') {
      // Check if doctor is the patient's primary care doctor
      const doctorProfile = await prisma.doctorProfile.findFirst({
        where: { userId: user.id }
      });
      
      if (doctorProfile && vitalReading.patient.primaryCareDoctorId === doctorProfile.id) {
        hasAccess = true;
      }
    } else if (['admin', 'HSP'].includes(user.role)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You do not have permission to view this vital reading'
      }), { status: 403 });
    }

    // Transform the data
    const transformedVital = {
      id: vitalReading.id,
      patientId: vitalReading.patientId,
      type: vitalReading.vitalType?.name || 'Unknown Vital',
      value: vitalReading.value,
      systolicValue: vitalReading.systolicValue,
      diastolicValue: vitalReading.diastolicValue,
      unit: vitalReading.vitalType?.unit || '',
      readingTime: vitalReading.readingTime.toISOString(),
      isFlagged: vitalReading.isFlagged,
      notes: vitalReading.notes,
      recordedBy: vitalReading.recordedBy,
      alertLevel: vitalReading.alertLevel,
      alertReasons: vitalReading.alertReasons,
      normalRange: {
        min: vitalReading.vitalType?.normalRangeMin,
        max: vitalReading.vitalType?.normalRangeMax
      },
      vitalType: vitalReading.vitalType,
      createdAt: vitalReading.createdAt.toISOString()
    };

    return NextResponse.json(formatApiSuccess(
      { vital: transformedVital },
      'Vital reading retrieved successfully'
    ));

  } catch (error) {
    console.error('Error fetching vital reading:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * PUT /api/vitals/{id}
 * Update a vital reading
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors, HSPs, and patients can update vitals
    if (!['DOCTOR', 'HSP', 'PATIENT'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors, HSPs, and patients can update vital readings' } }
      }, { status: 403 });
    }

    const vitalReadingId = params.id;
    const body = await request.json();

    // Get current vital reading to verify access
    const currentVital = await prisma.vitalReading.findUnique({
      where: { id: vitalReadingId },
      include: {
        patient: {
          select: {
            primaryCareDoctorId: true,
            userId: true
          }
        }
      }
    });

    if (!currentVital) {
      return NextResponse.json(handleApiError({
        message: 'Vital reading not found'
      }), { status: 404 });
    }

    // Verify user has access
    let hasAccess = false;
    
    if (session.user.role === 'PATIENT' && session.user.patientId === currentVital.patientId) {
      hasAccess = true;
    } else if (session.user.role === 'DOCTOR') {
      const doctorProfile = await prisma.doctorProfile.findFirst({
        where: { userId: session.user.id }
      });
      
      if (doctorProfile && currentVital.patient.primaryCareDoctorId === doctorProfile.id) {
        hasAccess = true;
      }
    } else if (session.user.role === 'HSP') {
      hasAccess = true; // HSPs can update vitals per business rules
    }

    if (!hasAccess) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You can only update vital readings for authorized patients'
      }), { status: 403 });
    }

    // Update vital reading
    const updatedVital = await prisma.vitalReading.update({
      where: { id: vitalReadingId },
      data: {
        value: body.value !== undefined ? body.value : undefined,
        systolicValue: body.systolicValue !== undefined ? body.systolicValue : undefined,
        diastolicValue: body.diastolicValue !== undefined ? body.diastolicValue : undefined,
        notes: body.notes,
        isFlagged: body.isFlagged !== undefined ? body.isFlagged : undefined,
        alertLevel: body.alertLevel,
        alertReasons: body.alertReasons,
        readingTime: body.readingTime ? new Date(body.readingTime) : undefined,
        updatedAt: new Date()
      },
      include: {
        vitalType: true
      }
    });

    return NextResponse.json(formatApiSuccess(
      { vital: updatedVital },
      'Vital reading updated successfully'
    ));

  } catch (error) {
    console.error('Error updating vital reading:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}