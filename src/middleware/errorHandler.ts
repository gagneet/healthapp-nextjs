// src/middleware/errorHandler.js
import { createLogger } from './logger.ts';

const logger = createLogger(import.meta.url);

const errorHandler = (err: any, req: any, res: any, next: any) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      status: false,
      statusCode: 404,
      payload: {
        error: {
          status: 'NOT_FOUND',
          message
        }
      }
    };
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map((val: any) => val.message).join(', ');
    error = {
      status: false,
      statusCode: 400,
      payload: {
        error: {
          status: 'VALIDATION_ERROR',
          message
        }
      }
    };
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value entered';
    error = {
      status: false,
      statusCode: 400,
      payload: {
        error: {
          status: 'DUPLICATE_ERROR',
          message
        }
      }
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      status: false,
      statusCode: 401,
      payload: {
        error: {
          status: 'UNAUTHORIZED',
          message
        }
      }
    };
  }

  // Default error response
  res.status(error.statusCode || 500).json(
    error.payload || {
      status: false,
      statusCode: error.statusCode || 500,
      payload: {
        error: {
          status: 'INTERNAL_ERROR',
          message: error.message || 'Server Error'
        }
      }
    }
  );
};

export default errorHandler;
