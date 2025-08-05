// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { verifyToken } from '../config/jwt.js';
import { User, UserRole } from '../models/index.js';
import { USER_CATEGORIES, ACCOUNT_STATUS } from '../config/constants.js';
import cacheService from '../services/CacheService.js';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: false,
        statusCode: 401,
        payload: {
          error: {
            status: 'UNAUTHORIZED',
            message: 'Authentication token required'
          }
        }
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Check cache first for performance optimization (gracefully handle Redis failures)
    let user = null;
    try {
      user = await cacheService.getCachedUser(decoded.userId);
    } catch (cacheError) {
      // Ignore cache errors and continue with database lookup
    }
    
    if (!user) {
      // Only hit database if not in cache
      user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'email', 'first_name', 'last_name', 'category', 'account_status'],
        include: [{
          model: UserRole,
          as: 'roles',
          attributes: ['id', 'linked_with']
        }]
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
      return res.status(401).json({
        status: false,
        statusCode: 401,
        payload: {
          error: {
            status: 'UNAUTHORIZED',
            message: 'Invalid or expired token'
          }
        }
      });
    }

    req.user = user;
    req.userCategory = decoded.userCategory || user.category;
    req.userRoleId = decoded.userRoleId;
    next();
  } catch (error) {
    return res.status(401).json({
      status: false,
      statusCode: 401,
      payload: {
        error: {
          status: 'UNAUTHORIZED',
          message: 'Invalid token'
        }
      }
    });
  }
};

const authorize = (...categories) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        statusCode: 401,
        payload: {
          error: {
            status: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        }
      });
    }

    if (!categories.includes(req.userCategory)) {
      return res.status(403).json({
        status: false,
        statusCode: 403,
        payload: {
          error: {
            status: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        }
      });
    }

    next();
  };
};

export { authenticate, authorize };
