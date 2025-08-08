// src/services/SubscriptionService.ts
import { ServicePlan, PatientSubscription, Payment, PaymentMethod, Patient, HealthcareProvider } from '../models/index.js';
import { Op } from 'sequelize';
import Stripe from 'stripe';

interface ServicePlanData {
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: any;
  patient_limit: number;
  trial_period_days?: number;
  setup_fee?: number;
}

class SubscriptionService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  // Service Plan Management
  async createServicePlan(providerId: string, planData: ServicePlanData): Promise<any> {
    const { name, description, price, billing_cycle, features, patient_limit, trial_period_days, setup_fee } = planData;

    // Create Stripe price if stripe integration is enabled
    let stripePriceId = null;
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripePrice = await this.stripe.prices.create({
          currency: 'usd',
          unit_amount: Math.round(price * 100), // Convert to cents
          recurring: billing_cycle !== 'one-time' ? { interval: billing_cycle } : undefined,
          product_data: {
            name: name,
            description: description,
          },
        });
        stripePriceId = stripePrice.id;
      } catch (error) {
        console.error('Failed to create Stripe price:', error);
      }
    }

    const servicePlan = await ServicePlan.create({
      provider_id: providerId,
      name,
      description,
      price,
      billing_cycle,
      features: features || [],
      patient_limit,
      trial_period_days: trial_period_days || 0,
      setup_fee: setup_fee || 0,
      stripe_price_id: stripePriceId,
    });

    return servicePlan;
  }

  async updateServicePlan(planId: string, updateData: any) {
    const plan = await ServicePlan.findByPk(planId);
    if (!plan) {
      throw new Error('Service plan not found');
    }

    await plan.update(updateData);
    return plan;
  }

  async getServicePlans(providerId: string, options: any = {}) {
    const { is_active = true, limit = 20, offset = 0 } = options;

    const plans = await ServicePlan.findAll({
      where: {
        provider_id: providerId,
        ...(is_active !== null && { is_active })
      },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return plans;
  }

  // Subscription Management
  async createSubscription(patientId: string, providerId: string, servicePlanId: string, paymentMethodId: string | null = null) {
    const servicePlan = await ServicePlan.findByPk(servicePlanId);
    if (!servicePlan || !servicePlan.is_active) {
      throw new Error('Service plan not found or inactive');
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Calculate subscription dates
    const now = new Date();
    const currentPeriodStart = new Date(now);
    const currentPeriodEnd = this.calculatePeriodEnd(currentPeriodStart, servicePlan.billing_cycle);
    
    let trialStart = null;
    let trialEnd = null;
    let status = 'ACTIVE';

    if (servicePlan.trial_period_days > 0) {
      trialStart = new Date(now);
      trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + servicePlan.trial_period_days);
      status = 'TRIALING';
    }

    // Create Stripe subscription if integration is enabled
    let stripeSubscriptionId = null;
    let stripeCustomerId = null;

    if (process.env.STRIPE_SECRET_KEY && servicePlan.stripe_price_id) {
      try {
        // Create or get Stripe customer
        const customer = await this.getOrCreateStripeCustomer(patient);
        stripeCustomerId = customer.id;

        // Attach payment method if provided
        if (paymentMethodId) {
          const paymentMethod = await PaymentMethod.findOne({
            where: { id: paymentMethodId, patient_id: patientId }
          });
          
          if (paymentMethod) {
            await this.stripe.paymentMethods.attach(paymentMethod.stripe_payment_method_id, {
              customer: stripeCustomerId,
            });
          }
        }

        // Create Stripe subscription
        const subscriptionParams = {
          customer: stripeCustomerId,
          items: [{ price: servicePlan.stripe_price_id }],
          trial_period_days: servicePlan.trial_period_days || undefined,
          default_payment_method: paymentMethodId ? (await PaymentMethod.findByPk(paymentMethodId))?.stripe_payment_method_id : undefined,
        };

        const stripeSubscription = await this.stripe.subscriptions.create(subscriptionParams);
        stripeSubscriptionId = stripeSubscription.id;
      } catch (error) {
        console.error('Failed to create Stripe subscription:', error);
        throw new Error('Payment processing failed');
      }
    }

    const subscription = await PatientSubscription.create({
      patient_id: patientId,
      provider_id: providerId,
      service_plan_id: servicePlanId,
      status,
      current_period_start: currentPeriodStart.toISOString().split('T')[0],
      current_period_end: currentPeriodEnd.toISOString().split('T')[0],
      next_billing_date: status === 'TRIALING' ? trialEnd.toISOString().split('T')[0] : currentPeriodEnd.toISOString().split('T')[0],
      trial_start: trialStart?.toISOString().split('T')[0],
      trial_end: trialEnd?.toISOString().split('T')[0],
      payment_method_id: paymentMethodId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
    });

    return subscription;
  }

  async cancelSubscription(subscriptionId: any, cancelReason = null, cancelAtPeriodEnd = true) {
    const subscription = await PatientSubscription.findByPk(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel Stripe subscription if exists
    if (subscription.stripe_subscription_id) {
      try {
        await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: cancelAtPeriodEnd,
          metadata: {
            cancel_reason: cancelReason || 'User requested cancellation'
          }
        });

        if (!cancelAtPeriodEnd) {
          await this.stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        }
      } catch (error) {
        console.error('Failed to cancel Stripe subscription:', error);
      }
    }

    const updateData = {
      status: cancelAtPeriodEnd ? 'CANCELLED' : 'CANCELLED',
      cancelled_at: new Date(),
      metadata: {
        ...subscription.metadata,
        cancel_reason: cancelReason,
        cancel_at_period_end: cancelAtPeriodEnd
      }
    };

    if (!cancelAtPeriodEnd) {
      (updateData as any).current_period_end = new Date().toISOString().split('T')[0];
    }

    await subscription.update(updateData);
    return subscription;
  }

  async reactivateSubscription(subscriptionId: any) {
    const subscription = await PatientSubscription.findByPk(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'CANCELLED') {
      throw new Error('Only cancelled subscriptions can be reactivated');
    }

    // Reactivate Stripe subscription if exists
    if (subscription.stripe_subscription_id) {
      try {
        await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: false,
        });
      } catch (error) {
        console.error('Failed to reactivate Stripe subscription:', error);
      }
    }

    await subscription.update({
      status: 'ACTIVE',
      cancelled_at: null,
      metadata: {
        ...subscription.metadata,
        reactivated_at: new Date().toISOString()
      }
    });

    return subscription;
  }

  // Payment Method Management
  async addPaymentMethod(patientId: any, stripePaymentMethodId: any, setAsDefault = false) {
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get payment method details from Stripe
    let paymentMethodData;
    try {
      paymentMethodData = await this.stripe.paymentMethods.retrieve(stripePaymentMethodId);
    } catch (error) {
      throw new Error('Invalid payment method');
    }

    // If setting as default, update existing default
    if (setAsDefault) {
      await PaymentMethod.update(
        { is_default: false },
        { where: { patient_id: patientId, is_default: true } }
      );
    }

    const paymentMethod = await PaymentMethod.create({
      patient_id: patientId,
      stripe_payment_method_id: stripePaymentMethodId,
      type: paymentMethodData.type,
      card_brand: paymentMethodData.card?.brand,
      card_last4: paymentMethodData.card?.last4,
      card_exp_month: paymentMethodData.card?.exp_month,
      card_exp_year: paymentMethodData.card?.exp_year,
      bank_name: paymentMethodData.us_bank_account?.bank_name,
      bank_last4: paymentMethodData.us_bank_account?.last4,
      is_default: setAsDefault,
      billing_address: paymentMethodData.billing_details?.address,
    });

    return paymentMethod;
  }

  async removePaymentMethod(paymentMethodId: any) {
    const paymentMethod = await PaymentMethod.findByPk(paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Detach from Stripe
    try {
      await this.stripe.paymentMethods.detach(paymentMethod.stripe_payment_method_id);
    } catch (error) {
      console.error('Failed to detach Stripe payment method:', error);
    }

    await paymentMethod.destroy();
    return true;
  }

  // Payment Processing
  async processPayment(subscriptionId: any, amount: any, paymentMethodId = null) {
    const subscription = await PatientSubscription.findByPk(subscriptionId, {
      include: [
        { model: Patient, as: 'patient' },
        { model: ServicePlan, as: 'servicePlan' }
      ]
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const paymentMethod = paymentMethodId 
      ? await PaymentMethod.findByPk(paymentMethodId)
      : await PaymentMethod.findOne({
          where: { patient_id: subscription.patient_id, is_default: true }
        });

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Create payment record
    const payment = await Payment.create({
      subscription_id: subscriptionId,
      patient_id: subscription.patient_id,
      provider_id: subscription.provider_id,
      amount,
      payment_method: paymentMethod.type,
      status: 'processing',
    });

    try {
      // Process payment with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: subscription.stripe_customer_id,
        payment_method: paymentMethod.stripe_payment_method_id,
        confirm: true,
        return_url: `${process.env.FRONTEND_URL}/subscription/payment-result`,
      });

      await payment.update({
        stripe_payment_intent_id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'processing',
        processed_at: new Date(),
      });

      if (paymentIntent.status === 'succeeded') {
        await subscription.update({
          last_payment_date: new Date(),
          last_payment_amount: amount,
          failure_count: 0,
        });
      }

      return { payment, paymentIntent };
    } catch (error) {
      await payment.update({
        status: 'failed',
        failure_code: (error as any).code,
        failure_message: (error as any).message,
        processed_at: new Date(),
      });

      // Increment failure count
      await subscription.update({
        failure_count: subscription.failure_count + 1,
      });

      throw error;
    }
  }

  // Webhook handling
  async handleStripeWebhook(event: any) {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  // Helper Methods
  async getOrCreateStripeCustomer(patient: any) {
    // Try to find existing customer
    const existingSubscription = await PatientSubscription.findOne({
      where: { 
        patient_id: patient.id,
        stripe_customer_id: { [Op.ne]: null }
      }
    });

    if (existingSubscription?.stripe_customer_id) {
      try {
        return await this.stripe.customers.retrieve(existingSubscription.stripe_customer_id);
      } catch (error) {
        console.log('Stripe customer not found, creating new one');
      }
    }

    // Create new customer
    return await this.stripe.customers.create({
      email: patient.email,
      name: `${patient.first_name} ${patient.last_name}`,
      phone: patient.phone,
      metadata: {
        patient_id: patient.id,
      },
    });
  }

  calculatePeriodEnd(startDate: any, billingCycle: any) {
    const endDate = new Date(startDate);
    
    switch (billingCycle) {
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }
    
    return endDate;
  }

  async handlePaymentSucceeded(invoice: any) {
    const subscription = await PatientSubscription.findOne({
      where: { stripe_subscription_id: invoice.subscription }
    });

    if (subscription) {
      await subscription.update({
        status: 'ACTIVE',
        last_payment_date: new Date(),
        last_payment_amount: invoice.amount_paid / 100,
        failure_count: 0,
      });
    }
  }

  async handlePaymentFailed(invoice: any) {
    const subscription = await PatientSubscription.findOne({
      where: { stripe_subscription_id: invoice.subscription }
    });

    if (subscription) {
      await subscription.update({
        status: 'PAST_DUE',
        failure_count: subscription.failure_count + 1,
      });
    }
  }

  async handleSubscriptionUpdated(stripeSubscription: any) {
    const subscription = await PatientSubscription.findOne({
      where: { stripe_subscription_id: stripeSubscription.id }
    });

    if (subscription) {
      await subscription.update({
        status: stripeSubscription.status.toUpperCase(),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString().split('T')[0],
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString().split('T')[0],
      });
    }
  }

  async handleSubscriptionDeleted(stripeSubscription: any) {
    const subscription = await PatientSubscription.findOne({
      where: { stripe_subscription_id: stripeSubscription.id }
    });

    if (subscription) {
      await subscription.update({
        status: 'CANCELLED',
        cancelled_at: new Date(),
      });
    }
  }
}

export default new SubscriptionService();