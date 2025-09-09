// app/api/assignments/secondary-doctors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

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

    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PATIENT'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const whereClause: any = {};

    if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patientId = patient.id;
    } else if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findFirst({
        where: { userId: session.user.id }
      });
      if (!doctor) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Doctor profile not found' } }
        }, { status: 403 });
      }
      whereClause.OR = [
        { primaryDoctorId: doctor.id },
        { secondaryDoctorId: doctor.id }
      ];
    }

    const assignments = await prisma.secondaryDoctorAssignment.findMany({
      where: whereClause,
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
        }
      },
      orderBy: { createdAt: 'desc' }
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

    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      patientId,
      primary_doctor_id,
      secondary_doctor_id,
      secondary_hsp_id,
      assignment_reason,
      specialtyFocus,
      care_plan_ids,
      consent_duration_months = 6,
      assignment_start_date,
      assignment_end_date
    } = body;

    if (!patientId || !primary_doctor_id) {
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

    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findFirst({
        where: { userId: session.user.id }
      });
      if (!doctor || doctor.id !== primary_doctor_id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only assign secondary doctors to your own patients' } }
        }, { status: 403 });
      }
    }

    const assignmentId = randomUUID();

    const consentExpiresAt = new Date();
    consentExpiresAt.setMonth(consentExpiresAt.getMonth() + consent_duration_months);

    const assignment = await prisma.secondaryDoctorAssignment.create({
      data: {
        id: assignmentId,
        patientId: patientId,
        primaryDoctorId: primary_doctor_id,
        secondaryDoctorId: secondary_doctor_id || null,
        secondaryHspId: secondary_hsp_id || null,
        assignmentReason: assignment_reason || null,
        specialtyFocus: specialtyFocus || [],
        carePlanIds: care_plan_ids || [],
        consentRequired: true,
        consentStatus: 'PENDING',
        accessGranted: false,
        consentExpiresAt: consentExpiresAt,
        consentDurationMonths: consent_duration_months,
        isActive: true,
        assignmentStartDate: assignment_start_date ? new Date(assignment_start_date) : new Date(),
        assignmentEndDate: assignment_end_date ? new Date(assignment_end_date) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
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
