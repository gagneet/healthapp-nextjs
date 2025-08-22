import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import SecondaryDoctorService, { AssignmentType } from '@/lib/secondary-doctor-service';

/**
 * GET /api/patients/{id}/secondary-doctors
 * Get all secondary doctor assignments for a patient
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

    // Only doctors and admins can view patient assignments
    if (!['DOCTOR', 'ADMIN', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const { id: patientId } = params;

    const result = await SecondaryDoctorService.getPatientAssignments(patientId);

    if (!result.success) {
      return NextResponse.json({
        status: false,
        statusCode: 500,
        payload: { error: { status: 'error', message: result.message || 'Failed to fetch assignments' } }
      }, { status: 500 });
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          assignments: result.assignments
        },
        message: 'Patient assignments retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching patient assignments:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

/**
 * POST /api/patients/{id}/secondary-doctors
 * Create a new secondary doctor assignment
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only primary doctors and admins can create assignments
    if (!['DOCTOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors and admins can create assignments' } }
      }, { status: 403 });
    }

    const { id: patientId } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.doctorId || !body.assignmentType) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Doctor ID and assignment type are required' } }
      }, { status: 400 });
    }

    // Validate assignment type
    if (!Object.values(AssignmentType).includes(body.assignmentType)) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Invalid assignment type' } }
      }, { status: 400 });
    }

    const assignmentRequest = {
      patientId,
      doctorId: body.doctorId,
      assignmentType: body.assignmentType as AssignmentType,
      assignedBy: session.user.id, // Current user creating the assignment
      specialtyFocus: body.specialtyFocus || [],
      carePlanIds: body.carePlanIds || [],
      assignmentReason: body.assignmentReason,
      notes: body.notes,
      requiresSameOrganization: body.requiresSameOrganization || false
    };

    const result = await SecondaryDoctorService.assignSecondaryDoctor(assignmentRequest);

    if (!result.success) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'assignment_error', message: result.message } }
      }, { status: 400 });
    }

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: {
          assignmentId: result.assignmentId,
          requiresConsent: result.requiresConsent,
          // Don't expose OTP in production
          ...(process.env.NODE_ENV === 'development' && { consentOtp: result.consentOtp })
        },
        message: result.message
      }
    });

  } catch (error) {
    console.error('Error creating secondary doctor assignment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}