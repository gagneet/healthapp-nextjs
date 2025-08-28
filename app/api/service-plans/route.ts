// app/api/service-plans/route.ts - Service plans management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

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

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider_id');
    const serviceType = searchParams.get('service_type');
    const billingCycle = searchParams.get('billing_cycle');
    const isActive = searchParams.get('isActive');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause: any = {};

    // Role-based filtering
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: session.user.id }
      });
      if (doctor?.organization_id) {
        whereClause.provider_id = doctor.organization_id;
      }
    } else if (session.user.role === 'HSP') {
      const hsp = await prisma.hsp.findFirst({
        where: { userId: session.user.id }
      });
      if (hsp?.organization_id) {
        whereClause.provider_id = hsp.organization_id;
      }
    }

    // Additional filters
    if (providerId && ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      whereClause.provider_id = providerId;
    }

    if (serviceType) {
      whereClause.service_type = { contains: serviceType, mode: 'insensitive' };
    }

    if (billingCycle) {
      whereClause.billing_cycle = billingCycle;
    }

    if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    } else {
      // Default to showing only active plans for non-admins
      if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
        whereClause.isActive = true;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    const [servicePlans, totalCount] = await Promise.all([
      prisma.servicePlan.findMany({
        where: whereClause,
        include: {
          healthcare_providers: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              organization_type: true,
              address: true,
              phone: true
            }
          },
          _count: {
            select: {
              patient_subscriptions: {
                where: {
                  status: 'ACTIVE'
                }
              }
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: [
          { isActive: 'desc' },
          { price: 'asc' }
        ]
      }),
      prisma.servicePlan.count({ where: whereClause })
    ]);

    // Calculate summary statistics
    const priceStats = await prisma.servicePlan.aggregate({
      where: whereClause,
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true }
    });

    const billingCycleStats = await prisma.servicePlan.groupBy({
      by: ['billing_cycle'],
      where: whereClause,
      _count: { id: true }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          servicePlans,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          },
          summary: {
            pricing: {
              average: priceStats._avg.price || 0,
              minimum: priceStats._min.price || 0,
              maximum: priceStats._max.price || 0
            },
            billingCycles: billingCycleStats.reduce((acc, item) => {
              acc[item.billing_cycle] = item._count.id;
              return acc;
            }, {} as Record<string, number>)
          }
        },
        message: 'Service plans retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching service plans:', error);
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

    // Only admins and healthcare providers can create service plans
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'HSP'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      provider_id,
      name,
      description,
      service_type,
      price,
      currency = 'USD',
      billing_cycle,
      features = [],
      patient_limit,
      trial_period_days = 0,
      setup_fee = 0,
      stripe_price_id
    } = body;

    // Validation
    if (!provider_id || !name || !price || !billing_cycle) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Provider ID, name, price, and billing cycle are required' } }
      }, { status: 400 });
    }

    // Permission check for non-admins
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      if (session.user.role === 'DOCTOR') {
        const doctor = await prisma.doctor.findFirst({
          where: { userId: session.user.id }
        });
        if (!doctor || doctor.organization_id !== provider_id) {
          return NextResponse.json({
            status: false,
            statusCode: 403,
            payload: { error: { status: 'forbidden', message: 'Can only create plans for your organization' } }
          }, { status: 403 });
        }
      } else if (session.user.role === 'HSP') {
        const hsp = await prisma.hsp.findFirst({
          where: { userId: session.user.id }
        });
        if (!hsp || hsp.organization_id !== provider_id) {
          return NextResponse.json({
            status: false,
            statusCode: 403,
            payload: { error: { status: 'forbidden', message: 'Can only create plans for your organization' } }
          }, { status: 403 });
        }
      }
    }

    // Validate billing cycle
    const validBillingCycles = ['weekly', 'monthly', 'yearly', 'one_time'];
    if (!validBillingCycles.includes(billing_cycle)) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Invalid billing cycle' } }
      }, { status: 400 });
    }

    const servicePlan = await prisma.servicePlan.create({
      data: {
        id: randomUUID(),
        provider_id,
        name,
        description,
        service_type,
        price: parseFloat(price),
        currency,
        billing_cycle,
        features: Array.isArray(features) ? features : [],
        patient_limit: patient_limit ? parseInt(patient_limit) : null,
        trial_period_days: parseInt(trial_period_days),
        setup_fee: parseFloat(setup_fee),
        stripe_price_id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        healthcare_providers: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true
              }
            },
            organization_type: true
          }
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { servicePlan },
        message: 'Service plan created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating service plan:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
