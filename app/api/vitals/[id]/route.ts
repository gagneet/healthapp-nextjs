import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vitals/{id}
 * Get vital signs for a specific patient
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors and HSPs can access patient vitals
    if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and HSPs can access patient vitals' } }
      }, { status: 403 });
    }

    const { id: patientId } = params;

    // Get doctor ID if user is a doctor
    let doctorId = null;
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: session.user.id }
      });
      
      if (!doctor) {
        return NextResponse.json({
          status: false,
          statusCode: 404,
          payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
        }, { status: 404 });
      }
      
      doctorId = doctor.id;
    }

    // Verify access to patient - patientId is the Patient primary key
    const patient = await prisma.patient.findFirst({
      where: { 
        id: patientId,
        ...(doctorId ? { primaryCareDoctorId: doctorId } : {})
      }
    });

    if (!patient) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Patient not found or access denied' } }
      }, { status: 404 });
    }

    // Get vital readings for this patient
    const vitals = await prisma.vitalReading.findMany({
      where: {
        patientId: patient.id
      },
      include: {
        vitalType: {
          select: {
            id: true,
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
      take: 50 // Last 50 readings
    });

    // Transform to expected format
    const formattedVitals = vitals.map((vital: any) => ({
      id: vital.id,
      type: vital.vitalType?.name || 'Unknown Vital',
      value: vital.value?.toString() || '0',
      unit: vital.vitalType?.unit || '',
      readingTime: vital.readingTime,
      isFlagged: vital.isFlagged || false,
      normalRange: {
        min: vital.vitalType?.normalRangeMin?.toString() || '0',
        max: vital.vitalType?.normalRangeMax?.toString() || '100'
      },
      notes: vital.notes,
      deviceInfo: vital.deviceInfo,
      isValidated: vital.isValidated || false,
      validatedBy: vital.validatedBy,
      recorded_by: 'Patient' // Patient adherence - patients record their own vitals
    }));

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          vitals: formattedVitals
        },
        message: 'Patient vitals retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching patient vitals:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}