// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { verifyToken } from '../config/jwt.js';
import { User, UserRole } from '../models/index.js';
import { USER_CATEGORIES } from '../config/constants.js';

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
    
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: UserRole,
        as: 'roles'
      }]
    });

    if (!user || user.account_status !== 'active') {
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
    req.userCategory = decoded.userCategory;
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
