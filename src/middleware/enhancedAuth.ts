// src/middleware/enhancedAuth.js - Enhanced JWT Authentication with Refresh Tokens
import jwt from 'jsonwebtoken';
import { User, UserRole, Doctor, Patient } from '../models/index.js';
import { USER_CATEGORIES, ACCOUNT_STATUS } from '../config/constants.js';
import cacheService from '../services/CacheService.js';
import ResponseFormatter from '../utils/responseFormatter.js';

// Token blacklist - in production, this should be Redis
const tokenBlacklist = new Set();
const refreshTokens = new Map(); // Store refresh tokens with user info
const activeSessions = new Map(); // Track active sessions

// Enhanced token generation with refresh token support
export const generateTokens = async (user, userRole, deviceInfo = {}) => {
  const currentTime = Math.floor(Date.now() / 1000);
  
  const payload = {
    userId: user.id,
    userRoleId: userRole?.id,
    email: user.email,
    role: user.role,
    category: user.role, // For compatibility
    iat: currentTime,
    // Security context
    deviceInfo: {
      ip: deviceInfo.ip,
      userAgent: deviceInfo.userAgent?.substring(0, 200) // Limit size
    }
  };
  
  // Generate access token (15 minutes)
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
  
  // Generate refresh token (7 days)
  const refreshPayload = {
    userId: user.id,
    userRoleId: userRole?.id,
    type: 'refresh',
    iat: currentTime
  };
  
  const refreshToken = jwt.sign(
    refreshPayload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Store refresh token metadata
  refreshTokens.set(refreshToken, {
    userId: user.id,
    userRoleId: userRole?.id,
    createdAt: new Date(),
    lastUsed: new Date(),
    deviceInfo
  });
  
  // Track active session
  const sessionId = `${user.id}_${Date.now()}`;
  activeSessions.set(sessionId, {
    userId: user.id,
    accessToken,
    refreshToken,
    createdAt: new Date(),
    deviceInfo
  });
  
  return { 
    accessToken, 
    refreshToken, 
    sessionId,
    expiresIn: 900, // 15 minutes in seconds
    refreshExpiresIn: 604800 // 7 days in seconds
  };
};

// Enhanced authentication middleware
export const enhancedAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(ResponseFormatter.error(
        {
          status: 'UNAUTHORIZED',
          message: 'Authentication token required',
          code: 'MISSING_TOKEN'
        },
        401
      ));
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json(ResponseFormatter.error(
        {
          status: 'UNAUTHORIZED',
          message: 'Token has been revoked',
          code: 'TOKEN_REVOKED'
        },
        401
      ));
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      let errorCode = 'INVALID_TOKEN';
      let message = 'Invalid token';
      
      if (jwtError.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        message = 'Token has expired';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorCode = 'MALFORMED_TOKEN';
        message = 'Malformed token';
      }
      
      return res.status(401).json(ResponseFormatter.error(
        {
          status: 'UNAUTHORIZED',
          message,
          code: errorCode
        },
        401
      ));
    }
    
    // Check cache first for performance
    let user = null;
    try {
      user = await cacheService.getCachedUser(decoded.userId);
    } catch (cacheError) {
      // Ignore cache errors and continue with database lookup
    }
    
    if (!user) {
      // Fetch user with roles
      user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'account_status', 'is_active'],
        include: [{
          model: UserRole,
          as: 'roles',
          attributes: ['id', 'linked_with']
        }]
      });
      
      if (user) {
        try {
          await cacheService.cacheUser(decoded.userId, user.toJSON(), 900); // 15 minutes
        } catch (cacheError) {
          // Ignore cache errors
        }
      }
    }

    if (!user || user.account_status !== ACCOUNT_STATUS.ACTIVE || !user.is_active) {
      return res.status(401).json(ResponseFormatter.error(
        {
          status: 'UNAUTHORIZED',
          message: 'Account is inactive or not found',
          code: 'INACTIVE_ACCOUNT'
        },
        401
      ));
    }

    // Add enhanced context to request
    req.user = user;
    req.userCategory = decoded.role || user.role;
    req.userRoleId = decoded.userRoleId;
    req.tokenData = decoded;
    req.currentToken = token;
    
    // Log authentication event (in production, this should be async)
    logAuthEvent('TOKEN_VERIFIED', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
    
    next();
  } catch (error) {
    console.error('Enhanced auth middleware error:', error);
    return res.status(500).json(ResponseFormatter.error(
      {
        status: 'INTERNAL_ERROR',
        message: 'Authentication service error',
        code: 'AUTH_SERVICE_ERROR'
      },
      500
    ));
  }
};

// Refresh token endpoint handler
export const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json(ResponseFormatter.error(
        {
          status: 'BAD_REQUEST',
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        },
        400
      ));
    }
    
    // Check if refresh token exists in our store
    const tokenData = refreshTokens.get(refreshToken);
    if (!tokenData) {
      return res.status(401).json(ResponseFormatter.error(
        {
          status: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        },
        401
      ));
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (jwtError) {
      // Remove invalid refresh token
      refreshTokens.delete(refreshToken);
      
      return res.status(401).json(ResponseFormatter.error(
        {
          status: 'UNAUTHORIZED',
          message: 'Refresh token expired or invalid',
          code: 'REFRESH_TOKEN_EXPIRED'
        },
        401
      ));
    }
    
    // Get user data
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: UserRole,
        as: 'roles',
        attributes: ['id', 'linked_with']
      }]
    });
    
    if (!user || user.account_status !== ACCOUNT_STATUS.ACTIVE) {
      refreshTokens.delete(refreshToken);
      return res.status(401).json(ResponseFormatter.error(
        {
          status: 'UNAUTHORIZED',
          message: 'User account not found or inactive',
          code: 'USER_NOT_FOUND'
        },
        401
      ));
    }
    
    // Generate new tokens
    const deviceInfo = {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    const userRole = user.roles?.[0];
    const tokens = await generateTokens(user, userRole, deviceInfo);
    
    // Remove old refresh token and store new one
    refreshTokens.delete(refreshToken);
    
    // Update token usage
    const newTokenData = refreshTokens.get(tokens.refreshToken);
    if (newTokenData) {
      newTokenData.lastUsed = new Date();
    }
    
    // Log refresh event
    logAuthEvent('TOKEN_REFRESHED', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
    
    res.status(200).json(ResponseFormatter.success(
      {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn
        },
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          account_status: user.account_status
        }
      },
      'Token refreshed successfully'
    ));
    
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json(ResponseFormatter.error(
      {
        status: 'INTERNAL_ERROR',
        message: 'Token refresh failed',
        code: 'REFRESH_SERVICE_ERROR'
      },
      500
    ));
  }
};

// Enhanced logout with token revocation
export const enhancedLogout = async (req, res) => {
  try {
    const token = req.currentToken;
    const { refreshToken, logoutAll = false } = req.body;
    
    // Add current token to blacklist
    if (token) {
      tokenBlacklist.add(token);
    }
    
    // Remove refresh token
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }
    
    // If logout all sessions, remove all user's refresh tokens
    if (logoutAll && req.user) {
      for (const [token, data] of refreshTokens.entries()) {
        if (data.userId === req.user.id) {
          refreshTokens.delete(token);
        }
      }
      
      // Remove all active sessions for user
      for (const [sessionId, sessionData] of activeSessions.entries()) {
        if (sessionData.userId === req.user.id) {
          tokenBlacklist.add(sessionData.accessToken);
          activeSessions.delete(sessionId);
        }
      }
    }
    
    // Log logout event
    if (req.user) {
      logAuthEvent('USER_LOGOUT', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        logoutAll,
        timestamp: new Date()
      });
    }
    
    res.status(200).json(ResponseFormatter.success(
      null,
      logoutAll ? 'Logged out from all devices' : 'Logged out successfully'
    ));
    
  } catch (error) {
    console.error('Enhanced logout error:', error);
    return res.status(500).json(ResponseFormatter.error(
      {
        status: 'INTERNAL_ERROR',
        message: 'Logout failed',
        code: 'LOGOUT_SERVICE_ERROR'
      },
      500
    ));
  }
};

// Token validation endpoint
export const validateToken = async (req, res) => {
  try {
    // If we reach here, token is valid (middleware passed)
    const user = req.user;
    
    res.status(200).json(ResponseFormatter.success(
      {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          account_status: user.account_status
        },
        tokenData: {
          userId: req.tokenData.userId,
          role: req.tokenData.role,
          iat: req.tokenData.iat,
          exp: req.tokenData.exp
        }
      },
      'Token is valid'
    ));
    
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json(ResponseFormatter.error(
      {
        status: 'INTERNAL_ERROR',
        message: 'Token validation failed',
        code: 'VALIDATION_SERVICE_ERROR'
      },
      500
    ));
  }
};

// Get active sessions
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userSessions = [];
    
    for (const [sessionId, sessionData] of activeSessions.entries()) {
      if (sessionData.userId === userId) {
        userSessions.push({
          sessionId,
          createdAt: sessionData.createdAt,
          deviceInfo: sessionData.deviceInfo,
          isCurrentSession: sessionData.accessToken === req.currentToken
        });
      }
    }
    
    res.status(200).json(ResponseFormatter.success(
      { sessions: userSessions },
      'Active sessions retrieved'
    ));
    
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json(ResponseFormatter.error(
      {
        status: 'INTERNAL_ERROR',
        message: 'Failed to retrieve sessions',
        code: 'SESSIONS_SERVICE_ERROR'
      },
      500
    ));
  }
};

// Simple audit logging (in production, use proper logging service)
const logAuthEvent = (event, data) => {
  try {
    console.log('AUTH_EVENT:', {
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
    // In production: send to logging service, database, or audit system
  } catch (error) {
    console.error('Auth logging error:', error);
  }
};

// Cleanup expired tokens (should be run periodically)
export const cleanupExpiredTokens = () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Clean up expired refresh tokens
  for (const [token, data] of refreshTokens.entries()) {
    if (data.createdAt < sevenDaysAgo) {
      refreshTokens.delete(token);
    }
  }
  
  // Clean up old sessions
  for (const [sessionId, sessionData] of activeSessions.entries()) {
    if (sessionData.createdAt < sevenDaysAgo) {
      activeSessions.delete(sessionId);
    }
  }
  
  console.log('Token cleanup completed');
};

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

export default {
  enhancedAuthenticate,
  generateTokens,
  refreshTokenHandler,
  enhancedLogout,
  validateToken,
  getActiveSessions,
  cleanupExpiredTokens
};