// src/routes/subscriptions.js
import express from 'express';
import subscriptionController from '../controllers/subscriptionController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { validateRequest, schemas } from '../middleware/validation.ts';
import { USER_CATEGORIES } from '../config/constants.ts';

const router = express.Router();

// Service Plan Management Routes
// POST /api/subscriptions/plans/provider/:providerId
router.post('/plans/provider/:providerId',
  authenticate,
  authorize(USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  validateRequest(schemas.servicePlanCreate),
  subscriptionController.createServicePlan
);

// GET /api/subscriptions/plans/provider/:providerId
router.get('/plans/provider/:providerId',
  authenticate,
  subscriptionController.getServicePlans
);

// PUT /api/subscriptions/plans/:planId
router.put('/plans/:planId',
  authenticate,
  authorize(USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  validateRequest(schemas.servicePlanUpdate),
  subscriptionController.updateServicePlan
);

// DELETE /api/subscriptions/plans/:planId
router.delete('/plans/:planId',
  authenticate,
  authorize(USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  subscriptionController.deleteServicePlan
);

// Subscription Management Routes
// POST /api/subscriptions
router.post('/',
  authenticate,
  validateRequest(schemas.subscriptionCreate),
  subscriptionController.createSubscription
);

// GET /api/subscriptions/patient/:patientId
router.get('/patient/:patientId',
  authenticate,
  subscriptionController.getPatientSubscriptions
);

// GET /api/subscriptions/provider/:providerId
router.get('/provider/:providerId',
  authenticate,
  authorize(USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  subscriptionController.getProviderSubscriptions
);

// PUT /api/subscriptions/:subscriptionId/cancel
router.put('/:subscriptionId/cancel',
  authenticate,
  validateRequest(schemas.subscriptionCancel),
  subscriptionController.cancelSubscription
);

// PUT /api/subscriptions/:subscriptionId/reactivate
router.put('/:subscriptionId/reactivate',
  authenticate,
  subscriptionController.reactivateSubscription
);

// Payment Method Management Routes
// POST /api/subscriptions/payment-methods/patient/:patientId
router.post('/payment-methods/patient/:patientId',
  authenticate,
  validateRequest(schemas.paymentMethodAdd),
  subscriptionController.addPaymentMethod
);

// GET /api/subscriptions/payment-methods/patient/:patientId
router.get('/payment-methods/patient/:patientId',
  authenticate,
  subscriptionController.getPaymentMethods
);

// DELETE /api/subscriptions/payment-methods/:paymentMethodId
router.delete('/payment-methods/:paymentMethodId',
  authenticate,
  subscriptionController.removePaymentMethod
);

// Payment Processing Routes
// POST /api/subscriptions/:subscriptionId/process-payment
router.post('/:subscriptionId/process-payment',
  authenticate,
  validateRequest(schemas.processPayment),
  subscriptionController.processPayment
);

// GET /api/subscriptions/payments/patient/:patientId
router.get('/payments/patient/:patientId',
  authenticate,
  subscriptionController.getPaymentHistory
);

// Stripe Webhook (no authentication required)
// POST /api/subscriptions/webhooks/stripe
router.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleStripeWebhook
);

export default router;