// app/api/assignments/secondary-doctors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

// Get specific assignment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const assignmentId = params.id;

    const assignment = await prisma.secondary_doctor_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        patients: {
          select: {
            id: true,
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        doctors_secondary_doctor_assignments_primary_doctor_idTodoctors: {
          select: {
            id: true,
            users_doctors_user_idTousers: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            },
            specialities: {
              select: {
                name: true
              }
            }
          }
        },
        doctors_secondary_doctor_assignments_secondary_doctor_idTodoctors: {
          select: {
            id: true,
            users_doctors_user_idTousers: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            },
            specialities: {
              select: {
                name: true
              }
            }
          }
        },
        hsps: {
          select: {
            id: true,
            users: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        patient_consent_otp: {
          select: {
            id: true,
            consent_method: true,
            is_verified: true,
            verified_at: true,
            created_at: true
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
      const patient = await prisma.Patient.findFirst({
        where: { user_id: session.user.id }
      });
      if (!patient || assignment.patient_id !== patient.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Access denied' } }
        }, { status: 403 });
      }
    } else if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: session.user.id }
      });
      if (!doctor || (assignment.primary_doctor_id !== doctor.id && assignment.secondary_doctor_id !== doctor.id)) {
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
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors and admins can update assignments
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
      specialty_focus,
      care_plan_ids,
      consent_duration_months,
      assignment_start_date,
      assignment_end_date,
      is_active
    } = body;

    // Find existing assignment
    const existingAssignment = await prisma.secondary_doctor_assignments.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Assignment not found' } }
      }, { status: 404 });
    }

    // Check permissions for doctors
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: session.user.id }
      });
      if (!doctor || existingAssignment.primary_doctor_id !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only update your own assignments' } }
        }, { status: 403 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    if (secondary_doctor_id !== undefined) updateData.secondary_doctor_id = secondary_doctor_id;
    if (secondary_hsp_id !== undefined) updateData.secondary_hsp_id = secondary_hsp_id;
    if (assignment_reason !== undefined) updateData.assignment_reason = assignment_reason;
    if (specialty_focus !== undefined) updateData.specialty_focus = specialty_focus;
    if (care_plan_ids !== undefined) updateData.care_plan_ids = care_plan_ids;
    if (consent_duration_months !== undefined) updateData.consent_duration_months = consent_duration_months;
    if (assignment_start_date !== undefined) updateData.assignment_start_date = new Date(assignment_start_date);
    if (assignment_end_date !== undefined) updateData.assignment_end_date = assignment_end_date ? new Date(assignment_end_date) : null;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update consent expiration if duration changed
    if (consent_duration_months !== undefined) {
      const newExpiresAt = new Date();
      newExpiresAt.setMonth(newExpiresAt.getMonth() + consent_duration_months);
      updateData.consent_expires_at = newExpiresAt;
    }

    const updatedAssignment = await prisma.secondary_doctor_assignments.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        patients: {
          select: {
            id: true,
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        doctors_secondary_doctor_assignments_primary_doctor_idTodoctors: {
          select: {
            id: true,
            users_doctors_user_idTousers: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        doctors_secondary_doctor_assignments_secondary_doctor_idTodoctors: {
          select: {
            id: true,
            users_doctors_user_idTousers: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        hsps: {
          select: {
            id: true,
            users: {
              select: {
                first_name: true,
                last_name: true
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
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors and admins can delete assignments
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const assignmentId = params.id;

    // Find existing assignment
    const existingAssignment = await prisma.secondary_doctor_assignments.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Assignment not found' } }
      }, { status: 404 });
    }

    // Check permissions for doctors
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: session.user.id }
      });
      if (!doctor || existingAssignment.primary_doctor_id !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only delete your own assignments' } }
        }, { status: 403 });
      }
    }

    // Soft delete - deactivate assignment
    await prisma.secondary_doctor_assignments.update({
      where: { id: assignmentId },
      data: {
        is_active: false,
        deleted_at: new Date(),
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { assignment_id: assignmentId },
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
