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

    // Get medication reminders for this patient through their care plans (proper business logic)
    // Medications are linked through CarePlans as prescribedMedications (Medication Reminders)
    const carePlansWithMedications = await prisma.carePlan.findMany({
      where: {
        patientId: patient.id,
        // Only show care plans where the doctor has access (if user is doctor)
        ...(doctorId ? { createdByDoctorId: doctorId } : {})
      },
      include: {
        prescribedMedications: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                type: true,
                description: true
              }
            },
            medicationLogs: {
              select: {
                id: true,
                scheduledAt: true,
                takenAt: true,
                adherenceStatus: true
              },
              orderBy: {
                scheduledAt: 'desc'
              },
              take: 5 // Last 5 logs for adherence calculation
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Extract all medications from all care plans
    const medications = carePlansWithMedications.flatMap(carePlan => 
      carePlan.prescribedMedications.map(med => ({
        ...med,
        carePlan: {
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
      const logs = med.medicationLogs || [];
      const takenCount = logs.filter(log => log.adherenceStatus === 'TAKEN' && log.takenAt).length;
      const adherenceRate = logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : 0;
      
      // Find last taken and next due
      const lastTakenLog = logs.find(log => log.takenAt);
      const nextScheduledLog = logs.find(log => !log.takenAt && log.scheduledAt > new Date());
      
      // Get medication details (dosage, frequency, etc. should be in Medication table)
      const details = med.details as any || {};
      
      return {
        id: med.id,
        name: med.medicine?.name || 'Unknown Medication',
        dosage: details.dosage || 'Dosage not specified',
        frequency: details.frequency || 'Frequency not specified',
        startDate: med.startDate,
        endDate: med.endDate,
        isCritical: details.is_critical || false,
        lastTaken: lastTakenLog?.takenAt || null,
        nextDue: nextScheduledLog?.scheduledAt || null,
        adherenceRate: adherenceRate,
        status: med.carePlan?.status || 'active',
        instructions: med.description || med.medicine?.description,
        carePlan: {
          id: med.carePlan?.id,
          title: med.carePlan?.title,
          description: med.carePlan?.description
        },
        // Additional medication reminder properties
        medicineType: med.medicine?.type,
        participantId: med.participantId, // Patient ID
        createdAt: med.createdAt,
        updatedAt: med.updatedAt
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