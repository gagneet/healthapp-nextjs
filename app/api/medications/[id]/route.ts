import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/medications/{id}
 * Get medications for a specific patient
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

    // Only doctors can access patient medications (HSPs cannot manage medication reminders per business rules)
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can access patient medication reminders' } }
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

    // Get medication reminders for this patient through their care plans (proper business logic)
    // Medications are linked through CarePlans as prescribed_medications (Medication Reminders)
    const carePlansWithMedications = await prisma.carePlan.findMany({
      where: {
        patient_id: patient.id,
        // Only show care plans where the doctor has access (if user is doctor)
        ...(doctorId ? { created_by_doctor_id: doctorId } : {})
      },
      include: {
        prescribed_medications: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                type: true,
                description: true
              }
            },
            medication_logs: {
              select: {
                id: true,
                scheduled_at: true,
                taken_at: true,
                adherence_status: true
              },
              orderBy: {
                scheduled_at: 'desc'
              },
              take: 5 // Last 5 logs for adherence calculation
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Extract all medications from all care plans
    const medications = carePlansWithMedications.flatMap(carePlan => 
      carePlan.prescribed_medications.map(med => ({
        ...med,
        care_plan: {
          id: carePlan.id,
          title: carePlan.title,
          status: carePlan.status,
          description: carePlan.description
        }
      }))
    );

    // Transform to expected format following healthcare business logic
    const formattedMedications = medications.map(med => {
      // Calculate adherence rate from medication logs
      const logs = med.medication_logs || [];
      const takenCount = logs.filter(log => log.adherence_status === 'taken' && log.taken_at).length;
      const adherenceRate = logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : 0;
      
      // Find last taken and next due
      const lastTakenLog = logs.find(log => log.taken_at);
      const nextScheduledLog = logs.find(log => !log.taken_at && log.scheduled_at > new Date());
      
      // Get medication details (dosage, frequency, etc. should be in Medication table)
      const details = med.details as any || {};
      
      return {
        id: med.id,
        name: med.medicine?.name || 'Unknown Medication',
        dosage: details.dosage || 'Dosage not specified',
        frequency: details.frequency || 'Frequency not specified',
        start_date: med.start_date,
        end_date: med.end_date,
        is_critical: details.is_critical || false,
        last_taken: lastTakenLog?.taken_at || null,
        next_due: nextScheduledLog?.scheduled_at || null,
        adherence_rate: adherenceRate,
        status: med.care_plan?.status || 'active',
        instructions: med.description || med.medicine?.description,
        care_plan: {
          id: med.care_plan?.id,
          title: med.care_plan?.title,
          description: med.care_plan?.description
        },
        // Additional medication reminder properties
        medicine_type: med.medicine?.type,
        participant_id: med.participant_id, // Patient ID
        created_at: med.created_at,
        updated_at: med.updated_at
      };
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          medications: formattedMedications
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