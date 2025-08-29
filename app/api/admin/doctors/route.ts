// app/api/admin/doctors/route.ts - Admin doctor management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
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

    // Only admins can manage doctors
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin access required' } }
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let whereClause: any = {};
    
    if (search) {
      whereClause = {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      };
    }

    const [doctors, totalCount] = await Promise.all([
      prisma.doctor.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              emailVerified: true,
              firstName: true,
              lastName: true,
              fullName: true,
              profilePictureUrl: true,
              phone: true,
              accountStatus: true
            }
          },
          specialty: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              doctorAssignments: true,
              appointments: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.doctor.count({ where: whereClause })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          doctors,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Doctors retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
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

    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin access required' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      mobileNumber,
      date_of_birth,
      gender,
      speciality_id,
      medical_license_number,
      years_of_experience,
      qualification_details,
      organization_id,
      consultation_fee,
    } = body;

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

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
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
          phone: mobileNumber,
          dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
          gender,
          role: 'DOCTOR',
          accountStatus: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const doctor = await tx.doctor.create({
        data: {
          id: randomUUID(),
          doctorId: `DOC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          userId: newUser.id,
          specialtyId: speciality_id,
          medicalLicenseNumber: medical_license_number,
          yearsOfExperience: years_of_experience ? parseInt(years_of_experience) : null,
          qualificationDetails: qualification_details,
          organizationId: organization_id,
          consultationFee: consultation_fee ? parseFloat(consultation_fee) : null,
          mobileNumber: mobileNumber,
          gender,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          specialty: {
            select: {
              name: true,
              description: true
            }
          }
        }
      });

      return doctor;
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { doctor: result },
        message: 'Doctor created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
