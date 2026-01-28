import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


export const dynamic = 'force-dynamic';

const medicationTakeSchema = z.object({
  medicationId: z.string().uuid(),
  dosage: z.string().min(1),
  notes: z.string().optional(),
  takenAt: z.string().datetime().optional()
});

/**
 * POST /api/patient/medications/take
 * Record medication taken by patient
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({
        message: 'Only patients can record their own medication intake'
      }), { status: 403 });
    }

    const body = await request.json();
    const validatedData = medicationTakeSchema.parse(body);

    // Get patient profile
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id }
    });

    if (!patient) {
      return NextResponse.json(handleApiError({
        message: 'Patient profile not found'
      }), { status: 404 });
    }

    const medication = await prisma.medication.findFirst({
      where: {
        id: validatedData.medicationId,
        participantId: patient.id,
        deletedAt: null
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        details: true
      }
    });

    if (!medication) {
      return NextResponse.json(handleApiError({
        message: 'Medication not found or access denied'
      }), { status: 404 });
    }

    const takenAt = validatedData.takenAt ? new Date(validatedData.takenAt) : new Date();
    const medicationDetails = medication.details as Record<string, unknown> | null;
    const instructions = typeof medicationDetails?.instructions === 'string' ? medicationDetails.instructions : null;

    const adherenceLog = await prisma.adherenceLog.create({
      data: {
        patientId: patient.id,
        adherenceType: 'medication',
        relatedMedicationId: medication.id,
        scheduledDatetime: takenAt,
        actualDatetime: takenAt,
        status: 'taken',
        completionPercentage: 100,
        patientNotes: validatedData.notes,
        recordedBy: 'patient',
        recordedByUserId: session.user.id
      }
    });

    await prisma.medicationLog.create({
      data: {
        id: crypto.randomUUID(),
        medicationId: medication.id,
        patientId: patient.id,
        scheduledAt: takenAt,
        takenAt,
        dosageTaken: validatedData.dosage,
        notes: validatedData.notes,
        adherenceStatus: 'TAKEN',
        reminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(formatApiSuccess({
      id: adherenceLog.id,
      medicationId: medication.id,
      takenAt: adherenceLog.actualDatetime,
      dosage: validatedData.dosage,
      instructions,
      notes: adherenceLog.patientNotes
    }, 'Medication intake recorded successfully'));
  } catch (error) {
    console.error('Record medication intake error:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
