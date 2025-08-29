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
      { primaryCareHspId: hspId },
      {
        patientProviderAssignments: {
          some: {
            // hsp_id is not a valid field on PatientProviderAssignment. This seems to be a logic error.
            // providerId: hspId,
            hspId: hspId,
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
      status: 'ACTIVE'
      // isActive: true
    },
    include: {
      // 'medications' is a json field, the relation is 'prescribedMedications'
      prescribedMedications: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              genericName: true,
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
          overallAdherenceScore: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get vital requirements and readings
  const vitalRequirements = await prisma.vitalRequirement.findMany({
    // VitalRequirement is linked to CarePlan, not directly to Patient.
    where: { carePlan: { patientId: patientId } },
    include: {
      vitalType: {
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

  // The model is VitalReading, not vitals
  const vitalReadings = await prisma.vitalReading.findMany({
    where: {
      patientId: patientId,
      readingTime: {
        gte: thirtyDaysAgo
      }
    },
    include: {
      vitalType: {
        select: {
          id: true,
          name: true,
          unit: true
        }
      }
    },
    orderBy: { readingTime: 'desc' }
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
export async function GET(request: NextRequest, { params }: { params: { id:string } }) {
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
    const formattedCarePlans = await Promise.all(
      carePlans.map(async (carePlan: any) => {
        const medicationsCount = carePlan.prescribedMedications?.length || 0;

        const vitalsCount = await prisma.vitalRequirement.count({
          where: { carePlanId: carePlan.id },
        });

        const appointmentWhere: any = {
          patientId: patientId,
          startDate: { gte: carePlan.startDate },
        };
        if (carePlan.endDate) {
          appointmentWhere.startDate.lte = carePlan.endDate;
        }

        const appointmentsCount = await prisma.appointment.count({
          where: appointmentWhere,
        });

        return {
          id: carePlan.id,
          name: carePlan.title || 'Unnamed Care Plan',
          status: carePlan.status,
          priority: carePlan.priority || 'medium',
          startDate: carePlan.startDate,
          endDate: carePlan.endDate,
          medicationsCount,
          vitalsCount,
          appointmentsCount,
        };
      })
    );

    // Format vital requirements
    const formattedVitalRequirements = vitalRequirements.map((req: any) => ({
      id: req.id,
      vitalType: req.vitalType,
      frequency: req.frequency,
      targetRangeMin: req.target_range_min,
      targetRangeMax: req.target_range_max,
      isCritical: req.isCritical
    }));

    // Format vital readings
    const formattedVitalReadings = vitalReadings.map((reading: any) => ({
      id: reading.id,
      vitalType: reading.vitalType,
      value: reading.value,
      readingTime: reading.readingTime,
      isNormal: reading.is_normal, // is_normal does not exist on VitalReading model
      alertLevel: reading.alertLevel
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
            adherenceScore: patient.overallAdherenceScore
          }
        },
        message: 'Patient care plan details retrieved successfully'
      }
    });

  } catch (error: any) {
    console.error('Error fetching patient care plan details:', error);
    const errorMessage = error.message || 'Internal server error';
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: errorMessage, details: error.toString() } }
    }, { status: 500 });
  }
}
