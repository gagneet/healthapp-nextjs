/**
 * Authentication Helpers for Next.js API Routes
 * 
 * These utilities handle JWT token verification and user authentication
 * in a way that's safe for Next.js webpack builds.
 */

import { NextRequest } from 'next/server';

// JWT verification will be done dynamically to avoid webpack issues
let jwt: any = null;

async function initializeJWT() {
  if (!jwt) {
    jwt = (await import('jsonwebtoken')).default;
  }
  return jwt;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Verify JWT token and extract user information
 */
export async function verifyAuthToken(token: string): Promise<any> {
  try {
    const jwtLib = await initializeJWT();
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const decoded = jwtLib.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<any> {
  const token = extractToken(request);
  
  if (!token) {
    return null;
  }
  
  return await verifyAuthToken(token);
}

/**
 * Check if user has required role/permission
 */
export function hasRole(user: any, allowedRoles: string[]): boolean {
  if (!user || !user.role) {
    return false;
  }
  
  return allowedRoles.includes(user.role) || allowedRoles.includes(user.category);
}

/**
 * Authentication middleware for API routes
 */
export async function requireAuth(request: NextRequest, allowedRoles?: string[]) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      error: {
        status: 401,
        message: 'Authentication required'
      }
    };
  }
  
  if (allowedRoles && !hasRole(user, allowedRoles)) {
    return {
      error: {
        status: 403,
        message: 'Insufficient permissions'
      }
    };
  }
  
  return { user };
}

/**
 * Rate limiting helper (simplified for Next.js)
 */
const rateLimitMap = new Map();

export function checkRateLimit(
  ip: string, 
  options: { max?: number; windowMs?: number; } | number = 100,
  windowMs?: number
): boolean {
  // Support both old and new function signatures
  const limit = typeof options === 'number' ? options : (options.max || 100);
  const window = typeof options === 'number' ? (windowMs || 15 * 60 * 1000) : (options.windowMs || 15 * 60 * 1000);
  
  const now = Date.now();
  const windowStart = now - window;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  
  // Remove old requests outside the window
  const validRequests = requests.filter((time: number) => time > windowStart);
  
  if (validRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  
  return true; // Request allowed
}