// app/api/payments/route.ts - Payment management API
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
    const patientId = searchParams.get('patientId');
    const subscriptionId = searchParams.get('subscription_id');
    const status = searchParams.get('status');
    const providerId = searchParams.get('provider_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const offset = (page - 1) * limit;

    let whereClause: any = {};

    // Role-based access control
    if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patientId = patient.id;
    } else if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: session.user.id }
      });
      if (doctor && !patientId) {
        // Show payments for doctor's patients
        const doctorPatients = await prisma.patient.findMany({
          where: { primaryCareDoctorId: doctor.id },
          select: { id: true }
        });
        whereClause.patientId = { in: doctorPatients.map(p => p.id) };
      }
    }

    // Additional filters
    if (patientId && ['DOCTOR', 'HSP', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      whereClause.patientId = patientId;
    }

    if (subscriptionId) {
      whereClause.subscription_id = subscriptionId;
    }

    if (providerId && ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      whereClause.provider_id = providerId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    const [payments, totalCount] = await Promise.all([
      prisma.payments.findMany({
        where: whereClause,
        include: {
          patients: {
            select: {
              id: true,
              patientId: true,
              user: {
                select: {
                  name: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          patient_subscriptions: {
            select: {
              id: true,
              status: true,
              service_plans: {
                select: {
                  name: true,
                  description: true,
                  billing_cycle: true
                }
              }
            }
          },
          healthcare_providers: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payments.count({ where: whereClause })
    ]);

    // Calculate summary statistics
    const paymentStats = await prisma.payments.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
        refund_amount: true
      },
      _count: {
        id: true
      }
    });

    const statusBreakdown = await prisma.payments.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true },
      _sum: { amount: true }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          payments,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          },
          summary: {
            totalAmount: paymentStats._sum.amount || 0,
            totalRefunds: paymentStats._sum.refund_amount || 0,
            totalPayments: paymentStats._count.id,
            byStatus: statusBreakdown.reduce((acc, item) => {
              acc[item.status || 'unknown'] = {
                count: item._count.id,
                amount: item._sum.amount || 0
              };
              return acc;
            }, {} as Record<string, { count: number; amount: number }>)
          }
        },
        message: 'Payments retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
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

    // Only doctors, HSPs, and admins can process payments
    if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      subscription_id,
      patientId,
      provider_id,
      amount,
      currency = 'USD',
      payment_method,
      billing_period_start,
      billing_period_end,
      invoice_id,
      metadata = {}
    } = body;

    // Validation
    if (!subscription_id || !patientId || !provider_id || !amount || !payment_method) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Subscription ID, patient ID, provider ID, amount, and payment method are required' } }
      }, { status: 400 });
    }

    // Verify subscription exists
    const subscription = await prisma.patientSubscription.findUnique({
      where: { id: subscription_id },
      include: {
        service_plans: {
          select: { name: true, billing_cycle: true }
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Subscription not found' } }
      }, { status: 404 });
    }

    // Check if user has permission to process payment for this subscription
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: session.user.id }
      });
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });
      
      if (!doctor || !patient || patient.primaryCareDoctorId !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only process payments for your patients' } }
        }, { status: 403 });
      }
    }

    // Create payment record
    const payment = await prisma.payments.create({
      data: {
        id: randomUUID(),
        subscription_id,
        patientId,
        provider_id,
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        payment_method,
        billing_period_start: billing_period_start ? new Date(billing_period_start) : null,
        billing_period_end: billing_period_end ? new Date(billing_period_end) : null,
        invoice_id,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        patients: {
          select: {
            id: true,
            patientId: true,
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        patient_subscriptions: {
          select: {
            id: true,
            service_plans: {
              select: {
                name: true,
                billing_cycle: true
              }
            }
          }
        }
      }
    });

    // TODO: Integrate with actual payment processor (Stripe, etc.)
    // For now, we'll simulate payment processing

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { payment },
        message: 'Payment initiated successfully'
      }
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
