// app/api/admin/users/route.ts - Admin user management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

    // Only system admins can manage all users
    if (session.user.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'System admin access required' } }
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    let whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (status) {
      whereClause.account_status = status;
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          // Auth.js v5 fields
          name: true,
          image: true,
          emailVerified: true,
          // Legacy fields
          firstName: true,
          lastName: true,
          fullName: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          role: true,
          accountStatus: true,
          emailVerifiedLegacy: true,
          profilePictureUrl: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          // Relations
          doctors: {
            select: {
              id: true,
              doctorId: true,
              medical_license_number: true,
              specialities: {
                select: { name: true }
              }
            }
          },
          patients: {
            select: {
              id: true,
              patientId: true,
              medical_record_number: true
            }
          },
          hsps: {
            select: {
              id: true,
              hsp_id: true,
              qualification: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Add user stats
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });

    const statusStats = await prisma.user.groupBy({
      by: ['accountStatus'],
      _count: { id: true }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          users,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          },
          stats: {
            byRole: userStats.reduce((acc, stat) => {
              acc[stat.role] = stat._count.id;
              return acc;
            }, {} as Record<string, number>),
            byStatus: statusStats.reduce((acc, stat) => {
              if (stat.accountStatus) acc[stat.accountStatus] = stat._count?.id || 0;
              return acc;
            }, {} as Record<string, number>)
          }
        },
        message: 'Users retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
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

    // Only system admins can create users
    if (session.user.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'System admin access required' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      role,
      account_status = 'ACTIVE'
    } = body;

    // Validation
    if (!email || !password || !first_name || !last_name || !role) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Email, password, first name, last name, and role are required' } }
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['DOCTOR', 'PATIENT', 'HSP', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Invalid role specified' } }
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with Auth.js v5 compatibility
    const fullName = `${first_name} ${last_name}`.trim();
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        // Auth.js v5 fields
        name: fullName,
        emailVerified: new Date(),
        image: null,
        // Legacy fields for backward compatibility
        firstName: first_name,
        lastName: last_name,
        fullName: fullName,
        phone,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        gender,
        role,
        accountStatus: account_status,
        emailVerifiedLegacy: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        accountStatus: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { user: newUser },
        message: 'User created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
