import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';

const updateSubscriptionSchema = z.object({
  action: z.enum(['PAUSE', 'RESUME', 'CANCEL', 'UPGRADE', 'DOWNGRADE', 'UPDATE_PAYMENT_METHOD']),
  newPlanId: z.string().uuid().optional(),
  reason: z.string().optional(),
  effectiveDate: z.string().datetime().optional(),
  paymentMethodToken: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().default(true)
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get subscription with related data
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: {
          select: {
            name: true,
            planType: true,
            billingCycle: true,
            features: true,
            limits: true,
            price: true,
            currency: true
          }
        },
        subscriber: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        organization: {
          select: {
            name: true,
            type: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            provider: true,
            createdAt: true,
            dueDate: true
          }
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Permission check: Only subscription owner, organization admins, or system admins can view
    const hasAccess = (
      session.user.id === subscription.subscriberId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && subscription.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Calculate usage statistics
    const usageStats = await calculateUsageStatistics(subscription.id, subscription.organizationId);

    // Get billing history
    const billingHistory = await prisma.payment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        provider: true,
        createdAt: true,
        dueDate: true,
        failureReason: true
      }
    });

    // Check for upcoming renewal
    const daysUntilRenewal = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      message: 'Subscription details retrieved successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        subscriber: subscription.subscriber,
        organization: subscription.organization,
        billing: {
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialEnd: subscription.trialEnd,
          quantity: subscription.quantity,
          unitPrice: subscription.unitPrice,
          totalPrice: subscription.totalPrice,
          currency: subscription.currency,
          billingCycle: subscription.billingCycle,
          nextBillingDate: subscription.currentPeriodEnd,
          daysUntilRenewal
        },
        usage: usageStats,
        recentPayments: subscription.payments,
        metadata: subscription.metadata
      },
      billingHistory,
      availableActions: getAvailableActions(subscription.status, session.user.role),
      nextSteps: generateNextSteps(subscription, daysUntilRenewal)
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    // Get existing subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        organization: true
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Permission check
    const hasAccess = (
      session.user.id === subscription.subscriberId ||
      session.user.role === 'SYSTEM_ADMIN' ||
      (session.user.role === 'HOSPITAL_ADMIN' && subscription.organizationId === session.user.organizationId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Process the requested action
    const result = await processSubscriptionAction({
      subscription,
      action: validatedData.action,
      newPlanId: validatedData.newPlanId,
      reason: validatedData.reason,
      effectiveDate: validatedData.effectiveDate,
      paymentMethodToken: validatedData.paymentMethodToken,
      cancelAtPeriodEnd: validatedData.cancelAtPeriodEnd,
      performedBy: session.user.id
    });

    return NextResponse.json({
      message: `Subscription ${validatedData.action.toLowerCase()} processed successfully`,
      subscription: result.subscription,
      changes: result.changes,
      nextSteps: result.nextSteps
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

async function calculateUsageStatistics(subscriptionId: string, organizationId?: string) {
  const currentPeriodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

  if (organizationId) {
    // Organization usage
    const [doctorCount, patientCount, appointmentCount, storageUsed] = await Promise.all([
      prisma.doctor.count({ where: { organizationId } }),
      prisma.patient.count({
        where: {
          OR: [
            { primaryCareDoctor: { organizationId } },
            { patientDoctorAssignments: { some: { doctor: { organizationId } } } }
          ]
        }
      }),
      prisma.appointment.count({
        where: {
          doctor: { organizationId },
          createdAt: { gte: currentPeriodStart }
        }
      }),
      // Mock storage calculation - in real implementation would query actual storage usage
      Math.floor(Math.random() * 1000) // MB
    ]);

    return {
      doctors: doctorCount,
      patients: patientCount,
      appointmentsThisPeriod: appointmentCount,
      storageUsedMB: storageUsed,
      period: '30 days'
    };
  } else {
    // Individual usage
    const user = await prisma.user.findUnique({
      where: { id: subscriptionId },
      include: {
        doctor: true,
        patient: true
      }
    });

    if (user?.doctor) {
      const appointmentCount = await prisma.appointment.count({
        where: {
          doctorId: user.id,
          createdAt: { gte: currentPeriodStart }
        }
      });

      const patientCount = await prisma.patient.count({
        where: { primaryCareDoctorId: user.id }
      });

      return {
        doctors: 1,
        patients: patientCount,
        appointmentsThisPeriod: appointmentCount,
        storageUsedMB: Math.floor(Math.random() * 100), // Mock storage
        period: '30 days'
      };
    }

    return {
      doctors: 0,
      patients: user?.patient ? 1 : 0,
      appointmentsThisPeriod: 0,
      storageUsedMB: Math.floor(Math.random() * 10), // Mock storage
      period: '30 days'
    };
  }
}

function getAvailableActions(status: string, userRole: string) {
  const actions = [];

  switch (status) {
    case 'ACTIVE':
      actions.push('PAUSE', 'CANCEL', 'UPGRADE', 'DOWNGRADE', 'UPDATE_PAYMENT_METHOD');
      break;
    case 'TRIAL':
      actions.push('CANCEL', 'UPGRADE', 'UPDATE_PAYMENT_METHOD');
      break;
    case 'PAUSED':
      actions.push('RESUME', 'CANCEL');
      break;
    case 'PAST_DUE':
      actions.push('UPDATE_PAYMENT_METHOD', 'CANCEL');
      break;
    case 'CANCELLED':
      // No actions available for cancelled subscriptions
      break;
    default:
      actions.push('UPDATE_PAYMENT_METHOD');
  }

  // System admins can perform additional actions
  if (userRole === 'SYSTEM_ADMIN') {
    actions.push('PAUSE', 'RESUME'); // Even for statuses that normally don't allow it
  }

  return actions;
}

function generateNextSteps(subscription: any, daysUntilRenewal: number) {
  const steps = [];

  if (subscription.status === 'TRIAL' && daysUntilRenewal <= 3) {
    steps.push({
      priority: 'HIGH',
      action: 'ADD_PAYMENT_METHOD',
      message: `Trial expires in ${daysUntilRenewal} days. Add payment method to continue service.`,
      dueDate: subscription.trialEnd
    });
  }

  if (subscription.status === 'PAST_DUE') {
    steps.push({
      priority: 'CRITICAL',
      action: 'UPDATE_PAYMENT_METHOD',
      message: 'Payment failed. Update payment method to restore service.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  }

  if (subscription.status === 'ACTIVE' && daysUntilRenewal <= 7) {
    steps.push({
      priority: 'MEDIUM',
      action: 'REVIEW_USAGE',
      message: `Renewal in ${daysUntilRenewal} days. Review usage and plan limits.`,
      dueDate: subscription.currentPeriodEnd
    });
  }

  return steps;
}

async function processSubscriptionAction(params: {
  subscription: any;
  action: string;
  newPlanId?: string;
  reason?: string;
  effectiveDate?: string;
  paymentMethodToken?: string;
  cancelAtPeriodEnd: boolean;
  performedBy: string;
}) {
  const {
    subscription,
    action,
    newPlanId,
    reason,
    effectiveDate,
    paymentMethodToken,
    cancelAtPeriodEnd,
    performedBy
  } = params;

  return await prisma.$transaction(async (tx) => {
    let updatedSubscription;
    const changes: any[] = [];
    const nextSteps: any[] = [];

    switch (action) {
      case 'PAUSE':
        updatedSubscription = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'PAUSED',
            pausedAt: new Date(),
            metadata: {
              ...subscription.metadata,
              pauseReason: reason,
              pausedBy: performedBy
            }
          }
        });
        changes.push({ field: 'status', from: subscription.status, to: 'PAUSED' });
        nextSteps.push({ action: 'RESUME', description: 'Resume subscription when ready' });
        break;

      case 'RESUME':
        const resumeDate = effectiveDate ? new Date(effectiveDate) : new Date();
        updatedSubscription = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: resumeDate,
            pausedAt: null,
            metadata: {
              ...subscription.metadata,
              resumeReason: reason,
              resumedBy: performedBy
            }
          }
        });
        changes.push({ field: 'status', from: subscription.status, to: 'ACTIVE' });
        break;

      case 'CANCEL':
        const cancelDate = cancelAtPeriodEnd ? subscription.currentPeriodEnd : new Date();
        updatedSubscription = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: cancelAtPeriodEnd ? 'CANCELLED_AT_PERIOD_END' : 'CANCELLED',
            cancelledAt: cancelDate,
            metadata: {
              ...subscription.metadata,
              cancellationReason: reason,
              cancelledBy: performedBy,
              cancelAtPeriodEnd
            }
          }
        });
        changes.push({ 
          field: 'status', 
          from: subscription.status, 
          to: cancelAtPeriodEnd ? 'CANCELLED_AT_PERIOD_END' : 'CANCELLED' 
        });
        break;

      case 'UPGRADE':
      case 'DOWNGRADE':
        if (!newPlanId) {
          throw new Error(`New plan ID required for ${action.toLowerCase()}`);
        }

        const newPlan = await tx.subscriptionPlan.findUnique({
          where: { id: newPlanId }
        });

        if (!newPlan) {
          throw new Error('New plan not found');
        }

        // Calculate prorated amount if needed
        const changeDate = effectiveDate ? new Date(effectiveDate) : new Date();
        const prorationCalculation = calculateProration(subscription, newPlan, changeDate);

        updatedSubscription = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            planId: newPlan.id,
            unitPrice: newPlan.price,
            totalPrice: newPlan.price * subscription.quantity,
            currency: newPlan.currency,
            billingCycle: newPlan.billingCycle,
            metadata: {
              ...subscription.metadata,
              previousPlanId: subscription.planId,
              changeReason: reason,
              changedBy: performedBy,
              proration: prorationCalculation
            }
          }
        });

        changes.push(
          { field: 'plan', from: subscription.plan.name, to: newPlan.name },
          { field: 'price', from: subscription.totalPrice, to: newPlan.price * subscription.quantity }
        );

        // Create proration payment if needed
        if (prorationCalculation.amount !== 0) {
          await tx.payment.create({
            data: {
              subscriptionId: subscription.id,
              amount: Math.abs(prorationCalculation.amount),
              currency: newPlan.currency,
              provider: subscription.paymentProvider,
              status: prorationCalculation.amount > 0 ? 'PENDING' : 'COMPLETED',
              description: prorationCalculation.amount > 0 ? 
                `Upgrade proration charge` : 
                `Downgrade proration credit`,
              dueDate: new Date(),
              metadata: {
                isProration: true,
                planChange: action,
                previousPlanId: subscription.planId,
                newPlanId: newPlan.id
              }
            }
          });

          nextSteps.push({
            action: prorationCalculation.amount > 0 ? 'PAY_PRORATION' : 'CREDIT_APPLIED',
            description: prorationCalculation.amount > 0 ? 
              `Pay proration charge of ${Math.abs(prorationCalculation.amount)} ${newPlan.currency}` :
              `Credit of ${Math.abs(prorationCalculation.amount)} ${newPlan.currency} applied to account`
          });
        }
        break;

      case 'UPDATE_PAYMENT_METHOD':
        if (!paymentMethodToken) {
          throw new Error('Payment method token required');
        }

        updatedSubscription = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: subscription.status === 'PAST_DUE' ? 'ACTIVE' : subscription.status,
            metadata: {
              ...subscription.metadata,
              paymentMethodUpdatedBy: performedBy,
              paymentMethodUpdatedAt: new Date().toISOString()
            }
          }
        });

        changes.push({ field: 'paymentMethod', from: 'old', to: 'updated' });
        if (subscription.status === 'PAST_DUE') {
          changes.push({ field: 'status', from: 'PAST_DUE', to: 'ACTIVE' });
        }
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    // Create audit log
    await tx.subscriptionAuditLog.create({
      data: {
        subscriptionId: subscription.id,
        action: action,
        performedBy: performedBy,
        details: {
          reason,
          effectiveDate,
          newPlanId,
          changes,
          metadata: {
            cancelAtPeriodEnd,
            hasPaymentMethodToken: !!paymentMethodToken
          }
        },
        timestamp: new Date()
      }
    });

    return { subscription: updatedSubscription, changes, nextSteps };
  });
}

function calculateProration(currentSubscription: any, newPlan: any, changeDate: Date) {
  const currentPeriodStart = currentSubscription.currentPeriodStart;
  const currentPeriodEnd = currentSubscription.currentPeriodEnd;
  const totalPeriodDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil((currentPeriodEnd.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24));

  const currentDailyRate = currentSubscription.totalPrice / totalPeriodDays;
  const newDailyRate = newPlan.price / totalPeriodDays;
  
  const remainingCurrentValue = currentDailyRate * remainingDays;
  const newPeriodValue = newDailyRate * remainingDays;
  
  const prorationAmount = newPeriodValue - remainingCurrentValue;

  return {
    amount: Math.round(prorationAmount * 100) / 100, // Round to 2 decimal places
    remainingDays,
    currentDailyRate,
    newDailyRate,
    description: prorationAmount > 0 ? 'Additional charge for upgrade' : 'Credit for downgrade'
  };
}
