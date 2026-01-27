import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/auth-helpers";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from "@/lib/prisma";

/**
 * GET /api/appointments/patient/[patientId]
 * Get appointments for a specific patient
 */

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    if (!['DOCTOR', 'HSP', 'PATIENT', 'admin'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const user = session.user as any;
    const patientId = params.patientId;

    // Additional authorization: patients can only access their own appointments
    if (user.role === 'PATIENT' && user.businessId !== patientId) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You can only access your own appointment data'
      }), { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const whereClause: any = {
      patientId: patientId
    };

    if (status) {
      whereClause.status = status;
    }

    if (upcoming) {
      whereClause.startTime = {
        gte: new Date()
      };
    }

    if (startDate || endDate) {
      if (!whereClause.startTime) {
        whereClause.startTime = {};
      }
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate);
      }
    }

    // Get appointments for the specific patient
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            organization: {
              select: {
                name: true,
                type: true
              }
            }
          }
        },
        carePlan: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: limit,
      skip: (page - 1) * limit
    });

    // Transform the data to match frontend expectations
    const transformedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: 'General Consultation',
      type: 'consultation',
      startTime: appointment.startTime?.toISOString(),
      endTime: appointment.endTime?.toISOString(),
      status: appointment.status,
      doctor: appointment.doctor ? {
        id: appointment.doctor.id,
        name: `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        firstName: appointment.doctor.user.firstName,
        lastName: appointment.doctor.user.lastName,
        email: appointment.doctor.user.email,
        organization: appointment.doctor.organization
      } : null,
      carePlan: appointment.carePlan,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString()
    }));

    // Get total count for pagination
    const totalCount = await prisma.appointment.count({
      where: whereClause
    });

    const responseData = {
      appointments: transformedAppointments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    return NextResponse.json(formatApiSuccess(
      responseData,
      'Patient appointments retrieved successfully'
    ));

  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });  
  }
}
