// app/api/admin/medicines/[id]/route.ts - Individual medicine management API
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

    const medicine = await prisma.medicine.findUnique({
      where: { id: params.id }
    });

    if (!medicine) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Medicine not found' } }
      }, { status: 404 });
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { medicine },
        message: 'Medicine retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching medicine:', error);
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
      name,
      type,
      description,
      details = {},
      strengthMg,
      category,
      manufacturer,
      rxnormCode,
      publicMedicine,
      isActive
    } = body;

    // Check if medicine exists
    const existingMedicine = await prisma.medicine.findUnique({
      where: { id: params.id }
    });

    if (!existingMedicine) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Medicine not found' } }
      }, { status: 404 });
    }

    // If name is being changed, check for conflicts
    if (name && name !== existingMedicine.name) {
      const nameConflict = await prisma.medicine.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: params.id }
        }
      });

      if (nameConflict) {
        return NextResponse.json({
          status: false,
          statusCode: 409,
          payload: { error: { status: 'conflict', message: 'Medicine with this name already exists' } }
        }, { status: 409 });
      }
    }

    const updatedMedicine = await prisma.medicine.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        details: {
          ...(existingMedicine.details as object || {}),
          ...details,
          ...(strengthMg !== undefined && { strengthMg }),
          ...(category !== undefined && { category }),
          ...(manufacturer !== undefined && { manufacturer }),
          ...(rxnormCode !== undefined && { rxnormCode })
        },
        ...(publicMedicine !== undefined && { publicMedicine }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { medicine: updatedMedicine },
        message: 'Medicine updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
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

    // Check if medicine exists
    const existingMedicine = await prisma.medicine.findUnique({
      where: { id: params.id }
    });

    if (!existingMedicine) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Medicine not found' } }
      }, { status: 404 });
    }

    // Check if medicine is being used in medications
    const medicineUsage = await prisma.medication.findFirst({
      where: { medicineId: params.id }
    });

    if (medicineUsage) {
      return NextResponse.json({
        status: false,
        statusCode: 409,
        payload: { 
          error: { 
            status: 'conflict', 
            message: 'Cannot delete medicine that is currently prescribed to patients' 
          } 
        }
      }, { status: 409 });
    }

    // Soft delete by setting isActive to false
    await prisma.medicine.update({
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
        message: 'Medicine deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
