// app/api/payments/[id]/route.ts - Individual payment management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

// Get specific payment by ID
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

    const paymentId = params.id;

    const payment = await prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        patients: {
          select: {
            id: true,
            patient_id: true,
            user: {
              select: {
                name: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        patient_subscriptions: {
          select: {
            id: true,
            status: true,
            current_period_start: true,
            current_period_end: true,
            service_plans: {
              select: {
                name: true,
                description: true,
                billing_cycle: true,
                features: true
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
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Payment not found' } }
      }, { status: 404 });
    }

    // Check access permissions
    if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { user_id: session.user.id }
      });
      if (!patient || payment.patient_id !== patient.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Access denied' } }
        }, { status: 403 });
      }
    } else if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { user_id: session.user.id }
      });
      const patient = await prisma.patient.findUnique({
        where: { id: payment.patient_id }
      });
      if (!doctor || !patient || patient.primary_care_doctor_id !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Access denied' } }
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { payment },
        message: 'Payment retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

// Update payment status or metadata
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

    // Only certain roles can update payments
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const paymentId = params.id;
    const body = await request.json();
    const {
      status,
      failure_code,
      failure_message,
      stripe_payment_intent_id,
      stripe_charge_id,
      metadata
    } = body;

    // Find existing payment
    const existingPayment = await prisma.payments.findUnique({
      where: { id: paymentId }
    });

    if (!existingPayment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Payment not found' } }
      }, { status: 404 });
    }

    // Check permissions for doctors
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { user_id: session.user.id }
      });
      const patient = await prisma.patient.findUnique({
        where: { id: existingPayment.patient_id }
      });
      if (!doctor || !patient || patient.primary_care_doctor_id !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only update payments for your patients' } }
        }, { status: 403 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    if (status !== undefined) updateData.status = status;
    if (failure_code !== undefined) updateData.failure_code = failure_code;
    if (failure_message !== undefined) updateData.failure_message = failure_message;
    if (stripe_payment_intent_id !== undefined) updateData.stripe_payment_intent_id = stripe_payment_intent_id;
    if (stripe_charge_id !== undefined) updateData.stripe_charge_id = stripe_charge_id;
    if (metadata !== undefined) updateData.metadata = metadata;

    // If payment is being marked as successful, update subscription
    if (status === 'succeeded' && existingPayment.status !== 'succeeded') {
      const subscription = await prisma.patientSubscription.findUnique({
        where: { id: existingPayment.subscription_id }
      });

      if (subscription) {
        // Update subscription's last payment info
        await prisma.patientSubscription.update({
          where: { id: existingPayment.subscription_id },
          data: {
            last_payment_date: new Date(),
            last_payment_amount: existingPayment.amount,
            failure_count: 0, // Reset failure count on successful payment
            updated_at: new Date()
          }
        });
      }
    }

    const updatedPayment = await prisma.payments.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        patients: {
          select: {
            patient_id: true,
            user: {
              select: {
                name: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        patient_subscriptions: {
          select: {
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

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { payment: updatedPayment },
        message: 'Payment updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

// Process refund
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

    // Only admins and doctors can process refunds
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const paymentId = params.id;
    const { searchParams } = new URL(request.url);
    const refundAmount = searchParams.get('amount');
    const refundReason = searchParams.get('reason') || 'Requested by provider';

    // Find existing payment
    const existingPayment = await prisma.payments.findUnique({
      where: { id: paymentId }
    });

    if (!existingPayment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Payment not found' } }
      }, { status: 404 });
    }

    // Check if payment can be refunded
    if (existingPayment.status !== 'succeeded') {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Can only refund successful payments' } }
      }, { status: 400 });
    }

    // Check permissions for doctors
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { user_id: session.user.id }
      });
      const patient = await prisma.patient.findUnique({
        where: { id: existingPayment.patient_id }
      });
      if (!doctor || !patient || patient.primary_care_doctor_id !== doctor.id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only refund payments for your patients' } }
        }, { status: 403 });
      }
    }

    // Calculate refund amount
    const amount = refundAmount ? parseFloat(refundAmount) : existingPayment.amount;
    const currentRefunds = existingPayment.refund_amount || 0;
    const availableForRefund = existingPayment.amount - currentRefunds;

    if (amount > availableForRefund) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Refund amount exceeds available refund amount' } }
      }, { status: 400 });
    }

    // Process refund
    const updatedPayment = await prisma.payments.update({
      where: { id: paymentId },
      data: {
        refund_amount: currentRefunds + amount,
        refund_reason,
        status: currentRefunds + amount >= existingPayment.amount ? 'refunded' : 'partially_refunded',
        updated_at: new Date()
      }
    });

    // TODO: Process actual refund with payment processor (Stripe, etc.)

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          payment_id: paymentId,
          refund_amount: amount,
          total_refunds: currentRefunds + amount,
          status: updatedPayment.status
        },
        message: `Refund of ${amount} processed successfully`
      }
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
