// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { verifyToken, TokenPayload } from '../config/jwt.js';
import { User, UserRole, Doctor, Patient } from '../models/index.js';
import { USER_CATEGORIES, ACCOUNT_STATUS } from '../config/constants.js';
import cacheService from '../services/CacheService.js';
import { Request, Response, NextFunction } from 'express';

const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: false,
        statusCode: 401,
        payload: {
          error: {
            status: 'UNAUTHORIZED',
            message: 'Authentication token required'
          }
        }
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded: TokenPayload = verifyToken(token);
    
    // Check cache first for performance optimization (gracefully handle Redis failures)
    let user: any = null;
    try {
      user = await cacheService.getCachedUser(decoded.userId);
    } catch (cacheError) {
      // Ignore cache errors and continue with database lookup
    }
    
    if (!user) {
      // Only hit database if not in cache - simplified for testing
      user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'account_status']
        // Note: Temporarily removed UserRole association to test Dashboard
        // include: [{
        //   model: UserRole,
        //   as: 'roles',
        //   attributes: ['id', 'linked_with']
        // }]
      });
      
      if (user) {
        // Cache user data for 15 minutes to reduce database load (handle cache failures gracefully)
        try {
          await cacheService.cacheUser(decoded.userId, user.toJSON(), 900);
        } catch (cacheError) {
          // Ignore cache errors - authentication should still work
        }
      }
    }

    if (!user || user.account_status !== ACCOUNT_STATUS.ACTIVE) {
      res.status(401).json({
        status: false,
        statusCode: 401,
        payload: {
          error: {
            status: 'UNAUTHORIZED',
            message: 'Invalid or expired token'
          }
        }
      });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      userCategory: decoded.userCategory || user.role,
      userRoleId: decoded.userRoleId,
      permissions: decoded.permissions || []
    };
    req.userCategory = decoded.userCategory || user.role;
    next();
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Auth middleware error:', err.message);
    console.error('Token verification failed:', err.name);
    res.status(401).json({
      status: false,
      statusCode: 401,
      payload: {
        error: {
          status: 'UNAUTHORIZED',
          message: 'Invalid token'
        }
      }
    });
    return;
  }
};

const authorize = (...categories: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: false,
        statusCode: 401,
        payload: {
          error: {
            status: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        }
      });
      return;
    }

    if (!categories.includes(req.userCategory as string)) {
      res.status(403).json({
        status: false,
        statusCode: 403,
        payload: {
          error: {
            status: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        }
      });
      return;
    }

    next();
  };
};

/**
 * Enhanced authorization that validates role-specific profile completeness
 * Use this for routes that require complete doctor/patient profiles
 */
const authorizeWithProfile = (...categories: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          }
        });
        return;
      }

      if (!categories.includes(req.userCategory as string)) {
        res.status(403).json({
          status: false,
          statusCode: 403,
          payload: {
            error: {
              status: 'FORBIDDEN',
              message: 'Insufficient permissions'
            }
          }
        });
        return;
      }

      // Validate role-specific profiles
      if (req.userCategory === USER_CATEGORIES.DOCTOR) {
        const doctorRecord = await Doctor.findOne({
          where: { user_id: req.user!.userId }
        });

        if (!doctorRecord) {
          res.status(403).json({
            status: false,
            statusCode: 403,
            payload: {
              error: {
                status: 'PROFILE_INCOMPLETE',
                message: 'Doctor profile not found. Please complete your profile setup.'
              }
            }
          });
          return;
        }

        // Attach doctor record to request for downstream use
        (req as any).doctorProfile = doctorRecord;
      }

      if (req.userCategory === USER_CATEGORIES.PATIENT) {
        const patientRecord = await Patient.findOne({
          where: { user_id: req.user!.userId }
        });

        if (!patientRecord) {
          res.status(403).json({
            status: false,
            statusCode: 403,
            payload: {
              error: {
                status: 'PROFILE_INCOMPLETE',
                message: 'Patient profile not found. Please complete your profile setup.'
              }
            }
          });
          return;
        }

        // Attach patient record to request for downstream use
        (req as any).patientProfile = patientRecord;
      }

      next();
    } catch (error: unknown) {
      console.error('Profile validation error:', error);
      res.status(500).json({
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'INTERNAL_ERROR',
            message: 'Profile validation failed'
          }
        }
      });
      return;
    }
  };
};

export { authenticate, authorize, authorizeWithProfile };
