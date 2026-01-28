// ==============================================================
// POST /api/patient/medications/refill
// Request medication refill
// ==============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { z } from 'zod';

const refillRequestSchema = z.object({
  carePlanMedicationId: z.string().uuid().optional(),
  medicineName: z.string(),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  urgency: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).default('NORMAL')
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
    const validatedData = refillRequestSchema.parse(body);

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

    // If carePlanMedicationId provided, verify it belongs to patient
    if (validatedData.carePlanMedicationId) {
      const medication = await prisma.carePlanMedication.findFirst({
        where: {
          id: validatedData.carePlanMedicationId,
          carePlan: {
            patientId: patient.id
          }
        }
      });

      if (!medication) {
        return NextResponse.json(
          handleApiError({ message: 'Medication not found or access denied' }),
          { status: 404 }
        );
      }
    }

    // Create refill request
    const refillRequest = await prisma.refillRequest.create({
      data: {
        patientId: patient.id,
        carePlanMedicationId: validatedData.carePlanMedicationId,
        medicineName: validatedData.medicineName,
        quantity: validatedData.quantity,
        reason: validatedData.reason,
        urgency: validatedData.urgency
      }
    });

    // Create notification for doctor (if care plan medication)
    if (validatedData.carePlanMedicationId) {
      const carePlanMedication = await prisma.carePlanMedication.findUnique({
        where: { id: validatedData.carePlanMedicationId },
        include: {
          carePlan: {
            include: {
              doctor: true
            }
          }
        }
      });

      if (carePlanMedication?.carePlan?.doctor) {
        await prisma.notification.create({
          data: {
            userId: carePlanMedication.carePlan.doctor.userId,
            type: 'MEDICATION_REFILL_DUE',
            title: 'Medication Refill Request',
            message: `Patient has requested a refill for ${validatedData.medicineName}`,
            relatedResourceType: 'refill_request',
            relatedResourceId: refillRequest.id,
            urgency: validatedData.urgency
          }
        });
      }
    }

    return NextResponse.json(
      formatApiSuccess({ data: refillRequest, message: 'Refill request submitted successfully' }),
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        handleApiError({ message: 'Invalid request data' }),
        { status: 400 }
      );
    }
    console.error('Error creating refill request:', error);
    return NextResponse.json(
      handleApiError({ message: 'Failed to create refill request' }),
      { status: 500 }
    );
  }
}

// ==============================================================
// GET /api/patient/medications/refill
// Get patient's refill requests
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

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

    // Get refill requests
    const refillRequests = await prisma.refillRequest.findMany({
      where: {
        patientId: patient.id,
        ...(status && { status: status as any })
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    return NextResponse.json(
      formatApiSuccess({ data: refillRequests, message: 'Refill requests retrieved successfully' }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching refill requests:', error);
    return NextResponse.json(
      handleApiError({ message: 'Failed to fetch refill requests' }),
      { status: 500 }
    );
  }
}
