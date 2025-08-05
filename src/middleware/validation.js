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
    patient_id: Joi.string().max(100).optional() // Allow custom patient ID in any format
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
