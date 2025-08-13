// app/api/assignments/secondary-doctors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    // Only allow specific roles to view secondary doctor assignments
    if (!['ADMIN', 'DOCTOR', 'PATIENT'].includes(user!.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    let whereClause: any = {};

    // Role-based filtering
    if (user!.role === 'PATIENT') {
      // Patients can only see their own secondary doctor assignments
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
    }

    const assignments = await prisma.secondary_doctor_assignments.findMany({
      where: whereClause,
      include: {
        patient: {
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
        primary_doctor: {
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
        secondary_doctor: {
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
    }
    const user = session.user;

    // Only doctors and admins can create secondary assignments
    if (!['ADMIN', 'DOCTOR'].includes(user!.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      patient_id,
      primary_doctor_id,
      secondary_doctor_id,
      assignment_type,
      notes,
      start_date,
      end_date
    } = body;

    // Validation
    if (!patient_id || !primary_doctor_id || !secondary_doctor_id) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'error', message: 'Patient, primary doctor, and secondary doctor are required' } }
      }, { status: 400 });
    }

    // Check if user has permission to create this assignment
    if (user!.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: user!.id }
      });
      if (!doctor || doctor.id !== primary_doctor_id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only assign secondary doctors to your own patients' } }
        }, { status: 403 });
      }
    }

    const assignment = await prisma.secondary_doctor_assignments.create({
      data: {
        patient_id,
        primary_doctor_id,
        secondary_doctor_id,
        assignment_type: assignment_type || 'CONSULTATION',
        status: 'ACTIVE',
        notes: notes || '',
        start_date: start_date ? new Date(start_date) : new Date(),
        end_date: end_date ? new Date(end_date) : null
      },
      include: {
        patient: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        primary_doctor: {
          select: {
            users_doctors_user_idTousers: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        secondary_doctor: {
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