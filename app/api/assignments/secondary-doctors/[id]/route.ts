// app/api/assignments/secondary-doctors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

// Get specific assignment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const assignmentId = params.id;

    const assignment = await prisma.secondaryDoctorAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        primaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            specialty: {
              select: {
                name: true
              }
            }
          }
        },
        secondaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            specialty: {
              select: {
                name: true
              }
            }
          }
        },
        secondaryHsp: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        patientConsentOtps: {
          select: {
            id: true,
            otpMethod: true,
            isVerified: true,
            verifiedAt: true,
            createdAt: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Assignment not found' } }
      }, { status: 404 });
    }

    // Check access permissions
    if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id }
      });
      if (!patient || assignment.patientId !== patient.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Access denied' } }
        }, { status: 403 });
      }
    } else if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findFirst({
        where: { userId: session.user.id }
      });
      if (!doctor || (assignment.primaryDoctorId !== doctor.id && assignment.secondaryDoctorId !== doctor.id)) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Access denied' } }
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { assignment },
        message: 'Assignment retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

// Update assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const assignmentId = params.id;
    const body = await request.json();
    const {
      secondary_doctor_id,
      secondary_hsp_id,
      assignment_reason,
      specialtyFocus,
      care_plan_ids,
      consent_duration_months,
      assignment_start_date,
      assignment_end_date,
      isActive
    } = body;

    const existingAssignment = await prisma.secondaryDoctorAssignment.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Assignment not found' } }
      }, { status: 404 });
    }

    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findFirst({
        where: { userId: session.user.id }
      });
      if (!doctor || existingAssignment.primaryDoctorId !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only update your own assignments' } }
        }, { status: 403 });
      }
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (secondary_doctor_id !== undefined) updateData.secondaryDoctorId = secondary_doctor_id;
    if (secondary_hsp_id !== undefined) updateData.secondaryHspId = secondary_hsp_id;
    if (assignment_reason !== undefined) updateData.assignmentReason = assignment_reason;
    if (specialtyFocus !== undefined) updateData.specialtyFocus = specialtyFocus;
    if (care_plan_ids !== undefined) updateData.carePlanIds = care_plan_ids;
    if (consent_duration_months !== undefined) updateData.consentDurationMonths = consent_duration_months;
    if (assignment_start_date !== undefined) updateData.assignmentStartDate = new Date(assignment_start_date);
    if (assignment_end_date !== undefined) updateData.assignmentEndDate = assignment_end_date ? new Date(assignment_end_date) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (consent_duration_months !== undefined) {
      const newExpiresAt = new Date();
      newExpiresAt.setMonth(newExpiresAt.getMonth() + consent_duration_months);
      updateData.consentExpiresAt = newExpiresAt;
    }

    const updatedAssignment = await prisma.secondaryDoctorAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        primaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        secondaryDoctor: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        secondaryHsp: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { assignment: updatedAssignment },
        message: 'Assignment updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

// Delete/deactivate assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const assignmentId = params.id;

    const existingAssignment = await prisma.secondaryDoctorAssignment.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Assignment not found' } }
      }, { status: 404 });
    }

    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findFirst({
        where: { userId: session.user.id }
      });
      if (!doctor || existingAssignment.primaryDoctorId !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only delete your own assignments' } }
        }, { status: 403 });
      }
    }

    await prisma.secondaryDoctorAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { assignmentId: assignmentId },
        message: 'Assignment deactivated successfully'
      }
    });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
