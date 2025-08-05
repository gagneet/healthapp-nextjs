// src/middleware/validation.js
import Joi from 'joi';

const validateRequest = (schema) => {
  return (req, res, next) => {
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

const validateQuery = (schema) => {
  return (req, res, next) => {
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
    middle_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).required(),
    email: Joi.string().email().optional(),
    mobile_number: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    gender: Joi.string().valid('m', 'f', 'o', '').optional(),
    dob: Joi.date().optional(),
    address: Joi.string().max(500).optional(),
    height_cm: Joi.number().min(0).max(300).optional(),
    weight_kg: Joi.number().min(0).max(1000).optional(),
    comorbidities: Joi.string().optional(),
    allergies: Joi.string().optional(),
    medical_record_number: Joi.string().max(100).optional(), // Allow custom patient ID in any format
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
        copay_amount: Joi.number().min(0).optional().allow(null),
        deductible_amount: Joi.number().min(0).optional().allow(null),
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
        copay_amount: Joi.number().min(0).optional().allow(null),
        deductible_amount: Joi.number().min(0).optional().allow(null),
        phone_number: Joi.string().optional().allow('') // Allow any format for insurance phone numbers
      }).optional().allow(null),
      
      // Additional insurance metadata
      coverage_type: Joi.string().valid('individual', 'family', 'employer', 'medicare', 'medicaid', 'other').optional().allow(''),
      notes: Joi.string().max(1000).optional().allow('')
    }).optional().allow(null),
    
    // Clinical/Treatment Plan fields (for care plan creation)
    symptoms: Joi.array().items(Joi.string().max(200)).optional().allow(null),
    diagnosis: Joi.array().items(Joi.string().max(200)).optional().allow(null),
    treatment: Joi.string().max(200).optional().allow(''),
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
    patient_id: Joi.string().required(),
    description: Joi.string().required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    appointment_type: Joi.string().required(),
    repeat_type: Joi.string().valid('none', 'daily', 'weekly', 'monthly').optional(),
    repeat_count: Joi.number().integer().min(1).optional()
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
