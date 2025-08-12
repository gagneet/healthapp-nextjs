// app/api/subscriptions/route.ts - Subscription management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause: any = {};

    // Role-based access control
    if (user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { user_id: user!.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patient_id = patient.id;
    }

    // Additional filters
    if (patientId && ['DOCTOR', 'HSP', 'ADMIN', 'PROVIDER_ADMIN'].includes(user!.role)) {
      whereClause.patient_id = patientId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const [subscriptions, totalCount] = await Promise.all([
      prisma.patientSubscription.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              patient_id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          },
          service_plans: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              billing_cycle: true,
              features: true,
              healthcare_providers: {
                select: {
                  user: {
                    select: {
                      first_name: true,
                      last_name: true
                    }
                  }
                }
              }
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.patientSubscription.count({ where: whereClause })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          subscriptions,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        },
        message: 'Subscriptions retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    // Only doctors can create patient subscriptions
    if (user!.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can create subscriptions' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      patient_id,
      service_plan_id,
      start_date,
      billing_cycle,
      payment_method_id,
      auto_renewal
    } = body;

    // Get service plan details
    const servicePlan = await prisma.servicePlan.findUnique({
      where: { id: service_plan_id },
      select: {
        price: true,
        billing_cycle: true,
        name: true
      }
    });

    if (!servicePlan) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Service plan not found' } }
      }, { status: 404 });
    }

    // Calculate end date based on billing cycle
    const startDate = new Date(start_date);
    const endDate = new Date(startDate);
    
    // Add duration based on billing cycle
    if (servicePlan.billing_cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (servicePlan.billing_cycle === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (servicePlan.billing_cycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (servicePlan.billing_cycle === 'one_time') {
      // For one-time payments, set end date to far future or keep same as start
      endDate.setFullYear(endDate.getFullYear() + 10);
    }

    const subscription = await prisma.patientSubscription.create({
      data: {
        patient_id,
        provider_id: 'placeholder-provider-id', // This needs to be determined from business logic
        service_plan_id,
        current_period_start: startDate,
        current_period_end: endDate,
        status: 'ACTIVE',
        payment_method_id,
        last_payment_amount: servicePlan.price,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        service_plans: {
          select: {
            name: true,
            description: true,
            price: true,
            billing_cycle: true
          }
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { subscription },
        message: 'Subscription created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, auto_renewal, payment_method_id, notes } = body;

    // Get existing subscription to verify permissions
    const existingSubscription = await prisma.patientSubscription.findUnique({
      where: { id },
      include: {
        patient: { select: { user_id: true } }
      }
    });

    if (!existingSubscription) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Subscription not found' } }
      }, { status: 404 });
    }

    // Check permissions
    const canModify = 
      user!.role === 'ADMIN' ||
      user!.role === 'DOCTOR' ||
      (user!.role === 'PATIENT' && existingSubscription.patient?.user_id === user!.id);

    if (!canModify) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Cannot modify this subscription' } }
      }, { status: 403 });
    }

    const updatedSubscription = await prisma.patientSubscription.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(payment_method_id && { payment_method_id }),
        ...(notes && { metadata: { notes } }),
        updated_at: new Date()
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        service_plans: {
          select: {
            name: true,
            price: true,
            billing_cycle: true
          }
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { subscription: updatedSubscription },
        message: 'Subscription updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

// Note: GET_PLANS functionality moved to /api/subscriptions/plans route
// GET available service plans
async function getAvailablePlans(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    const plans = await prisma.servicePlan.findMany({
      where: {
        is_active: true
      },
      include: {
        healthcare_providers: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      orderBy: { price: 'asc' }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { service_plans: plans },
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