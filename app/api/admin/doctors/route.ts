// app/api/admin/doctors/route.ts - Admin doctor management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';

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
          user: {
            select: {
              id: true,
              email: true,
              mobile_number: true,
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
          providers: {
            select: {
              id: true,
              name: true,
              provider_type: true
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
      license_number,
      years_experience,
      qualifications,
      provider_id,
      consultation_fee,
      available_days,
      available_hours
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
          mobile_number,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
          gender,
          role: 'DOCTOR',
          account_status: 'active',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Create doctor profile
      const doctor = await tx.doctors.create({
        data: {
          user_id: newUser.id,
          speciality_id,
          license_number,
          years_experience: years_experience ? parseInt(years_experience) : null,
          qualifications,
          provider_id,
          consultation_fee: consultation_fee ? parseFloat(consultation_fee) : null,
          available_days,
          available_hours,
          created_at: new Date(),
          updated_at: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              mobile_number: true
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