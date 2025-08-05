// src/controllers/subscriptionController.js
import { ServicePlan, PatientSubscription, Payment, PaymentMethod, Patient, HealthcareProvider } from '../models/index.js';
import { Op } from 'sequelize';
import SubscriptionService from '../services/SubscriptionService.js';

class SubscriptionController {
  // Service Plan Management
  async createServicePlan(req, res, next) {
    try {
      const { providerId } = req.params;
      const planData = req.body;

      // Use current user's provider ID if not specified and user is provider
      const targetProviderId = providerId || (req.userCategory === 'hsp' ? req.user.provider_id : null);

      if (!targetProviderId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Provider ID is required'
            }
          }
        });
      }

      const servicePlan = await SubscriptionService.createServicePlan(targetProviderId, planData);

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { servicePlan },
          message: 'Service plan created successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getServicePlans(req, res, next) {
    try {
      const { providerId } = req.params;
      const { is_active, limit, offset } = req.query;

      const targetProviderId = providerId || (req.userCategory === 'hsp' ? req.user.provider_id : null);

      if (!targetProviderId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Provider ID is required'
            }
          }
        });
      }

      const plans = await SubscriptionService.getServicePlans(targetProviderId, {
        is_active: is_active !== undefined ? is_active === 'true' : null,
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { plans },
          message: 'Service plans retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateServicePlan(req, res, next) {
    try {
      const { planId } = req.params;
      const updateData = req.body;

      const servicePlan = await SubscriptionService.updateServicePlan(planId, updateData);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { servicePlan },
          message: 'Service plan updated successfully'
        }
      });
    } catch (error) {
      if (error.message === 'Service plan not found') {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: error.message
            }
          }
        });
      }
      next(error);
    }
  }

  async deleteServicePlan(req, res, next) {
    try {
      const { planId } = req.params;

      const servicePlan = await ServicePlan.findByPk(planId);
      if (!servicePlan) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'Service plan not found'
            }
          }
        });
      }

      // Check if plan has active subscriptions
      const activeSubscriptions = await PatientSubscription.count({
        where: { 
          service_plan_id: planId,
          status: { [Op.in]: ['ACTIVE', 'TRIALING'] }
        }
      });

      if (activeSubscriptions > 0) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Cannot delete service plan with active subscriptions'
            }
          }
        });
      }

      await servicePlan.destroy();

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Service plan deleted successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Subscription Management
  async createSubscription(req, res, next) {
    try {
      const { patientId, providerId, servicePlanId, paymentMethodId } = req.body;

      const subscription = await SubscriptionService.createSubscription(
        patientId,
        providerId,
        servicePlanId,
        paymentMethodId
      );

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { subscription },
          message: 'Subscription created successfully'
        }
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: error.message
            }
          }
        });
      }
      if (error.message.includes('Payment processing failed')) {
        return res.status(402).json({
          status: false,
          statusCode: 402,
          payload: {
            error: {
              status: 'PAYMENT_REQUIRED',
              message: error.message
            }
          }
        });
      }
      next(error);
    }
  }

  async getPatientSubscriptions(req, res, next) {
    try {
      const { patientId } = req.params;
      const { status, limit, offset } = req.query;

      const targetPatientId = patientId || (req.userCategory === 'patient' ? req.user.id : null);

      if (!targetPatientId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Patient ID is required'
            }
          }
        });
      }

      const whereClause = { patient_id: targetPatientId };
      if (status) {
        whereClause.status = status.toUpperCase();
      }

      const subscriptions = await PatientSubscription.findAll({
        where: whereClause,
        include: [
          {
            model: ServicePlan,
            as: 'servicePlan'
          },
          {
            model: HealthcareProvider,
            as: 'provider'
          }
        ],
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { subscriptions },
          message: 'Subscriptions retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProviderSubscriptions(req, res, next) {
    try {
      const { providerId } = req.params;
      const { status, limit, offset } = req.query;

      const targetProviderId = providerId || (req.userCategory === 'hsp' ? req.user.provider_id : null);

      if (!targetProviderId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Provider ID is required'
            }
          }
        });
      }

      const whereClause = { provider_id: targetProviderId };
      if (status) {
        whereClause.status = status.toUpperCase();
      }

      const subscriptions = await PatientSubscription.findAll({
        where: whereClause,
        include: [
          {
            model: Patient,
            as: 'patient'
          },
          {
            model: ServicePlan,
            as: 'servicePlan'
          }
        ],
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { subscriptions },
          message: 'Provider subscriptions retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(req, res, next) {
    try {
      const { subscriptionId } = req.params;
      const { cancelReason, cancelAtPeriodEnd = true } = req.body;

      const subscription = await SubscriptionService.cancelSubscription(
        subscriptionId,
        cancelReason,
        cancelAtPeriodEnd
      );

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { subscription },
          message: 'Subscription cancelled successfully'
        }
      });
    } catch (error) {
      if (error.message === 'Subscription not found') {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: error.message
            }
          }
        });
      }
      next(error);
    }
  }

  async reactivateSubscription(req, res, next) {
    try {
      const { subscriptionId } = req.params;

      const subscription = await SubscriptionService.reactivateSubscription(subscriptionId);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { subscription },
          message: 'Subscription reactivated successfully'
        }
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('cannot be reactivated')) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: error.message
            }
          }
        });
      }
      next(error);
    }
  }

  // Payment Method Management
  async addPaymentMethod(req, res, next) {
    try {
      const { patientId } = req.params;
      const { stripePaymentMethodId, setAsDefault = false } = req.body;

      const targetPatientId = patientId || (req.userCategory === 'patient' ? req.user.id : null);

      if (!targetPatientId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Patient ID is required'
            }
          }
        });
      }

      const paymentMethod = await SubscriptionService.addPaymentMethod(
        targetPatientId,
        stripePaymentMethodId,
        setAsDefault
      );

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: { paymentMethod },
          message: 'Payment method added successfully'
        }
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: error.message
            }
          }
        });
      }
      next(error);
    }
  }

  async getPaymentMethods(req, res, next) {
    try {
      const { patientId } = req.params;

      const targetPatientId = patientId || (req.userCategory === 'patient' ? req.user.id : null);

      if (!targetPatientId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Patient ID is required'
            }
          }
        });
      }

      const paymentMethods = await PaymentMethod.findAll({
        where: { 
          patient_id: targetPatientId,
          is_active: true
        },
        order: [['is_default', 'DESC'], ['created_at', 'DESC']]
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { paymentMethods },
          message: 'Payment methods retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async removePaymentMethod(req, res, next) {
    try {
      const { paymentMethodId } = req.params;

      await SubscriptionService.removePaymentMethod(paymentMethodId);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Payment method removed successfully'
        }
      });
    } catch (error) {
      if (error.message === 'Payment method not found') {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: error.message
            }
          }
        });
      }
      next(error);
    }
  }

  // Payment Processing
  async processPayment(req, res, next) {
    try {
      const { subscriptionId } = req.params;
      const { amount, paymentMethodId } = req.body;

      const result = await SubscriptionService.processPayment(subscriptionId, amount, paymentMethodId);

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: result,
          message: 'Payment processed successfully'
        }
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: error.message
            }
          }
        });
      }
      if (error.code && error.code.startsWith('card_')) {
        return res.status(402).json({
          status: false,
          statusCode: 402,
          payload: {
            error: {
              status: 'PAYMENT_FAILED',
              message: error.message,
              code: error.code
            }
          }
        });
      }
      next(error);
    }
  }

  async getPaymentHistory(req, res, next) {
    try {
      const { patientId } = req.params;
      const { limit, offset, status } = req.query;

      const targetPatientId = patientId || (req.userCategory === 'patient' ? req.user.id : null);

      if (!targetPatientId) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Patient ID is required'
            }
          }
        });
      }

      const whereClause = { patient_id: targetPatientId };
      if (status) {
        whereClause.status = status;
      }

      const payments = await Payment.findAll({
        where: whereClause,
        include: [
          {
            model: PatientSubscription,
            as: 'subscription',
            include: [
              {
                model: ServicePlan,
                as: 'servicePlan'
              }
            ]
          }
        ],
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: { payments },
          message: 'Payment history retrieved successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Webhook endpoint for Stripe
  async handleStripeWebhook(req, res, next) {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      await SubscriptionService.handleStripeWebhook(event);

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}

export default new SubscriptionController();