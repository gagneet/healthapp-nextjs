// app/api/admin/conditions/[id]/route.ts - Individual medical condition management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const condition = await prisma.symptomDatabase.findUnique({
      where: { id: params.id }
    });

    if (!condition) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Medical condition not found' } }
      }, { status: 404 });
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { condition },
        message: 'Medical condition retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching condition:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      symptoms,
      category,
      severityIndicators,
      commonAgeGroups,
      genderSpecific,
      isActive
    } = body;

    // Check if condition exists
    const existingCondition = await prisma.symptomDatabase.findUnique({
      where: { id: params.id }
    });

    if (!existingCondition) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Medical condition not found' } }
      }, { status: 404 });
    }

    // If diagnosis name is being changed, check for conflicts
    if (diagnosisName && diagnosisName !== existingCondition.diagnosisName) {
      const nameConflict = await prisma.symptomDatabase.findFirst({
        where: { 
          diagnosisName: { equals: diagnosisName, mode: 'insensitive' },
          id: { not: params.id }
        }
      });

      if (nameConflict) {
        return NextResponse.json({
          status: false,
          statusCode: 409,
          payload: { error: { status: 'conflict', message: 'Medical condition with this diagnosis name already exists' } }
        }, { status: 409 });
      }
    }

    const updatedCondition = await prisma.symptomDatabase.update({
      where: { id: params.id },
      data: {
        ...(diagnosisName && { diagnosisName }),
        ...(symptoms !== undefined && { symptoms }),
        ...(category !== undefined && { category }),
        ...(severityIndicators !== undefined && { severityIndicators }),
        ...(commonAgeGroups !== undefined && { commonAgeGroups }),
        ...(genderSpecific !== undefined && { genderSpecific }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { condition: updatedCondition },
        message: 'Medical condition updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating condition:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if condition exists
    const existingCondition = await prisma.symptomDatabase.findUnique({
      where: { id: params.id }
    });

    if (!existingCondition) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Medical condition not found' } }
      }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.symptomDatabase.update({
      where: { id: params.id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        message: 'Medical condition deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting condition:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
