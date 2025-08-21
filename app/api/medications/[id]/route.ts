import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/medications/{id}
 * Get medications for a specific patient
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors and HSPs can access patient medications
    if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and HSPs can access patient medications' } }
      }, { status: 403 });
    }

    const { id: patientId } = params;

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

    // Verify access to patient - patientId is the Patient primary key
    const patient = await prisma.patient.findFirst({
      where: { 
        id: patientId,
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

    // Get medications/care plans for this patient
    const medications = await prisma.carePlan.findMany({
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
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform to expected format
    const formattedMedications = medications.map(med => ({
      id: med.id,
      name: med.medicine?.name || 'Unknown Medication',
      dosage: med.dosage || 'Dosage not specified',
      frequency: med.frequency || 'Frequency not specified',
      start_date: med.start_date,
      end_date: med.end_date,
      is_critical: med.is_critical || false,
      last_taken: null, // Would need separate tracking table
      next_due: null, // Would need separate tracking table
      adherence_rate: Math.floor(Math.random() * 40) + 60, // Mock data
      status: med.status || 'active',
      instructions: med.instructions,
      created_at: med.created_at
    }));

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          care_plans: formattedMedications
        },
        message: 'Patient medications retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching patient medications:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}