import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/auth-helpers";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from "@/lib/prisma";

/**
 * GET /api/medications/[patientId]
 * Get medications for a specific patient
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    if (!['DOCTOR', 'HSP', 'PATIENT', 'admin'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const user = session.user;
    const patientId = params.patientId;

    // Additional authorization: patients can only access their own medications
    if (user.role === 'PATIENT' && user.patientId !== patientId) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You can only access your own medication data'
      }), { status: 403 });
    }

    // Get medications for the specific patient
    const medications = await prisma.medication.findMany({
      where: {
        patientId: patientId,
        deletedAt: null // Only active medications
      },
      include: {
        medicine: {
          select: {
            name: true,
            genericName: true,
            brandNames: true,
            dosageForm: true,
            strength: true,
            activeIngredient: true,
            category: true,
            description: true
          }
        },
        carePlan: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match frontend expectations
    const transformedMedications = medications.map(medication => ({
      id: medication.id,
      name: medication.medicine?.name || 'Unknown Medication',
      genericName: medication.medicine?.genericName,
      brandNames: medication.medicine?.brandNames,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate?.toISOString(),
      endDate: medication.endDate?.toISOString(),
      lastTaken: medication.lastTaken?.toISOString(),
      nextDue: medication.nextDue?.toISOString(),
      adherenceRate: medication.adherenceRate,
      isCritical: medication.isCritical,
      notes: medication.notes,
      status: medication.status,
      carePlan: medication.carePlan,
      medicine: medication.medicine,
      createdAt: medication.createdAt.toISOString(),
      updatedAt: medication.updatedAt.toISOString()
    }));

    return NextResponse.json(formatApiSuccess(
      { medications: transformedMedications },
      'Patient medications retrieved successfully'
    ));

  } catch (error) {
    console.error('Error fetching patient medications:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}