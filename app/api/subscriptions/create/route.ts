import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';

const createSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  paymentProvider: z.enum(['STRIPE', 'RAZORPAY']).default('STRIPE'),
  billingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2) // ISO country code
  }),
  organizationId: z.string().uuid().optional(), // For organization subscriptions
  doctorCount: z.number().int().positive().default(1), // For scaling plans
  paymentMethodToken: z.string().optional(), // Frontend payment method token
  promoCode: z.string().optional(),
  startTrialImmediately: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    // Get the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: validatedData.planId },
      include: {
        parentPlan: true
      }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Subscription plan not found or inactive' }, { status: 404 });
    }

    // Validate user eligibility for plan type
    const eligibilityCheck = await validateUserEligibility(session.user, plan, validatedData.organizationId);
    if (!eligibilityCheck.eligible) {
      return NextResponse.json({ error: eligibilityCheck.reason }, { status: 403 });
    }

    // Check for existing active subscriptions
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        subscriberId: session.user.id,
        status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] }
      }
    });

    if (existingSubscription) {
      return NextResponse.json({ 
        error: 'User already has an active subscription',
        existingSubscription: {
          id: existingSubscription.id,
          planName: existingSubscription.planId,
          status: existingSubscription.status,
          currentPeriodEnd: existingSubscription.currentPeriodEnd
        }
      }, { status: 409 });
    }

    // Apply promo code if provided
    let discountAmount = 0;
    let promoCodeDetails = null;
    if (validatedData.promoCode) {
      const promoValidation = await validatePromoCode(validatedData.promoCode, plan.id);
      if (promoValidation.valid) {
        discountAmount = promoValidation.discountAmount;
        promoCodeDetails = promoValidation.details;
      } else {
        return NextResponse.json({ error: `Invalid promo code: ${promoValidation.reason}` }, { status: 400 });
      }
    }

    // Calculate final pricing
    const pricing = calculateSubscriptionPricing({
      basePlan: plan,
      doctorCount: validatedData.doctorCount,
      discountAmount,
      organizationDiscount: eligibilityCheck.organizationDiscount
    });

    // Begin transaction to create subscription
    const result = await prisma.$transaction(async (tx) => {
      // Create subscription record
      const subscription = await tx.subscription.create({
        data: {
          subscriberId: session.user.id,
          planId: plan.id,
          organizationId: validatedData.organizationId,
          status: validatedData.startTrialImmediately && plan.trialPeriodDays > 0 ? 'TRIAL' : 'PENDING_PAYMENT',
          paymentProvider: validatedData.paymentProvider,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + (plan.trialPeriodDays || 0) * 24 * 60 * 60 * 1000),
          trialEnd: plan.trialPeriodDays > 0 ? new Date(Date.now() + plan.trialPeriodDays * 24 * 60 * 60 * 1000) : null,
          quantity: validatedData.doctorCount,
          unitPrice: pricing.unitPrice,
          totalPrice: pricing.totalPrice,
          discountAmount: discountAmount,
          currency: plan.currency,
          billingCycle: plan.billingCycle,
          billingAddress: validatedData.billingAddress,
          metadata: {
            promoCode: validatedData.promoCode,
            promoCodeDetails,
            createdVia: 'API',
            userRole: session.user.role,
            organizationDiscount: eligibilityCheck.organizationDiscount
          }
        }
      });

      // Create payment record if not in trial
      let paymentRecord = null;
      if (subscription.status === 'PENDING_PAYMENT') {
        paymentRecord = await tx.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: pricing.totalPrice - discountAmount,
            currency: plan.currency,
            provider: validatedData.paymentProvider,
            status: 'PENDING',
            paymentMethodToken: validatedData.paymentMethodToken,
            description: `Subscription to ${plan.name} - ${plan.billingCycle}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days to pay
          }
        });
      }

      // Update organization subscription if applicable
      if (validatedData.organizationId && plan.organizationTemplate) {
        await tx.organization.update({
          where: { id: validatedData.organizationId },
          data: {
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            maxDoctors: plan.limits.maxDoctors,
            maxPatients: plan.limits.maxPatients
          }
        });
      }

      // Create audit log
      await tx.subscriptionAuditLog.create({
        data: {
          subscriptionId: subscription.id,
          action: 'CREATED',
          performedBy: session.user.id,
          details: {
            planName: plan.name,
            paymentProvider: validatedData.paymentProvider,
            doctorCount: validatedData.doctorCount,
            totalPrice: pricing.totalPrice,
            discountApplied: discountAmount,
            trialPeriod: plan.trialPeriodDays
          },
          timestamp: new Date()
        }
      });

      return { subscription, paymentRecord, pricing };
    });

    // Process payment if not in trial
    let paymentIntent = null;
    if (result.subscription.status === 'PENDING_PAYMENT' && result.paymentRecord) {
      if (validatedData.paymentProvider === 'STRIPE') {
        paymentIntent = await createStripePaymentIntent({
          amount: result.paymentRecord.amount,
          currency: plan.currency,
          customerId: session.user.id,
          subscriptionId: result.subscription.id,
          paymentMethodToken: validatedData.paymentMethodToken
        });
      } else if (validatedData.paymentProvider === 'RAZORPAY') {
        paymentIntent = await createRazorPayOrder({
          amount: result.paymentRecord.amount,
          currency: plan.currency,
          customerId: session.user.id,
          subscriptionId: result.subscription.id
        });
      }

      // Update payment record with provider details
      if (paymentIntent) {
        await prisma.payment.update({
          where: { id: result.paymentRecord.id },
          data: {
            providerPaymentId: paymentIntent.id,
            providerResponse: paymentIntent.metadata
          }
        });
      }
    }

    return NextResponse.json({
      message: 'Subscription created successfully',
      subscription: {
        id: result.subscription.id,
        plan: {
          name: plan.name,
          type: plan.planType,
          billingCycle: plan.billingCycle
        },
        status: result.subscription.status,
        trialEnd: result.subscription.trialEnd,
        currentPeriodEnd: result.subscription.currentPeriodEnd,
        pricing: result.pricing,
        payment: result.paymentRecord ? {
          id: result.paymentRecord.id,
          amount: result.paymentRecord.amount,
          dueDate: result.paymentRecord.dueDate,
          provider: result.paymentRecord.provider,
          paymentIntent: paymentIntent
        } : null
      },
      nextSteps: result.subscription.status === 'TRIAL' ? {
        message: `Trial period active for ${plan.trialPeriodDays} days`,
        trialEnd: result.subscription.trialEnd,
        setupPayment: 'Add payment method before trial expires'
      } : {
        message: 'Complete payment to activate subscription',
        paymentRequired: true,
        paymentIntent: paymentIntent?.client_secret
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

async function validateUserEligibility(user: any, plan: any, organizationId?: string) {
  // Role-based plan eligibility
  const roleEligibility = {
    PATIENT: ['INDIVIDUAL'],
    DOCTOR: ['INDIVIDUAL', 'CLINIC'],
    HSP: ['CLINIC', 'HOSPITAL'],
    HOSPITAL_ADMIN: ['HOSPITAL', 'PROVIDER'],
    SYSTEM_ADMIN: ['INDIVIDUAL', 'CLINIC', 'HOSPITAL', 'PROVIDER']
  };

  if (!roleEligibility[user.role as keyof typeof roleEligibility]?.includes(plan.planType)) {
    return {
      eligible: false,
      reason: `User role ${user.role} is not eligible for ${plan.planType} plan`
    };
  }

  // Organization validation for hospital/provider plans
  if (['HOSPITAL', 'PROVIDER'].includes(plan.planType)) {
    if (!organizationId) {
      return {
        eligible: false,
        reason: 'Organization ID required for hospital/provider plans'
      };
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        OR: [
          { adminUserId: user.id },
          { doctors: { some: { userId: user.id } } },
          { hsps: { some: { userId: user.id } } }
        ]
      }
    });

    if (!organization) {
      return {
        eligible: false,
        reason: 'User is not associated with the specified organization'
      };
    }

    // Check for bulk discount eligibility
    const doctorCount = await prisma.doctor.count({
      where: { organizationId: organization.id }
    });

    const organizationDiscount = doctorCount >= 10 ? 0.15 : doctorCount >= 5 ? 0.10 : 0;

    return {
      eligible: true,
      organizationDiscount,
      organization
    };
  }

  return { eligible: true, organizationDiscount: 0 };
}

async function validatePromoCode(promoCode: string, planId: string) {
  const promo = await prisma.promoCode.findUnique({
    where: { code: promoCode }
  });

  if (!promo) {
    return { valid: false, reason: 'Promo code not found' };
  }

  if (!promo.isActive) {
    return { valid: false, reason: 'Promo code is inactive' };
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { valid: false, reason: 'Promo code has expired' };
  }

  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
    return { valid: false, reason: 'Promo code usage limit reached' };
  }

  // Check plan eligibility
  if (promo.applicablePlans && promo.applicablePlans.length > 0 && !promo.applicablePlans.includes(planId)) {
    return { valid: false, reason: 'Promo code not applicable to this plan' };
  }

  return {
    valid: true,
    discountAmount: promo.discountAmount || 0,
    discountPercent: promo.discountPercent || 0,
    details: {
      code: promo.code,
      description: promo.description,
      type: promo.discountType
    }
  };
}

function calculateSubscriptionPricing(params: {
  basePlan: any;
  doctorCount: number;
  discountAmount: number;
  organizationDiscount: number;
}) {
  const { basePlan, doctorCount, discountAmount, organizationDiscount } = params;
  
  const unitPrice = basePlan.price;
  let subtotal = unitPrice * doctorCount;
  
  // Apply organization bulk discount
  if (organizationDiscount > 0) {
    subtotal = subtotal * (1 - organizationDiscount);
  }
  
  // Apply promo code discount
  const totalPrice = Math.max(0, subtotal - discountAmount);
  
  return {
    unitPrice,
    subtotal,
    organizationDiscount: organizationDiscount * 100, // Return as percentage
    promoDiscount: discountAmount,
    totalPrice,
    savings: subtotal - totalPrice
  };
}

async function createStripePaymentIntent(params: {
  amount: number;
  currency: string;
  customerId: string;
  subscriptionId: string;
  paymentMethodToken?: string;
}) {
  // In a real implementation, this would integrate with Stripe API
  // For now, return a mock payment intent structure
  return {
    id: `pi_mock_${Date.now()}`,
    client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
    amount: params.amount * 100, // Stripe uses cents
    currency: params.currency.toLowerCase(),
    status: 'requires_payment_method',
    metadata: {
      subscriptionId: params.subscriptionId,
      customerId: params.customerId,
      provider: 'stripe'
    }
  };
}

async function createRazorPayOrder(params: {
  amount: number;
  currency: string;
  customerId: string;
  subscriptionId: string;
}) {
  // In a real implementation, this would integrate with RazorPay API
  // For now, return a mock order structure
  return {
    id: `order_mock_${Date.now()}`,
    amount: params.amount * 100, // RazorPay uses paisa/cents
    currency: params.currency,
    status: 'created',
    metadata: {
      subscriptionId: params.subscriptionId,
      customerId: params.customerId,
      provider: 'razorpay'
    }
  };
}
