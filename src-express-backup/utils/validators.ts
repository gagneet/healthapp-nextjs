// src/utils/validators.ts
import Joi from 'joi';

class Validators {
  static validateEmail(email: string): boolean {
    const schema = Joi.string().email().required();
    const { error } = schema.validate(email);
    return !error;
  }

  static validateMobileNumber(mobile: string): boolean {
    const schema = Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required();
    const { error } = schema.validate(mobile);
    return !error;
  }

  static validatePassword(password: string): boolean {
    const schema = Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required();
    const { error } = schema.validate(password);
    return !error;
  }

  static validateDate(date: string | Date): boolean {
    const schema = Joi.date().iso().required();
    const { error } = schema.validate(date);
    return !error;
  }

  static validatePagination(query: any): any {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      search: Joi.string().optional(),
      sortBy: Joi.string().optional(),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    });

    const { error, value } = schema.validate(query);
    if (error) {
      throw new Error(error.details[0].message);
    }
    return value;
  }

  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    return input;
  }
}

export default Validators;
