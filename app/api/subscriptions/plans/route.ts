import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


export const dynamic = 'force-dynamic';

const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  planType: z.enum(['INDIVIDUAL', 'CLINIC', 'HOSPITAL', 'PROVIDER']),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  price: z.number().positive('Price must be positive'),
  currency: z.enum(['USD', 'INR']).default('USD'),
  features: z.array(z.string()).default([]),
  limits: z.object({
    maxDoctors: z.number().int().positive().optional(),
    maxPatients: z.number().int().positive().optional(),
    maxAppointments: z.number().int().positive().optional(),
    maxStorage: z.number().int().positive().optional(), // GB
    maxAPICallsPerMonth: z.number().int().positive().optional()
  }).default({}),
  trialPeriodDays: z.number().int().min(0).max(7).default(7), // Healthcare-compliant trial
  isActive: z.boolean().default(true),
  organizationTemplate: z.boolean().default(false), // For hospital/provider templates
  parentPlanId: z.string().uuid().optional() // For organization-wide plans
});

const getPlanSchema = z.object({
  planType: z.enum(['INDIVIDUAL', 'CLINIC', 'HOSPITAL', 'PROVIDER']).optional(),
  currency: z.enum(['USD', 'INR']).optional(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  isActive: z.boolean().default(true),
  includeTrialPlans: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only system admins can create subscription plans
    if (session.user.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({ error: 'Only system administrators can create subscription plans' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createPlanSchema.parse(body);

    // Validate plan hierarchy for organization templates
    if (validatedData.parentPlanId) {
      const parentPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: validatedData.parentPlanId }
      });

      if (!parentPlan) {
        return NextResponse.json({ error: 'Parent plan not found' }, { status: 404 });
      }

      if (!parentPlan.organizationTemplate) {
        return NextResponse.json({ 
          error: 'Parent plan must be an organization template' 
        }, { status: 400 });
      }
    }

    // Validate plan limits based on plan type
    const validatedLimits = validatePlanLimits(validatedData.planType, validatedData.limits);
    if (validatedLimits.error) {
      return NextResponse.json({ error: validatedLimits.error }, { status: 400 });
    }

    // Create the subscription plan
    const subscriptionPlan = await prisma.subscriptionPlan.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        planType: validatedData.planType,
        billingCycle: validatedData.billingCycle,
        price: validatedData.price,
        currency: validatedData.currency,
        features: validatedData.features,
        limits: validatedData.limits,
        trialPeriodDays: validatedData.trialPeriodDays,
        isActive: validatedData.isActive,
        organizationTemplate: validatedData.organizationTemplate,
        parentPlanId: validatedData.parentPlanId,
        createdBy: session.user.id,
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Subscription plan created successfully',
      plan: {
        id: subscriptionPlan.id,
        name: subscriptionPlan.name,
        description: subscriptionPlan.description,
        planType: subscriptionPlan.planType,
        billingCycle: subscriptionPlan.billingCycle,
        price: subscriptionPlan.price,
        currency: subscriptionPlan.currency,
        features: subscriptionPlan.features,
        limits: subscriptionPlan.limits,
        trialPeriodDays: subscriptionPlan.trialPeriodDays,
        isActive: subscriptionPlan.isActive,
        organizationTemplate: subscriptionPlan.organizationTemplate,
        createdAt: subscriptionPlan.createdAt
      },
      nextSteps: {
        configurePaymentProviders: 'Configure Stripe and RazorPay integration for this plan',
        activatePlan: subscriptionPlan.isActive ? 'Plan is active and ready for subscriptions' : 'Activate plan when ready',
        viewPlans: 'Use GET /api/subscriptions/plans to view all plans'
      }
    });

  } catch (error) {
    console.error('Error creating subscription plan:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create subscription plan' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const queryData = getPlanSchema.parse({
      planType: searchParams.get('planType') || undefined,
      currency: searchParams.get('currency') || undefined,
      billingCycle: searchParams.get('billingCycle') || undefined,
      isActive: searchParams.get('isActive') !== 'false',
      includeTrialPlans: searchParams.get('includeTrialPlans') === 'true'
    });

    // Build filter based on user role and query parameters
    const planFilter: any = {
      isActive: queryData.isActive
    };

    if (queryData.planType) {
      planFilter.planType = queryData.planType;
    }

    if (queryData.currency) {
      planFilter.currency = queryData.currency;
    }

    if (queryData.billingCycle) {
      planFilter.billingCycle = queryData.billingCycle;
    }

    // Role-based filtering
    if (session.user.role === 'PATIENT' || session.user.role === 'DOCTOR') {
      // Individual users can only see individual and clinic plans
      planFilter.planType = { in: ['INDIVIDUAL', 'CLINIC'] };
    } else if (session.user.role === 'HOSPITAL_ADMIN') {
      // Hospital admins can see hospital and provider plans
      planFilter.planType = { in: ['HOSPITAL', 'PROVIDER'] };
    }
    // System admins can see all plans (no additional filter)

    // Filter trial plans unless explicitly requested
    if (!queryData.includeTrialPlans && session.user.role !== 'SYSTEM_ADMIN') {
      planFilter.trialPeriodDays = { lte: 7 }; // Standard trial periods only
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: planFilter,
      include: {
        parentPlan: {
          select: {
            id: true,
            name: true,
            planType: true
          }
        },
        _count: {
          select: {
            subscriptions: true // Count active subscriptions
          }
        }
      },
      orderBy: [
        { planType: 'asc' },
        { billingCycle: 'asc' },
        { price: 'asc' }
      ]
    });

    // Calculate popularity and recommendations
    const plansWithMetrics = plans.map(plan => {
      const popularity = calculatePlanPopularity(plan._count.subscriptions, plan.planType);
      const isRecommended = determineRecommendedPlan(plan, session.user.role);
      
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        planType: plan.planType,
        billingCycle: plan.billingCycle,
        price: plan.price,
        currency: plan.currency,
        features: plan.features,
        limits: plan.limits,
        trialPeriodDays: plan.trialPeriodDays,
        isActive: plan.isActive,
        organizationTemplate: plan.organizationTemplate,
        parentPlan: plan.parentPlan,
        metrics: {
          activeSubscriptions: plan._count.subscriptions,
          popularity: popularity,
          isRecommended: isRecommended
        },
        pricing: {
          monthlyEquivalent: calculateMonthlyEquivalent(plan.price, plan.billingCycle),
          annualSavings: calculateAnnualSavings(plan.price, plan.billingCycle),
          trialValue: plan.trialPeriodDays > 0 ? (plan.price / 30) * plan.trialPeriodDays : 0
        }
      };
    });

    // Group plans by type for better presentation
    const plansByType = plansWithMetrics.reduce((acc, plan) => {
      if (!acc[plan.planType]) {
        acc[plan.planType] = [];
      }
      acc[plan.planType].push(plan);
      return acc;
    }, {} as Record<string, typeof plansWithMetrics>);

    return NextResponse.json({
      message: 'Subscription plans retrieved successfully',
      plans: plansWithMetrics,
      plansByType,
      metadata: {
        totalPlans: plansWithMetrics.length,
        availableTypes: Object.keys(plansByType),
        userRole: session.user.role,
        currency: queryData.currency || 'USD',
        trialPlansIncluded: queryData.includeTrialPlans
      },
      recommendations: {
        forIndividuals: plansWithMetrics.filter(p => p.planType === 'INDIVIDUAL' && p.metrics.isRecommended),
        forClinics: plansWithMetrics.filter(p => p.planType === 'CLINIC' && p.metrics.isRecommended),
        forHospitals: plansWithMetrics.filter(p => p.planType === 'HOSPITAL' && p.metrics.isRecommended)
      }
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch subscription plans' }, { status: 500 });
  }
}

function validatePlanLimits(planType: string, limits: any) {
  const recommendations = {
    INDIVIDUAL: { maxDoctors: 1, maxPatients: 50, maxAppointments: 100, maxStorage: 5 },
    CLINIC: { maxDoctors: 10, maxPatients: 500, maxAppointments: 1000, maxStorage: 50 },
    HOSPITAL: { maxDoctors: 100, maxPatients: 10000, maxAppointments: 50000, maxStorage: 500 },
    PROVIDER: { maxDoctors: 1000, maxPatients: 100000, maxAppointments: 500000, maxStorage: 5000 }
  };

  const recommended = recommendations[planType as keyof typeof recommendations];
  
  if (limits.maxDoctors && limits.maxDoctors > recommended.maxDoctors * 2) {
    return { error: `Max doctors (${limits.maxDoctors}) exceeds recommended limit for ${planType} plans` };
  }
  
  if (limits.maxPatients && limits.maxPatients > recommended.maxPatients * 2) {
    return { error: `Max patients (${limits.maxPatients}) exceeds recommended limit for ${planType} plans` };
  }

  return { error: null };
}

function calculatePlanPopularity(subscriptionCount: number, planType: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  const thresholds = {
    INDIVIDUAL: { medium: 10, high: 50 },
    CLINIC: { medium: 5, high: 20 },
    HOSPITAL: { medium: 2, high: 10 },
    PROVIDER: { medium: 1, high: 5 }
  };

  const threshold = thresholds[planType as keyof typeof thresholds];
  
  if (subscriptionCount >= threshold.high) return 'HIGH';
  if (subscriptionCount >= threshold.medium) return 'MEDIUM';
  return 'LOW';
}

function determineRecommendedPlan(plan: any, userRole: string): boolean {
  // Simple recommendation logic - can be enhanced with ML/analytics
  if (userRole === 'PATIENT' && plan.planType === 'INDIVIDUAL') return true;
  if (userRole === 'DOCTOR' && plan.planType === 'CLINIC') return true;
  if (userRole === 'HOSPITAL_ADMIN' && plan.planType === 'HOSPITAL') return true;
  
  // Recommend monthly billing for new users, quarterly for established
  return plan.billingCycle === 'MONTHLY' || plan.billingCycle === 'QUARTERLY';
}

function calculateMonthlyEquivalent(price: number, billingCycle: string): number {
  switch (billingCycle) {
    case 'MONTHLY': return price;
    case 'QUARTERLY': return Math.round(price / 3 * 100) / 100;
    case 'ANNUAL': return Math.round(price / 12 * 100) / 100;
    default: return price;
  }
}

function calculateAnnualSavings(price: number, billingCycle: string): number {
  if (billingCycle === 'ANNUAL') {
    const monthlyEquivalent = price / 12;
    const annualAtMonthlyRate = monthlyEquivalent * 12;
    return Math.round((annualAtMonthlyRate - price) * 100) / 100;
  }
  return 0;
}
