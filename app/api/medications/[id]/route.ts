import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/auth-helpers";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from "@/lib/prisma";

/**
 * GET /api/medications/{id}
 * Get a single medication by its ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

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

    const medicationId = params.id;
    const user = session.user;

    // Get the medication with all related data
    const medication = await prisma.medication.findUnique({
      where: {
        id: medicationId
      },
      include: {
        medicine: {
          select: {
            name: true,
            type: true,
            description: true,
            details: true
          }
        },
        carePlan: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        patient: {
          select: {
            id: true,
            userId: true,
            primaryCareDoctorId: true
          }
        }
      }
    });

    if (!medication) {
      return NextResponse.json(handleApiError({
        message: 'Medication not found'
      }), { status: 404 });
    }

    // Authorization: Check if user has access to this medication
    let hasAccess = false;
    
    if (user.role === 'PATIENT' && user.patientId === medication.patientId) {
      hasAccess = true;
    } else if (user.role === 'DOCTOR') {
      // Check if doctor is the patient's primary care doctor
      const doctorProfile = await prisma.doctorProfile.findFirst({
        where: { userId: user.id }
      });
      
      if (doctorProfile && medication.patient.primaryCareDoctorId === doctorProfile.id) {
        hasAccess = true;
      }
    } else if (['admin', 'HSP'].includes(user.role)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You do not have permission to view this medication'
      }), { status: 403 });
    }

    // Transform the data
    const transformedMedication = {
      id: medication.id,
      patientId: medication.patientId,
      name: medication.medicine?.name || 'Unknown Medication',
      genericName: (medication.medicine?.details as any)?.genericName || null,
      brandNames: (medication.medicine?.details as any)?.brand_names || null,
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
    };

    return NextResponse.json(formatApiSuccess(
      { medication: transformedMedication },
      'Medication retrieved successfully'
    ));

  } catch (error) {
    console.error('Error fetching medication:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * PUT /api/medications/{id}
 * Update a medication
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors can update medications
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can update medications' } }
      }, { status: 403 });
    }

    const medicationId = params.id;
    const body = await request.json();

    // Get current medication to verify access
    const currentMedication = await prisma.medication.findUnique({
      where: { id: medicationId },
      include: {
        patient: {
          select: {
            primaryCareDoctorId: true
          }
        }
      }
    });

    if (!currentMedication) {
      return NextResponse.json(handleApiError({
        message: 'Medication not found'
      }), { status: 404 });
    }

    // Verify doctor has access
    const doctorProfile = await prisma.doctorProfile.findFirst({
      where: { userId: session.user.id }
    });

    if (!doctorProfile || currentMedication.patient.primaryCareDoctorId !== doctorProfile.id) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You can only update medications for your patients'
      }), { status: 403 });
    }

    // Update medication
    const updatedMedication = await prisma.medication.update({
      where: { id: medicationId },
      data: {
        dosage: body.dosage,
        frequency: body.frequency,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        notes: body.notes,
        status: body.status,
        isCritical: body.isCritical,
        updatedAt: new Date()
      },
      include: {
        medicine: true,
        carePlan: true
      }
    });

    return NextResponse.json(formatApiSuccess(
      { medication: updatedMedication },
      'Medication updated successfully'
    ));

  } catch (error) {
    console.error('Error updating medication:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}