// app/api/admin/treatments/route.ts - Admin treatment management API
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

    // Only admins can manage treatments
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
    const treatmentType = searchParams.get('type');
    const category = searchParams.get('category');
    const offset = (page - 1) * limit;

    let whereClause: any = { isActive: true };
    
    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { treatmentName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    if (treatmentType) {
      whereClause.treatmentType = { equals: treatmentType, mode: 'insensitive' };
    }

    if (category) {
      whereClause.category = { equals: category, mode: 'insensitive' };
    }

    const [treatments, totalCount] = await Promise.all([
      prisma.treatmentDatabase.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { treatmentName: 'asc' }
      }),
      prisma.treatmentDatabase.count({ where: whereClause })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          treatments,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Treatments retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching treatments:', error);
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
      treatmentName,
      treatmentType,
      description,
      applicableConditions = [],
      duration,
      frequency,
      dosageInfo = {},
      category,
      severityLevel,
      sideEffects,
      contraindications,
      isActive = true
    } = body;

    // Validate required fields
    if (!treatmentName || !treatmentType) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Treatment name and type are required' } }
      }, { status: 400 });
    }

    // Check if treatment already exists
    const existingTreatment = await prisma.treatmentDatabase.findFirst({
      where: { 
        treatmentName: { equals: treatmentName, mode: 'insensitive' }
      }
    });

    if (existingTreatment) {
      return NextResponse.json({
        status: false,
        statusCode: 409,
        payload: { error: { status: 'conflict', message: 'Treatment with this name already exists' } }
      }, { status: 409 });
    }

    const treatment = await prisma.treatmentDatabase.create({
      data: {
        id: randomUUID(),
        treatmentName,
        treatmentType,
        description,
        applicableConditions,
        duration,
        frequency,
        dosageInfo,
        category,
        severityLevel,
        sideEffects,
        contraindications,
        isActive,
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { treatment },
        message: 'Treatment created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating treatment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
