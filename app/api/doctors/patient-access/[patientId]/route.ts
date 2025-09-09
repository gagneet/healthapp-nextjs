import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import SecondaryDoctorService from '@/lib/secondary-doctor-service';

/**
 * GET /api/doctors/patient-access/{patientId}
 * Check if current doctor can access a specific patient
 */
export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors can check patient access
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can check patient access' } }
      }, { status: 403 });
    }

    const { patientId } = params;

    // Get doctor profile
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

    // Check access permissions
    const accessResult = await SecondaryDoctorService.canDoctorAccessPatient(doctor.id, patientId);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          canAccess: accessResult.canAccess,
          assignmentType: accessResult.assignmentType,
          permissions: accessResult.permissions,
          requiresConsent: accessResult.requiresConsent,
          consentStatus: accessResult.consentStatus,
          reason: accessResult.reason
        },
        message: accessResult.canAccess ? 'Access granted' : 'Access denied'
      }
    });

  } catch (error) {
    console.error('Error checking patient access:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}