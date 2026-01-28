// ==============================================================
// POST /api/patient/medications/side-effects
// Report medication side effects
// ==============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { z } from 'zod';

const sideEffectSchema = z.object({
  medicationLogId: z.string().uuid(),
  sideEffects: z.array(z.object({
    symptom: z.string(),
    severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
    description: z.string().optional(),
    startedAt: z.string().datetime().optional()
  })),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'PATIENT') {
      return NextResponse.json(
        handleApiError({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = sideEffectSchema.parse(body);

    // Get patient's ID
    const patient = await prisma.patient.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(
        formatErrorResponse('Patient profile not found', 404),
        { status: 404 }
      );
    }

    // Verify medication log belongs to patient
    const medicationLog = await prisma.medicationLog.findFirst({
      where: {
        id: validatedData.medicationLogId,
        patientId: patient.id
      }
    });

    if (!medicationLog) {
      return NextResponse.json(
        handleApiError({ message: 'Medication log not found or access denied' }),
        { status: 404 }
      );
    }

    // Update medication log with side effects
    const updatedLog = await prisma.medicationLog.update({
      where: { id: validatedData.medicationLogId },
      data: {
        sideEffects: validatedData.sideEffects,
        notes: validatedData.notes
          ? `${medicationLog.notes || ''}\nSide Effects: ${validatedData.notes}`.trim()
          : medicationLog.notes
      }
    });

    return NextResponse.json(
      formatApiSuccess({ data: updatedLog, message: 'Side effects reported successfully' }),
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        handleApiError({ message: 'Invalid request data' }),
        { status: 400 }
      );
    }
    console.error('Error reporting side effects:', error);
    return NextResponse.json(
      handleApiError({ message: 'Failed to report side effects' }),
      { status: 500 }
    );
  }
}

// ==============================================================
// GET /api/patient/medications/side-effects
// Get patient's reported side effects
// ==============================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'PATIENT') {
      return NextResponse.json(
        handleApiError({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get patient's ID
    const patient = await prisma.patient.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(
        handleApiError({ message: 'Patient profile not found' }),
        { status: 404 }
      );
    }

    // Get all medication logs with side effects
    const logsWithSideEffects = await prisma.medicationLog.findMany({
      where: {
        patientId: patient.id,
        sideEffects: {
          not: null
        }
      },
      include: {
        carePlanMedication: {
          include: {
            medicine: true
          }
        },
        prescriptionMedication: {
          include: {
            medicine: true
          }
        }
      },
      orderBy: {
        scheduledTime: 'desc'
      },
      take: 50
    });

    const formattedData = logsWithSideEffects.map(log => ({
      id: log.id,
      medicationName: log.carePlanMedication?.medicine?.name ||
                      log.prescriptionMedication?.medicine?.name ||
                      'Unknown Medication',
      scheduledTime: log.scheduledTime,
      actualTime: log.actualTime,
      sideEffects: log.sideEffects,
      notes: log.notes,
      status: log.status
    }));

    return NextResponse.json(
      formatApiSuccess({ data: formattedData, message: 'Side effects retrieved successfully' }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching side effects:', error);
    return NextResponse.json(
      handleApiError({ message: 'Failed to fetch side effects' }),
      { status: 500 }
    );
  }
}
