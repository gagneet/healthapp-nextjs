// app/api/admin/doctors/route.ts - Admin doctor management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    // Only admins can manage doctors
    if (!['ADMIN', 'PROVIDER_ADMIN'].includes(user!.role)) {
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
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      };
    }

    const [doctors, totalCount] = await Promise.all([
      prisma.doctors.findMany({
        where: whereClause,
        include: {
          users_doctors_user_idTousers: {
            select: {
              id: true,
              email: true,
              phone: true,
              account_status: true,
              email_verified: true,
              last_login_at: true
            }
          },
          specialities: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          organizations: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          _count: {
            select: {
              doctor_assignments: true,
              appointments: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.doctors.count({ where: whereClause })
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
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    // Only admins can create doctors
    if (!['ADMIN', 'PROVIDER_ADMIN'].includes(user!.role)) {
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
      first_name,
      last_name,
      mobile_number,
      date_of_birth,
      gender,
      speciality_id,
      medical_license_number: license_number,
      years_of_experience: years_experience,
      qualification_details: qualifications,
      organization_id: provider_id,
      consultation_fee,
      // Note: available_days and available_hours are now part of availability_schedule JSON field
      // They could be stored in availability_schedule if needed
    } = body;

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and doctor in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password_hash: hashedPassword,
          first_name,
          last_name,
          phone: mobile_number,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
          gender,
          role: 'DOCTOR',
          account_status: 'ACTIVE',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Create doctor profile
      const doctor = await tx.doctors.create({
        data: {
          id: randomUUID(),
          doctor_id: `DOC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          user_id: newUser.id,
          speciality_id,
          medical_license_number: license_number,
          years_of_experience: years_experience ? parseInt(years_experience) : null,
          qualification_details: qualifications,
          organization_id: provider_id,
          consultation_fee: consultation_fee ? parseFloat(consultation_fee) : null,
          // availability_schedule can be set here if needed
          mobile_number,
          gender,
          created_at: new Date(),
          updated_at: new Date()
        },
        include: {
          users_doctors_user_idTousers: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              phone: true
            }
          },
          specialities: {
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