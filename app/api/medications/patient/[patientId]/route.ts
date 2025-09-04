import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/auth-helpers";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from "@/lib/prisma";

/**
 * GET /api/medications/patient/[patientId]
 * Get all medications for a specific patient
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
        participantId: patientId,
        deletedAt: null // Only active medications
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        details: true,
        createdAt: true,
        updatedAt: true,
        medicine: {
          select: {
            name: true,
            type: true,
            description: true,
            details: true,
          }
        },
        carePlan: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match frontend expectations
    const transformedMedications = medications.map(medication => {
      const medicineDetails = medication.medicine?.details as any || {};
      const medicationDetails = medication.details as any || {};
      return {
          id: medication.id,
          name: medication.medicine?.name || 'Unknown Medication',
          genericName: medicineDetails.genericName || null,
          brandNames: medicineDetails.brand_names || null,
          dosage: medicationDetails.dosage || null,
          frequency: medicationDetails.frequency || null,
          startDate: medication.startDate?.toISOString(),
          endDate: medication.endDate?.toISOString(),
          lastTaken: medicationDetails.lastTaken || null,
          nextDue: medicationDetails.nextDue || null,
          adherenceRate: medicationDetails.adherenceRate || 0,
          isCritical: medicationDetails.isCritical || false,
          notes: medicationDetails.notes || '',
          status: medicationDetails.status || 'ACTIVE',
          carePlan: medication.carePlan,
          createdAt: medication.createdAt.toISOString(),
          updatedAt: medication.updatedAt.toISOString()
      };
    });

    return NextResponse.json(formatApiSuccess(
      { medications: transformedMedications },
      'Patient medications retrieved successfully'
    ));

  } catch (error) {
    console.error('Error fetching patient medications:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}