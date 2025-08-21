import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/patients/{id}/careplan-details
 * Get detailed care plans for a specific patient
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

    // Only doctors and HSPs can access patient care plans
    if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and HSPs can access patient care plans' } }
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

    // Get detailed care plans for this patient with all adherence components
    const carePlans = await prisma.carePlan.findMany({
      where: {
        patient_id: patient.id
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
              take: 3 // Recent adherence data
            }
          }
        },
        vitals: {
          include: {
            vital_type: {
              select: {
                id: true,
                name: true,
                unit: true
              }
            }
          },
          orderBy: {
            reading_time: 'desc'
          },
          take: 10 // Recent vitals
        },
        scheduled_events: {
          select: {
            id: true,
            event_type: true,
            title: true,
            start_datetime: true,
            end_datetime: true,
            status: true
          },
          orderBy: {
            start_datetime: 'desc'
          },
          take: 5 // Recent appointments/events
        },
        doctors: {
          select: {
            id: true,
            users_doctors_user_idTousers: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        symptoms: {
          select: {
            id: true,
            symptom_name: true,
            severity: true,
            reported_at: true
          },
          orderBy: {
            reported_at: 'desc'
          },
          take: 5 // Recent symptoms
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform to expected format with Patient Adherence components
    const formattedCarePlans = carePlans.map(carePlan => {
      // Calculate adherence metrics from medication logs
      const medicationLogs = carePlan.prescribed_medications?.flatMap(med => med.medication_logs || []) || [];
      const takenCount = medicationLogs.filter(log => log.adherence_status === 'taken' && log.taken_at).length;
      const overallAdherence = medicationLogs.length > 0 ? Math.round((takenCount / medicationLogs.length) * 100) : 0;
      
      return {
        id: carePlan.id,
        name: carePlan.title || 'Care Plan',
        description: carePlan.description || 'Comprehensive care plan for patient adherence monitoring',
        start_date: carePlan.start_date,
        end_date: carePlan.end_date,
        status: carePlan.status || 'ACTIVE',
        priority: carePlan.priority || 'MEDIUM',
        plan_type: carePlan.plan_type,
        
        // Patient Adherence Metrics
        adherence_overview: {
          overall_adherence_rate: overallAdherence,
          medications_count: carePlan.prescribed_medications?.length || 0,
          vitals_count: carePlan.vitals?.length || 0,
          appointments_count: carePlan.scheduled_events?.length || 0,
          symptoms_count: carePlan.symptoms?.length || 0
        },
        
        // Care Plan Components
        chronic_conditions: carePlan.chronic_conditions,
        risk_factors: carePlan.risk_factors,
        long_term_goals: carePlan.long_term_goals,
        short_term_milestones: carePlan.short_term_milestones,
        
        // Medication Reminders with Adherence Data
        medications: carePlan.prescribed_medications?.map(med => {
          const medLogs = med.medication_logs || [];
          const medTakenCount = medLogs.filter(log => log.adherence_status === 'taken' && log.taken_at).length;
          const medAdherence = medLogs.length > 0 ? Math.round((medTakenCount / medLogs.length) * 100) : 0;
          
          return {
            id: med.id,
            name: med.medicine?.name,
            type: med.medicine?.type,
            description: med.description,
            start_date: med.start_date,
            end_date: med.end_date,
            adherence_rate: medAdherence,
            recent_logs: medLogs.slice(0, 3) // Last 3 adherence records
          };
        }) || [],
        
        // Vital Signs Monitoring
        vitals: carePlan.vitals?.map(vital => ({
          id: vital.id,
          type: vital.vital_type?.name || 'Unknown Vital',
          value: vital.value?.toString() || '0',
          unit: vital.vital_type?.unit || '',
          reading_time: vital.reading_time,
          is_flagged: vital.is_flagged
        })) || [],
        
        // Appointments & Scheduled Events
        appointments: carePlan.scheduled_events?.map(event => ({
          id: event.id,
          type: event.event_type,
          title: event.title,
          start_datetime: event.start_datetime,
          end_datetime: event.end_datetime,
          status: event.status
        })) || [],
        
        // Patient-Reported Symptoms
        symptoms: carePlan.symptoms?.map(symptom => ({
          id: symptom.id,
          name: symptom.symptom_name,
          severity: symptom.severity,
          reported_at: symptom.reported_at
        })) || [],
        
        // Care Team
        doctor: carePlan.doctors ? {
          id: carePlan.doctors.id,
          name: `${carePlan.doctors.users_doctors_user_idTousers?.first_name || ''} ${carePlan.doctors.users_doctors_user_idTousers?.last_name || ''}`.trim()
        } : null,
        
        created_at: carePlan.created_at,
        updated_at: carePlan.updated_at
      };
    });

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