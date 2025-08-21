import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vitals/{patientId}
 * Get vital signs for a specific patient
 */
export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
  try {
    const session = await getServerSession();
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

    const { patientId } = params;

    // Get doctor ID if user is a doctor
    let doctorId = null;
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: session.user.id }
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

    // Verify access to patient
    const patient = await prisma.patient.findFirst({
      where: { 
        user_id: patientId,
        ...(doctorId ? { primary_care_doctor_id: doctorId } : {})
      }
    });

    if (!patient) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Patient not found or access denied' } }
      }, { status: 404 });
    }

    // Get vitals for this patient
    const vitals = await prisma.vital.findMany({
      where: {
        patient_id: patient.id
      },
      include: {
        vitalTemplate: {
          select: {
            id: true,
            name: true,
            unit: true,
            normal_range_min: true,
            normal_range_max: true
          }
        }
      },
      orderBy: {
        recorded_at: 'desc'
      },
      take: 50 // Last 50 readings
    });

    // Transform to expected format
    const formattedVitals = vitals.map(vital => ({
      id: vital.id,
      type: vital.vitalTemplate?.name || 'Unknown Vital',
      value: vital.value,
      unit: vital.vitalTemplate?.unit || '',
      reading_time: vital.recorded_at,
      is_flagged: vital.is_critical || false,
      normal_range: {
        min: vital.vitalTemplate?.normal_range_min || 0,
        max: vital.vitalTemplate?.normal_range_max || 100
      },
      notes: vital.notes,
      recorded_by: vital.recorded_by_doctor_id ? 'Doctor' : 'Patient'
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