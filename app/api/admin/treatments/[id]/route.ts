// app/api/admin/treatments/[id]/route.ts - Individual treatment management API
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

    const treatment = await prisma.treatmentDatabase.findUnique({
      where: { id: params.id }
    });

    if (!treatment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Treatment not found' } }
      }, { status: 404 });
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { treatment },
        message: 'Treatment retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching treatment:', error);
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
      isActive
    } = body;

    // Check if treatment exists
    const existingTreatment = await prisma.treatmentDatabase.findUnique({
      where: { id: params.id }
    });

    if (!existingTreatment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Treatment not found' } }
      }, { status: 404 });
    }

    // If treatment name is being changed, check for conflicts
    if (treatmentName && treatmentName !== existingTreatment.treatmentName) {
      const nameConflict = await prisma.treatmentDatabase.findFirst({
        where: { 
          treatmentName: { equals: treatmentName, mode: 'insensitive' },
          id: { not: params.id }
        }
      });

      if (nameConflict) {
        return NextResponse.json({
          status: false,
          statusCode: 409,
          payload: { error: { status: 'conflict', message: 'Treatment with this name already exists' } }
        }, { status: 409 });
      }
    }

    const updatedTreatment = await prisma.treatmentDatabase.update({
      where: { id: params.id },
      data: {
        ...(treatmentName && { treatmentName }),
        ...(treatmentType && { treatmentType }),
        ...(description !== undefined && { description }),
        ...(applicableConditions !== undefined && { applicableConditions }),
        ...(duration !== undefined && { duration }),
        ...(frequency !== undefined && { frequency }),
        ...(dosageInfo !== undefined && { dosageInfo }),
        ...(category !== undefined && { category }),
        ...(severityLevel !== undefined && { severityLevel }),
        ...(sideEffects !== undefined && { sideEffects }),
        ...(contraindications !== undefined && { contraindications }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { treatment: updatedTreatment },
        message: 'Treatment updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating treatment:', error);
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

    // Check if treatment exists
    const existingTreatment = await prisma.treatmentDatabase.findUnique({
      where: { id: params.id }
    });

    if (!existingTreatment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Treatment not found' } }
      }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.treatmentDatabase.update({
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
        message: 'Treatment deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting treatment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
