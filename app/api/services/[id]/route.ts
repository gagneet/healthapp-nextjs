import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/services/{id}
 * Get a specific service
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors can access services (business rule: services are linked to doctors)
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can access services' } }
      }, { status: 403 });
    }

    const { id: serviceId } = params;

    // Get doctor profile
    const doctor = await prisma.doctors.findFirst({
      where: { user_id: session.user.id }
    });

    if (!doctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
      }, { status: 404 });
    }

    // Get service from database (services are linked to doctors)
    const service = await prisma.services.findFirst({
      where: { 
        id: serviceId,
        doctor_id: doctor.id // Only show services owned by this doctor
      },
      include: {
        doctors: {
          include: {
            users_doctors_user_idTousers: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Service not found or access denied' } }
      }, { status: 404 });
    }

    // Calculate usage statistics (mock for now, would be real data from appointments/bookings)
    const usageCount = 45; // TODO: Calculate from actual appointments
    const revenueGenerated = usageCount * parseFloat(service.amount.toString());
    const activeSubscriptions = 0; // TODO: Calculate from subscriptions

    // Transform to expected format
    const formattedService = {
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category || 'consultation',
      duration: service.duration_minutes || 30,
      amount: parseFloat(service.amount.toString()),
      currency: service.currency || 'USD',
      requiresSubscription: service.requires_subscription || false,
      isActive: service.is_active,
      tags: Array.isArray(service.tags) ? service.tags : [],
      created_at: service.created_at,
      updated_at: service.updated_at,
      usage_count: usageCount,
      revenue_generated: revenueGenerated,
      active_subscriptions: activeSubscriptions,
      doctor: service.doctors ? {
        name: `${service.doctors.users_doctors_user_idTousers?.first_name || ''} ${service.doctors.users_doctors_user_idTousers?.last_name || ''}`.trim(),
        email: service.doctors.users_doctors_user_idTousers?.email
      } : null
    };

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: formattedService,
        message: 'Service retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

/**
 * PUT /api/services/{id}
 * Update a service
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors can update services
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can update services' } }
      }, { status: 403 });
    }

    const { id: serviceId } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.amount || !body.duration_minutes) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Name, amount, and duration are required' } }
      }, { status: 400 });
    }

    // Get doctor profile
    const doctor = await prisma.doctors.findFirst({
      where: { user_id: session.user.id }
    });

    if (!doctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
      }, { status: 404 });
    }

    // Check if service exists and belongs to this doctor
    const existingService = await prisma.services.findFirst({
      where: { 
        id: serviceId,
        doctor_id: doctor.id
      }
    });

    if (!existingService) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Service not found or access denied' } }
      }, { status: 404 });
    }

    // Update service
    const updatedService = await prisma.services.update({
      where: { id: serviceId },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        duration_minutes: body.duration_minutes,
        amount: body.amount,
        currency: body.currency || 'USD',
        requires_subscription: body.requiresSubscription || false,
        tags: body.tags || [],
        is_active: body.isActive !== undefined ? body.isActive : true,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: updatedService,
        message: 'Service updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

/**
 * DELETE /api/services/{id}
 * Delete a service
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only doctors can delete services
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can delete services' } }
      }, { status: 403 });
    }

    const { id: serviceId } = params;

    // Get doctor profile
    const doctor = await prisma.doctors.findFirst({
      where: { user_id: session.user.id }
    });

    if (!doctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
      }, { status: 404 });
    }

    // Check if service exists and belongs to this doctor
    const existingService = await prisma.services.findFirst({
      where: { 
        id: serviceId,
        doctor_id: doctor.id
      }
    });

    if (!existingService) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Service not found or access denied' } }
      }, { status: 404 });
    }

    // Soft delete the service
    await prisma.services.update({
      where: { id: serviceId },
      data: {
        is_active: false,
        deleted_at: new Date()
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        message: 'Service deleted successfully'
      }
    });

  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}