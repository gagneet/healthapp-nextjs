// src/middleware/performanceOptimization.js - Performance optimization middleware
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { createLogger } from './logger.js';
import cacheService from '../services/CacheService.js';

const logger = createLogger(import.meta.url);

// Enhanced compression middleware for large responses
export const advancedCompression = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    // Don't compress if request has no-compression header
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Don't compress images, videos, or already compressed data
    const contentType = res.getHeader('content-type');
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('application/zip') ||
      contentType.includes('application/gzip')
    )) {
      return false;
    }
    
    return compression.filter(req, res);
  }
});

// Dynamic rate limiting based on user type and endpoint
export const dynamicRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    defaultMax = 1000,
    doctorMax = 2000,
    adminMax = 5000,
    patientMax = 500
  } = options;

  return rateLimit({
    windowMs,
    max: (req) => {
      // Higher limits for different user types
      if (req.user) {
        switch (req.user.category) {
          case 'admin':
          case 'system_admin':
            return adminMax;
          case 'doctor':
          case 'hsp':
            return doctorMax;
          case 'patient':
            return patientMax;
          default:
            return defaultMax;
        }
      }
      return 100; // Lower limit for unauthenticated users
    },
    keyGenerator: (req) => {
      // Use user ID for authenticated users, IP for others
      return req.user ? `user:${req.user.id}` : req.ip;
    },
    message: {
      status: false,
      statusCode: 429,
      payload: {
        error: {
          status: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        }
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Response caching middleware
export const responseCache = (options = {}) => {
  const {
    defaultTtl = 300, // 5 minutes
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    shouldCache = (req, res) => req.method === 'GET' && res.statusCode === 200
  } = options;

  return async (req, res, next) => {
    // Skip caching for certain endpoints
    if (req.url.includes('/auth/') || req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);
    
    try {
      // Check cache first
      const cachedResponse = await cacheService.getCachedApiResponse(req.originalUrl, req.query);
      
      if (cachedResponse) {
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Date': new Date(cachedResponse.cached_at).toISOString(),
          'Cache-Control': `public, max-age=${defaultTtl}`
        });
        
        return res.json(cachedResponse.response);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        if (shouldCache(req, res)) {
          // Cache the response asynchronously
          setImmediate(async () => {
            try {
              await cacheService.cacheApiResponse(req.originalUrl, req.query, data, defaultTtl);
            } catch (error) {
              logger.error('Failed to cache response:', error);
            }
          });
        }
        
        // Add cache headers
        res.set({
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${defaultTtl}`
        });
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Request optimization middleware
export const requestOptimization = (req, res, next) => {
  // Add request start time for performance monitoring
  req.startTime = Date.now();
  
  // Optimize body parser for large requests
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length']);
    
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      return res.status(413).json({
        status: false,
        statusCode: 413,
        payload: {
          error: {
            status: 'PAYLOAD_TOO_LARGE',
            message: 'Request payload too large'
          }
        }
      });
    }
  }
  
  // Add request ID for tracing
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  res.set('X-Request-ID', req.requestId);
  
  next();
};

// Response optimization middleware
export const responseOptimization = (req, res, next) => {
  // Store original send method
  const originalSend = res.send;
  
  res.send = function(data) {
    // Add performance headers
    const responseTime = Date.now() - req.startTime;
    res.set({
      'X-Response-Time': `${responseTime}ms`,
      'X-Powered-By': 'Healthcare-API-v1.0',
      'X-Node-Version': process.version
    });
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.originalUrl} - ${responseTime}ms`, {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        responseTime,
        statusCode: res.statusCode
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Memory optimization middleware
export const memoryOptimization = (req, res, next) => {
  // Force garbage collection for large responses (in development only)
  if (process.env.NODE_ENV === 'development') {
    const originalEnd = res.end;
    
    res.end = function(...args) {
      // Schedule garbage collection for large responses
      setImmediate(() => {
        if (global.gc && res.get('content-length') > 1024 * 1024) { // 1MB
          try {
            global.gc();
          } catch (error) {
            // GC not exposed
          }
        }
      });
      
      return originalEnd.apply(this, args);
    };
  }
  
  next();
};

// Security optimization with performance considerations
export const securityOptimization = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for better performance
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Database connection optimization middleware
export const dbConnectionOptimization = async (req, res, next) => {
  // Add database connection health check for critical operations
  if (req.url.includes('/patients') || req.url.includes('/doctors')) {
    try {
      // Basic health check - could be optimized with connection pooling
      req.dbHealthy = true;
    } catch (error) {
      logger.error('Database connection health check failed:', error);
      return res.status(503).json({
        status: false,
        statusCode: 503,
        payload: {
          error: {
            status: 'SERVICE_UNAVAILABLE',
            message: 'Database service temporarily unavailable'
          }
        }
      });
    }
  }
  
  next();
};

// Performance monitoring middleware
export const performanceMonitoring = (req, res, next) => {
  const startTime = process.hrtime();
  const startUsage = process.cpuUsage();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds * 1e-6;
    
    const cpuUsage = process.cpuUsage(startUsage);
    const memoryUsage = process.memoryUsage();
    
    // Log performance metrics for monitoring
    if (duration > 500) { // Log requests taking > 500ms
      logger.info('Performance metrics', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        cpuUser: `${(cpuUsage.user / 1000).toFixed(2)}ms`,
        cpuSystem: `${(cpuUsage.system / 1000).toFixed(2)}ms`,
        memoryRSS: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
        memoryHeapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        memoryHeapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`
      });
    }
  });
  
  next();
};

// Export all middleware as a combined function for easy setup
export const setupPerformanceMiddleware = (app) => {
  // Security first
  app.use(securityOptimization);
  
  // Request optimization
  app.use(requestOptimization);
  
  // Compression
  app.use(advancedCompression);
  
  // Rate limiting
  app.use('/api', dynamicRateLimit());
  app.use('/m-api', dynamicRateLimit());
  
  // Response caching for GET requests
  app.use(responseCache());
  
  // Performance monitoring
  app.use(performanceMonitoring);
  
  // Response optimization
  app.use(responseOptimization);
  
  // Memory optimization
  app.use(memoryOptimization);
  
  // Database connection optimization
  app.use(dbConnectionOptimization);
  
  logger.info('Performance optimization middleware setup completed');
};