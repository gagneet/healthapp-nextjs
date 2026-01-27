// app/api/admin/conditions/route.ts - Admin medical conditions management API
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

    // Only admins can manage conditions
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
    const category = searchParams.get('category');
    const offset = (page - 1) * limit;

    let whereClause: any = { isActive: true };
    
    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { diagnosisName: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    if (category) {
      whereClause.category = { equals: category, mode: 'insensitive' };
    }

    const [conditions, totalCount] = await Promise.all([
      prisma.symptomDatabase.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { diagnosisName: 'asc' }
      }),
      prisma.symptomDatabase.count({ where: whereClause })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          conditions,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Medical conditions retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching conditions:', error);
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
      diagnosisName,
      symptoms = {},
      category,
      severityIndicators = {},
      commonAgeGroups = [],
      genderSpecific,
      isActive = true
    } = body;

    // Validate required fields
    if (!diagnosisName) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Diagnosis name is required' } }
      }, { status: 400 });
    }

    // Check if condition already exists
    const existingCondition = await prisma.symptomDatabase.findFirst({
      where: { 
        diagnosisName: { equals: diagnosisName, mode: 'insensitive' }
      }
    });

    if (existingCondition) {
      return NextResponse.json({
        status: false,
        statusCode: 409,
        payload: { error: { status: 'conflict', message: 'Medical condition with this diagnosis name already exists' } }
      }, { status: 409 });
    }

    const condition = await prisma.symptomDatabase.create({
      data: {
        id: randomUUID(),
        diagnosisName,
        symptoms,
        category,
        severityIndicators,
        commonAgeGroups,
        genderSpecific,
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
        data: { condition },
        message: 'Medical condition created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating condition:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
