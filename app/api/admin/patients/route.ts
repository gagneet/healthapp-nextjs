// app/api/admin/patients/route.ts - Admin patient management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

    // Only admins and healthcare providers can manage patients
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin or healthcare provider access required' } }
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const doctorId = searchParams.get('doctorId');
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    
    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    if (status) {
      whereClause.user = {
        ...whereClause.user,
        accountStatus: status
      };
    }

    // Role-based filtering
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: session.user.id }
      });
      if (doctor) {
        whereClause.primaryCareDoctorId = doctor.id;
      }
    } else if (doctorId && ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      whereClause.primaryCareDoctorId = doctorId;
    }

    const [patients, totalCount] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              firstName: true,
              lastName: true,
              phone: true,
              dateOfBirth: true,
              gender: true,
              accountStatus: true,
              emailVerified: true,
              createdAt: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          primaryCareDoctor: {
            select: {
              id: true,
              doctorId: true,
              user: {
                select: {
                  name: true,
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
          _count: {
            select: {
              carePlans: true,
              appointments: true,
              medicationLogs: true,
              vitalReadings: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where: whereClause })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          patients,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Patients retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
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

    // Only admins and doctors can create patients
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin or doctor access required' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      date_of_birth,
      gender,
      primaryCareDoctorId,
      organization_id,
      medicalRecordNumber,
      height_cm,
      weight_kg,
      blood_type,
      allergies,
      medical_history,
      emergency_contacts
    } = body;

    // Validation
    if (!email || !firstName || !lastName) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Email, first name, and last name are required' } }
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({
        status: false,
        statusCode: 409,
        payload: { error: { status: 'conflict', message: 'Email already exists' } }
      }, { status: 409 });
    }

    // Hash password (if provided, otherwise generate temporary)
    const tempPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user and patient in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const fullName = `${firstName} ${lastName}`.trim();
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name: fullName,
          emailVerified: new Date(),
          image: null,
          firstName: firstName,
          lastName: lastName,
          fullName: fullName,
          phone,
          dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
          gender,
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Generate patient ID
      const patientId = `PAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Create patient profile
      const patient = await tx.patient.create({
        data: {
          id: randomUUID(),
          patientId: patientId,
          userId: newUser.id,
          primaryCareDoctorId: primaryCareDoctorId,
          organizationId: organization_id,
          medicalRecordNumber: medicalRecordNumber || `MRN-${patientId}`,
          heightCm: height_cm ? parseFloat(height_cm) : null,
          weightKg: weight_kg ? parseFloat(weight_kg) : null,
          bloodType: blood_type,
          allergies: allergies || [],
          medicalHistory: medical_history || [],
          emergencyContacts: emergency_contacts || [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              phone: true,
              dateOfBirth: true,
              gender: true
            }
          },
          primaryCareDoctor: {
            select: {
              id: true,
              doctorId: true,
              user: {
                select: {
                  name: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      return { patient, temporaryPassword: !password ? tempPassword : null };
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: result,
        message: 'Patient created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
