import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/patients/{patientId}/careplan-details
 * Get detailed care plans for a specific patient
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

    // Only doctors and HSPs can access patient care plans
    if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and HSPs can access patient care plans' } }
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

    // Get detailed care plans for this patient
    const carePlans = await prisma.carePlan.findMany({
      where: {
        patient_id: patient.id
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true
          }
        },
        patient: {
          select: {
            id: true,
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform to expected format
    const formattedCarePlans = carePlans.map(carePlan => ({
      id: carePlan.id,
      name: `${carePlan.medicine?.name || 'Medication'} Care Plan`,
      description: carePlan.instructions || carePlan.medicine?.description || 'Care plan for patient medication management',
      start_date: carePlan.start_date,
      end_date: carePlan.end_date,
      status: carePlan.status || 'active',
      priority: carePlan.is_critical ? 'high' : 'normal',
      medications_count: 1, // Each care plan typically has one medication
      vitals_count: 0, // Would need to count related vitals
      appointments_count: 0, // Would need to count related appointments
      medicine: {
        name: carePlan.medicine?.name,
        type: carePlan.medicine?.type,
        dosage: carePlan.dosage,
        frequency: carePlan.frequency
      },
      created_at: carePlan.created_at,
      updated_at: carePlan.updated_at
    }));

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          careplans: formattedCarePlans
        },
        message: 'Patient care plan details retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching patient care plan details:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}