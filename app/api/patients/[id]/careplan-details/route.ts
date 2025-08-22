import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * Authenticate and authorize user for care plan access
 */
async function authenticateAndAuthorize(session: any) {
  if (!session?.user) {
    return {
      error: {
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }
    };
  }

  if (!['DOCTOR', 'HSP'].includes(session.user.role)) {
    return {
      error: {
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and HSPs can access patient care plans' } }
      }
    };
  }

  return { success: true };
}

/**
 * Get doctor or HSP profile based on user role
 */
async function getProviderProfile(session: any) {
  if (session.user.role === 'DOCTOR') {
    const doctor = await prisma.doctor.findFirst({
      where: { user_id: session.user.id }
    });
    
    if (!doctor) {
      return {
        error: {
          status: false,
          statusCode: 404,
          payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
        }
      };
    }
    
    return { success: true, doctorId: doctor.id, hspId: null };
  } else if (session.user.role === 'HSP') {
    const hsp = await prisma.hsp.findFirst({
      where: { user_id: session.user.id }
    });
    
    if (!hsp) {
      return {
        error: {
          status: false,
          statusCode: 404,
          payload: { error: { status: 'not_found', message: 'HSP profile not found' } }
        }
      };
    }
    
    return { success: true, doctorId: null, hspId: hsp.id };
  }
  
  return {
    error: {
      status: false,
      statusCode: 403,
      payload: { error: { status: 'forbidden', message: 'Invalid user role' } }
    }
  };
}

/**
 * Verify access to patient based on provider type
 */
async function verifyPatientAccess(patientId: string, doctorId: string | null, hspId: string | null) {
  const whereClause: any = { id: patientId };
  
  if (doctorId) {
    whereClause.OR = [
      { primary_care_doctor_id: doctorId },
      {
        patient_doctor_assignments: {
          some: { 
            doctor_id: doctorId, 
            is_active: true 
          }
        }
      }
    ];
  } else if (hspId) {
    whereClause.OR = [
      { hsp_id: hspId },
      {
        patient_provider_assignments: {
          some: {
            hsp_id: hspId,
            is_active: true
          }
        }
      }
    ];
  }

  const patient = await prisma.patient.findFirst({ where: whereClause });
  
  if (!patient) {
    return {
      error: {
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Access denied to patient' } }
      }
    };
  }
  
  return { success: true, patient };
}

/**
 * GET /api/patients/{id}/careplan-details
 * Get detailed care plans for a specific patient
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const { id: patientId } = params;

    // Authenticate and authorize user
    const authResult = await authenticateAndAuthorize(session);
    if (authResult.error) {
      return NextResponse.json(authResult.error, { status: authResult.error.statusCode });
    }

    // Get provider profile (doctor or HSP)
    const providerResult = await getProviderProfile(session);
    if (providerResult.error) {
      return NextResponse.json(providerResult.error, { status: providerResult.error.statusCode });
    }

    const { doctorId, hspId } = providerResult;

    // Verify access to patient
    const patientAccessResult = await verifyPatientAccess(patientId, doctorId, hspId);
    if (patientAccessResult.error) {
      return NextResponse.json(patientAccessResult.error, { status: patientAccessResult.error.statusCode });
    }

    // Now fetch the comprehensive care plan data
    const carePlanData = await fetchCarePlanData(patientId);
              }
            }
          ]
        } : {}),
        ...(hspId ? { 
          // HSPs can also be assigned to patients 
          hsp_assignments: {
            some: { 
              hsp_id: hspId, 
              is_active: true 
            }
          }
        } : {})
      }
    });

    if (!patient) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Patient not found or access denied' } }
      }, { status: 404 });
    }

    // Get detailed care plans for this patient following proper healthcare business logic
    const carePlans = await prisma.carePlan.findMany({
      where: {
        patient_id: patient.id
      },
      include: {
        // Medication Reminders (only for Doctors - HSPs cannot access per business rules)
        ...(session.user.role === 'DOCTOR' ? {
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
                take: 5 // Recent adherence data
              }
            }
          }
        } : {}),
        // Vital Requirements (not actual readings - those are separate)
        vital_requirements: {
          select: {
            id: true,
            description: true,
            start_date: true,
            end_date: true,
            details: true
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 10 // Recent vitals requirements
        },
        // Appointments/Scheduled Events  
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
        // Care Plan Creator (Doctor or HSP)
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
        hsps: {
          select: {
            id: true,
            users_hsps_user_idTousers: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        // Patient-Reported Symptoms
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

    // Also get patient's actual vital readings for Patient Adherence monitoring
    const vitalReadings = await prisma.vitalReading.findMany({
      where: {
        patient_id: patient.id
      },
      include: {
        vital_type: {
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
        reading_time: 'desc'
      },
      take: 20 // Recent vital readings for adherence analysis
    });

    // Transform to expected format following healthcare business logic
    const formattedCarePlans = carePlans.map(carePlan => {
      // Calculate adherence metrics from medication logs (only for Doctors)
      const medicationLogs = (session.user.role === 'DOCTOR' && carePlan.prescribed_medications) ? 
        carePlan.prescribed_medications.flatMap(med => med.medication_logs || []) : [];
      const takenCount = medicationLogs.filter(log => log.adherence_status === 'taken' && log.taken_at).length;
      const overallAdherence = medicationLogs.length > 0 ? Math.round((takenCount / medicationLogs.length) * 100) : 0;
      
      return {
        id: carePlan.id,
        name: carePlan.title || 'Care Plan',
        description: carePlan.description || 'Comprehensive care plan for patient monitoring',
        start_date: carePlan.start_date,
        end_date: carePlan.end_date,
        status: carePlan.status || 'ACTIVE',
        priority: carePlan.priority || 'MEDIUM',
        plan_type: carePlan.plan_type,
        
        // Patient Adherence Metrics (HSPs see limited metrics without medication data)
        adherence_overview: {
          overall_adherence_rate: session.user.role === 'DOCTOR' ? overallAdherence : null,
          medications_count: session.user.role === 'DOCTOR' ? (carePlan.prescribed_medications?.length || 0) : null,
          vitals_count: carePlan.vital_requirements?.length || 0,
          appointments_count: carePlan.scheduled_events?.length || 0,
          symptoms_count: carePlan.symptoms?.length || 0
        },
        
        // Care Plan Components - Following proper healthcare structure
        chronic_conditions: carePlan.chronic_conditions || [],
        risk_factors: carePlan.risk_factors || [],
        long_term_goals: carePlan.long_term_goals || [],
        short_term_milestones: carePlan.short_term_milestones || [],
        
        // Medication Reminders (only available to Doctors per business rules)
        ...(session.user.role === 'DOCTOR' ? {
          medications: carePlan.prescribed_medications?.map(med => {
            const medLogs = med.medication_logs || [];
            const medTakenCount = medLogs.filter(log => log.adherence_status === 'taken' && log.taken_at).length;
            const medAdherence = medLogs.length > 0 ? Math.round((medTakenCount / medLogs.length) * 100) : 0;
            
            // Get dosage, frequency from medication details (should be in Medication table, not CarePlan)
            const details = med.details as any || {};
            
            return {
              id: med.id,
              name: med.medicine?.name || 'Unknown Medication',
              type: med.medicine?.type,
              description: med.description || med.medicine?.description,
              dosage: details.dosage || 'Dosage not specified',
              frequency: details.frequency || 'Frequency not specified',
              is_critical: details.is_critical || false,
              start_date: med.start_date,
              end_date: med.end_date,
              adherence_rate: medAdherence,
              recent_logs: medLogs.slice(0, 5) // Last 5 adherence records
            };
          }) || []
        } : {}),
        
        // Vital Requirements (not actual readings - those come from vitalReadings)
        vital_requirements: carePlan.vital_requirements?.map(vital => ({
          id: vital.id,
          description: vital.description,
          start_date: vital.start_date,
          end_date: vital.end_date,
          details: vital.details
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
        
        // Care Team - Can be created by Doctor or HSP
        care_provider: carePlan.doctors ? {
          id: carePlan.doctors.id,
          name: `${carePlan.doctors.users_doctors_user_idTousers?.first_name || ''} ${carePlan.doctors.users_doctors_user_idTousers?.last_name || ''}`.trim(),
          type: 'DOCTOR'
        } : carePlan.hsps ? {
          id: carePlan.hsps.id,
          name: `${carePlan.hsps.users_hsps_user_idTousers?.first_name || ''} ${carePlan.hsps.users_hsps_user_idTousers?.last_name || ''}`.trim(),
          type: 'HSP'
        } : null,
        
        created_at: carePlan.created_at,
        updated_at: carePlan.updated_at
      };
    });

    // Format vital readings for Patient Adherence monitoring
    const formattedVitalReadings = vitalReadings.map(reading => ({
      id: reading.id,
      type: reading.vital_type?.name || 'Unknown Vital',
      value: reading.value?.toString() || '0',
      unit: reading.vital_type?.unit || '',
      reading_time: reading.reading_time,
      is_flagged: reading.is_flagged || false,
      is_validated: reading.is_validated || false,
      notes: reading.notes,
      normal_range: {
        min: reading.vital_type?.normal_range_min?.toString() || '0',
        max: reading.vital_type?.normal_range_max?.toString() || '100'
      },
      systolic_value: reading.systolic_value?.toString(),
      diastolic_value: reading.diastolic_value?.toString(),
      alert_level: reading.alert_level
    }));

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          carePlans: formattedCarePlans,
          vitalReadings: formattedVitalReadings, // Actual patient vital readings
          patient: {
            id: patient.id,
            patient_id: patient.patient_id,
            adherence_score: patient.overall_adherence_score
          }
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