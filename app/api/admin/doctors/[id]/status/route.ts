// app/api/admin/doctors/[id]/status/route.ts - Doctor status management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/prisma/generated/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const { status, is_verified, reason } = body;

    // Validate status
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Invalid status value' } }
      }, { status: 400 });
    }

    // Check if doctor exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!existingDoctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor not found' } }
      }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user status if provided
      if (status) {
        await tx.user.update({
          where: { id: existingDoctor.userId },
          data: { 
            accountStatus: status,
            updatedAt: new Date()
          }
        });
      }

      // Update doctor verification if provided
      const doctorUpdates: any = {};
      if (is_verified !== undefined) {
        doctorUpdates.isVerified = is_verified;
      }
      doctorUpdates.updatedAt = new Date();

      const updatedDoctor = await tx.doctor.update({
        where: { id: params.id },
        data: doctorUpdates,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              accountStatus: true
            }
          }
        }
      });

      // Log status change for audit purposes
      if (status || is_verified !== undefined) {
        await tx.auditLog.create({
          data: {
            id: crypto.randomUUID(),
            userId: session.user.id,
            entityType: 'doctor',
            entityId: params.id,
            action: 'UPDATE',
            resource: `doctor_status_${params.id}`,
            accessGranted: true,
            timestamp: new Date(),
            dataChanges: {
              previousStatus: existingDoctor.user.accountStatus,
              newStatus: status || existingDoctor.user.accountStatus,
              previousVerified: existingDoctor.isVerified,
              newVerified: is_verified !== undefined ? is_verified : existingDoctor.isVerified,
              reason: reason || null,
              updatedBy: session.user.email
            },
            createdAt: new Date()
          }
        }).catch(() => {
          // Audit log is not critical, continue if it fails
          console.log('Failed to create audit log for doctor status update');
        });
      }

      return updatedDoctor;
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { doctor: result },
        message: 'Doctor status updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}