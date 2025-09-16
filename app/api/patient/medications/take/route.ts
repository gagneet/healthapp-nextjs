import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const medicationTakeSchema = z.object({
  medicationId: z.string(),
  dosage: z.string(),
  notes: z.string().optional(),
  takenAt: z.string().optional()
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

    // Create medication log entry
    const medicationLog = await prisma.medicationLog.create({
      data: {
        patientId: patient.id,
        medicationId: validatedData.medicationId,
        dosage: validatedData.dosage,
        takenAt: validatedData.takenAt ? new Date(validatedData.takenAt) : new Date(),
        adherenceStatus: 'TAKEN',
        notes: validatedData.notes,
        createdAt: new Date()
      }
    });

    // Create adherence record
    await prisma.adherenceRecord.create({
      data: {
        patientId: patient.id,
        adherenceType: 'MEDICATION',
        scheduledAt: new Date(), // This should ideally come from a scheduled medication time
        completedAt: validatedData.takenAt ? new Date(validatedData.takenAt) : new Date(),
        isCompleted: true,
        notes: `Medication taken: ${validatedData.dosage}${validatedData.notes ? '. ' + validatedData.notes : ''}`
      }
    });

    return NextResponse.json(formatApiSuccess(medicationLog, 'Medication intake recorded successfully'));
  } catch (error) {
    console.error('Record medication intake error:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}