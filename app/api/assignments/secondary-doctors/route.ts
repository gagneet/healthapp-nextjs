// app/api/assignments/secondary-doctors/route.ts - Secondary doctor assignments API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const primaryDoctorId = searchParams.get('primary_doctor_id');
    const status = searchParams.get('status');

    let whereClause: any = {};

    // Role-based access control
    if (user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { user_id: user!.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patient_id = patient.id;
    } else if (user!.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: user!.id }
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

    // Additional filters
    if (patientId && ['ADMIN', 'HSP'].includes(user!.role)) {
      whereClause.patient_id = patientId;
    
    if (primaryDoctorId && ['ADMIN', 'HSP'].includes(user!.role)) {
      whereClause.primary_doctor_id = primaryDoctorId;
    
    if (status) {
      whereClause.status = status;

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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });

    // Only doctors can create secondary assignments
    if (user!.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can create secondary assignments' } }
      }, { status: 403 });

    const body = await request.json();
    const {
      patient_id,
      secondary_doctor_id,
      assignment_type,
      specialization_area,
      referral_reason,
      priority_level,
      expected_duration_days,
      collaboration_notes
    } = body;

    // Get primary doctor ID
    const primaryDoctor = await prisma.doctors.findFirst({
      where: { user_id: user!.id }
    });

    if (!primaryDoctor) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Doctor profile not found' } }
      }, { status: 403 });

    // Check if secondary doctor exists
    const secondaryDoctor = await prisma.doctors.findUnique({
      where: { id: secondary_doctor_id }
    });

    if (!secondaryDoctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Secondary doctor not found' } }
      }, { status: 404 });

    // Check for existing active assignment
    const existingAssignment = await prisma.secondary_doctor_assignments.findFirst({
      where: {
        patient_id,
        primary_doctor_id: primaryDoctor.id,
        secondary_doctor_id,
        is_active: true
      }
    });

    if (existingAssignment) {
      return NextResponse.json({
        status: false,
        statusCode: 409,
        payload: { error: { status: 'conflict', message: 'Active assignment already exists' } }
      }, { status: 409 });

    const assignment = await prisma.secondary_doctor_assignments.create({
      data: {
        id: randomUUID(),
        patient_id,
        primary_doctor_id: primaryDoctor.id,
        secondary_doctor_id,
        assignment_reason: referral_reason,
        specialty_focus: specialization_area ? [specialization_area] : [],
        consent_status: 'pending',
        is_active: true,
        assignment_start_date: new Date(),
        assignment_end_date: expected_duration_days ? new Date(Date.now() + expected_duration_days * 24 * 60 * 60 * 1000) : null,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        patients: {
          select: {
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        doctors_secondary_doctor_assignments_secondary_doctor_idTodoctors: {
          select: {
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user;
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });

    const body = await request.json();
    const { assignment_id, status, collaboration_notes, response_notes } = body;

    const assignment = await prisma.secondary_doctor_assignments.findUnique({
      where: { id: assignment_id },
      include: {
        doctors_secondary_doctor_assignments_primary_doctor_idTodoctors: {
          select: { user_id: true }
        },
        doctors_secondary_doctor_assignments_secondary_doctor_idTodoctors: {
          select: { user_id: true }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Assignment not found' } }
      }, { status: 404 });

    // Check permissions
    const canModify = 
      user!.role === 'ADMIN' ||
      (user!.role === 'DOCTOR' && (
        assignment.doctors_secondary_doctor_assignments_primary_doctor_idTodoctors?.user_id === user!.id ||
        assignment.doctors_secondary_doctor_assignments_secondary_doctor_idTodoctors?.user_id === user!.id
      ));

    if (!canModify) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Cannot modify this assignment' } }
      }, { status: 403 });

    const updatedAssignment = await prisma.secondary_doctor_assignments.update({
      where: { id: assignment_id },
      data: {
        ...(status && { status }),
        ...(collaboration_notes && { collaboration_notes }),
        ...(response_notes && { response_notes }),
        ...(status === 'accepted' && { accepted_at: new Date() }),
        ...(status === 'completed' && { completed_at: new Date() }),
        updated_at: new Date()
      },
      include: {
        patients: {
          select: {
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        doctors_secondary_doctor_assignments_primary_doctor_idTodoctors: {
          select: {
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
            users_doctors_user_idTousers: {
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
    console.error('Error updating secondary doctor assignment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}