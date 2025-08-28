// src/middleware/validation.js
import Joi from 'joi';

const validateRequest = (schema: any) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        status: false,
        statusCode: 400,
        payload: {
          error: {
            status: 'VALIDATION_ERROR',
            message: errorMessage,
            details: error.details
          }
        }
      });
    }
    
    next();
  };
};

const validateQuery = (schema: any) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        status: false,
        statusCode: 400,
        payload: {
          error: {
            status: 'VALIDATION_ERROR',
            message: errorMessage,
            details: error.details
          }
        }
      });
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    remember_me: Joi.boolean().optional()
  }),
  
  patientCreate: Joi.object({
    first_name: Joi.string().max(100).required(),
    middle_name: Joi.string().max(100).optional().allow(''),
    last_name: Joi.string().max(100).required(),
    email: Joi.string().email().optional().allow(''),
    mobile_number: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    gender: Joi.string().valid('m', 'f', 'o', '').optional(),
    dob: Joi.date().required(),
    address: Joi.string().max(500).optional().allow(''),
    height_cm: Joi.number().min(0).max(300).optional().allow(null, ''),
    weight_kg: Joi.number().min(0).max(1000).optional().allow(null, ''),
    comorbidities: Joi.string().optional().allow(''),
    allergies: Joi.string().optional().allow(''),
    medical_record_number: Joi.string().max(100).optional().allow(''), // Allow custom patient ID in any format
    emergency_contacts: Joi.array().items(
      Joi.object({
        contact_number: Joi.string().optional().allow(''), // Allow any format for emergency contact numbers
        other_details: Joi.string().max(500).optional().allow(''),
        name: Joi.string().max(200).optional().allow(''),
        relationship: Joi.string().max(100).optional().allow('')
      })
    ).optional().allow(null), // Allow emergency_contacts to be null or optional
    
    insurance_information: Joi.object({
      // Primary Insurance
      primary: Joi.object({
        insurance_company: Joi.string().max(200).optional().allow(''),
        policy_number: Joi.string().max(50).optional().allow(''),
        group_number: Joi.string().max(50).optional().allow(''),
        member_id: Joi.string().max(50).optional().allow(''),
        subscriber_name: Joi.string().max(200).optional().allow(''),
        relationship_to_subscriber: Joi.string().valid('self', 'spouse', 'child', 'parent', 'other').optional().allow(''),
        effective_date: Joi.date().optional().allow(null, ''),
        expiration_date: Joi.date().optional().allow(null, ''),
        copay_amount: Joi.number().min(0).optional().allow(null, ''),
        deductible_amount: Joi.number().min(0).optional().allow(null, ''),
        phone_number: Joi.string().optional().allow('') // Allow any format for insurance phone numbers
      }).optional().allow(null),
      
      // Secondary Insurance (optional)
      secondary: Joi.object({
        insurance_company: Joi.string().max(200).optional().allow(''),
        policy_number: Joi.string().max(50).optional().allow(''),
        group_number: Joi.string().max(50).optional().allow(''),
        member_id: Joi.string().max(50).optional().allow(''),
        subscriber_name: Joi.string().max(200).optional().allow(''),
        relationship_to_subscriber: Joi.string().valid('self', 'spouse', 'child', 'parent', 'other').optional().allow(''),
        effective_date: Joi.date().optional().allow(null, ''),
        expiration_date: Joi.date().optional().allow(null, ''),
        copay_amount: Joi.number().min(0).optional().allow(null, ''),
        deductible_amount: Joi.number().min(0).optional().allow(null, ''),
        phone_number: Joi.string().optional().allow('') // Allow any format for insurance phone numbers
      }).optional().allow(null),
      
      // Additional insurance metadata
      coverage_type: Joi.string().valid('individual', 'family', 'employer', 'medicare', 'medicaid', 'other').optional().allow(''),
      notes: Joi.string().max(1000).optional().allow('')
    }).optional().allow(null),
    
    // Clinical/Treatment Plan fields (for care plan creation) - now making these required based on user request
    symptoms: Joi.array().items(Joi.string().max(200)).required(),
    diagnosis: Joi.array().items(Joi.string().max(200)).required(),
    treatment: Joi.string().max(200).required(),
    clinical_notes: Joi.string().max(5000).optional().allow(''),
    condition: Joi.string().max(500).optional().allow(''),
    severity: Joi.string().valid('Mild', 'Moderate', 'Severe', '').optional().allow('')
  }),
  
  medicationCreate: Joi.object({
    medicine_id: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required(),
    strength: Joi.string().required(),
    unit: Joi.string().required(),
    when_to_take: Joi.string().required(),
    repeat_type: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    instructions: Joi.string().optional()
  }),
  
  appointmentCreate: Joi.object({
    patientId: Joi.string().required(),
    description: Joi.string().required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    appointment_type: Joi.string().required(),
    repeat_type: Joi.string().valid('none', 'daily', 'weekly', 'monthly').optional(),
    repeat_count: Joi.number().integer().min(1).optional(),
    slot_id: Joi.string().uuid().optional()
  }),

  doctorAvailability: Joi.object({
    day_of_week: Joi.number().integer().min(0).max(6).required(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    slot_duration: Joi.number().integer().min(15).max(240).optional(),
    max_appointments_per_slot: Joi.number().integer().min(1).max(10).optional(),
    break_start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    break_end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
  }),

  appointmentReschedule: Joi.object({
    start_time: Joi.date().required(),
    end_time: Joi.date().required(),
    slot_id: Joi.string().uuid().optional()
  }),

  appointmentUpdate: Joi.object({
    description: Joi.string().optional(),
    status: Joi.string().valid('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show').optional(),
    notes: Joi.string().optional(),
    details: Joi.object().optional()
  }),

  // Subscription management schemas
  servicePlanCreate: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    service_type: Joi.string().max(100).optional(),
    price: Joi.number().positive().required(),
    currency: Joi.string().length(3).default('USD').optional(),
    billing_cycle: Joi.string().valid('weekly', 'monthly', 'yearly', 'one-time').required(),
    features: Joi.array().items(Joi.string()).optional(),
    patient_limit: Joi.number().integer().min(1).optional(),
    trial_period_days: Joi.number().integer().min(0).max(365).optional(),
    setup_fee: Joi.number().min(0).optional()
  }),

  servicePlanUpdate: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional(),
    service_type: Joi.string().max(100).optional(),
    price: Joi.number().positive().optional(),
    billing_cycle: Joi.string().valid('weekly', 'monthly', 'yearly', 'one-time').optional(),
    features: Joi.array().items(Joi.string()).optional(),
    patient_limit: Joi.number().integer().min(1).optional(),
    trial_period_days: Joi.number().integer().min(0).max(365).optional(),
    setup_fee: Joi.number().min(0).optional(),
    is_active: Joi.boolean().optional()
  }),

  subscriptionCreate: Joi.object({
    patientId: Joi.string().uuid().required(),
    providerId: Joi.string().uuid().required(),
    servicePlanId: Joi.string().uuid().required(),
    paymentMethodId: Joi.string().uuid().optional()
  }),

  subscriptionCancel: Joi.object({
    cancelReason: Joi.string().max(255).optional(),
    cancelAtPeriodEnd: Joi.boolean().default(true).optional()
  }),

  paymentMethodAdd: Joi.object({
    stripePaymentMethodId: Joi.string().required(),
    setAsDefault: Joi.boolean().default(false).optional()
  }),

  processPayment: Joi.object({
    amount: Joi.number().positive().required(),
    paymentMethodId: Joi.string().uuid().optional()
  }),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

export { validateRequest, validateQuery, schemas };
