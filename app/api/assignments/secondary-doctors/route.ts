// app/api/assignments/secondary-doctors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only allow specific roles to view secondary doctor assignments
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PATIENT'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    let whereClause: any = {};

    // Role-based filtering
    if (session.user.role === 'PATIENT') {
      // Patients can only see their own secondary doctor assignments
      const patient = await prisma.patient.findFirst({
        where: { user_id: session.user.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patient_id = patient.id;
    } else if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: session.user.id }
      });
      if (!doctor) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Doctor profile not found' } }
        }, { status: 403 });
      }
      // Doctors can see assignments where they are primary or secondary
      whereClause.OR = [
        { primary_doctor_id: doctor.id },
        { secondary_doctor_id: doctor.id }
      ];
    }

    const assignments = await prisma.secondary_doctor_assignments.findMany({
      where: whereClause,
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
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { assignments },
        message: 'Secondary doctor assignments retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching secondary doctor assignments:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors and admins can create secondary assignments
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      patient_id,
      primary_doctor_id,
      secondary_doctor_id,
      secondary_hsp_id,
      assignment_reason,
      specialty_focus,
      care_plan_ids,
      consent_duration_months = 6,
      assignment_start_date,
      assignment_end_date
    } = body;

    // Validation
    if (!patient_id || !primary_doctor_id) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Patient and primary doctor are required' } }
      }, { status: 400 });
    }

    if (!secondary_doctor_id && !secondary_hsp_id) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Either secondary doctor or secondary HSP is required' } }
      }, { status: 400 });
    }

    // Check if user has permission to create this assignment
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: session.user.id }
      });
      if (!doctor || doctor.id !== primary_doctor_id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only assign secondary doctors to your own patients' } }
        }, { status: 403 });
      }
    }

    // Generate unique ID for assignment
    const { randomUUID } = await import('crypto');
    const assignmentId = randomUUID();

    // Calculate consent expiration date
    const consentExpiresAt = new Date();
    consentExpiresAt.setMonth(consentExpiresAt.getMonth() + consent_duration_months);

    const assignment = await prisma.secondary_doctor_assignments.create({
      data: {
        id: assignmentId,
        patient_id,
        primary_doctor_id,
        secondary_doctor_id: secondary_doctor_id || null,
        secondary_hsp_id: secondary_hsp_id || null,
        assignment_reason: assignment_reason || null,
        specialty_focus: specialty_focus || [],
        care_plan_ids: care_plan_ids || [],
        consent_required: true,
        consent_status: 'pending',
        access_granted: false,
        consent_expires_at: consentExpiresAt,
        consent_duration_months,
        is_active: true,
        assignment_start_date: assignment_start_date ? new Date(assignment_start_date) : new Date(),
        assignment_end_date: assignment_end_date ? new Date(assignment_end_date) : null,
        created_at: new Date(),
        updated_at: new Date()
      },
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
      statusCode: 201,
      payload: {
        data: { assignment },
        message: 'Secondary doctor assignment created successfully'
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