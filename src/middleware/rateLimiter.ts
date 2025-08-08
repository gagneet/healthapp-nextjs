// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

const createRateLimiter = (windowMs: any, max: any, message: any) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: false,
      statusCode: 429,
      payload: {
        error: {
          status: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests, please try again later'
        }
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiter
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

// Auth endpoints rate limiter
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs for auth
  'Too many authentication attempts, please try again later'
);

export default generalLimiter;
export { authLimiter };
