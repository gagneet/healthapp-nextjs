// app/api/admin/medicines/route.ts - Admin medicine management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';


export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

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

    // Only admins can manage medicines
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
    const type = searchParams.get('type');
    const offset = (page - 1) * limit;

    let whereClause: any = {};
    
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    if (type) {
      whereClause.type = { equals: type, mode: 'insensitive' };
    }

    const [medicines, totalCount] = await Promise.all([
      prisma.medicine.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.medicine.count({ where: whereClause })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          medicines,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Medicines retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
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
      name,
      type = 'tablet',
      description,
      details = {},
      strengthMg,
      category,
      manufacturer,
      rxnormCode,
      publicMedicine = true,
      isActive = true
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Medicine name is required' } }
      }, { status: 400 });
    }

    // Check if medicine already exists
    const existingMedicine = await prisma.medicine.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' }
      }
    });

    if (existingMedicine) {
      return NextResponse.json({
        status: false,
        statusCode: 409,
        payload: { error: { status: 'conflict', message: 'Medicine with this name already exists' } }
      }, { status: 409 });
    }

    const medicine = await prisma.medicine.create({
      data: {
        id: randomUUID(),
        name,
        type,
        description,
        details: {
          ...details,
          strengthMg,
          category,
          manufacturer,
          rxnormCode
        },
        publicMedicine,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { medicine },
        message: 'Medicine created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
