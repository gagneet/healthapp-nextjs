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
      where: { userId: session.user.id }
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
      where: { userId: session.user.id }
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
      { primaryCareDoctorId: doctorId },
      {
        patientDoctorAssignments: {
          some: { 
            doctorId: doctorId, 
            isActive: true 
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
            isActive: true
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
 * Fetch comprehensive care plan data for a patient
 */
async function fetchCarePlanData(patientId: string) {
  // Get all care plans for the patient with comprehensive data
  const carePlans = await prisma.carePlan.findMany({
    where: {
      patientId: patientId,
      isActive: true
    },
    include: {
      medications: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              generic_name: true,
              strength: true,
              form: true,
              category: true
            }
          }
        }
      },
      patient: {
        select: {
          id: true,
          patientId: true,
          overall_adherence_score: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get vital requirements and readings
  const vitalRequirements = await prisma.vital_requirements.findMany({
    where: { patientId: patientId },
    include: {
      vital_templates: {
        select: {
          id: true,
          name: true,
          unit: true,
          normalRangeMin: true,
          normalRangeMax: true
        }
      }
    }
  });

  // Get recent vital readings (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const vitalReadings = await prisma.vitals.findMany({
    where: {
      patientId: patientId,
      recorded_at: {
        gte: thirtyDaysAgo
      }
    },
    include: {
      vital_templates: {
        select: {
          id: true,
          name: true,
          unit: true
        }
      }
    },
    orderBy: { recorded_at: 'desc' }
  });

  return {
    carePlans,
    vitalRequirements,
    vitalReadings
  };
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
    const { carePlans, vitalRequirements, vitalReadings } = await fetchCarePlanData(patientId);

    // Format the care plans data
    const formattedCarePlans = carePlans.map(carePlan => ({
      id: carePlan.id,
      title: carePlan.title || 'Care Plan',
      description: carePlan.description,
      status: carePlan.status,
      createdAt: carePlan.createdAt,
      updatedAt: carePlan.updatedAt,
      medications: carePlan.medications.map(med => ({
        id: med.id,
        medicine: med.medicine,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
        adherence_score: med.adherence_score
      }))
    }));

    // Format vital requirements
    const formattedVitalRequirements = vitalRequirements.map(req => ({
      id: req.id,
      vital_type: req.vital_templates,
      frequency: req.frequency,
      target_range_min: req.target_range_min,
      target_range_max: req.target_range_max,
      is_critical: req.is_critical
    }));

    // Format vital readings
    const formattedVitalReadings = vitalReadings.map(reading => ({
      id: reading.id,
      vital_type: reading.vital_templates,
      value: reading.value,
      recorded_at: reading.recorded_at,
      is_normal: reading.is_normal,
      alert_level: reading.alert_level
    }));

    // Get patient information from the access result
    const patient = patientAccessResult.patient;

    // Return the formatted response
    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          carePlans: formattedCarePlans,
          vitalRequirements: formattedVitalRequirements,
          vitalReadings: formattedVitalReadings,
          patient: {
            id: patient.id,
            patientId: patient.patientId,
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

