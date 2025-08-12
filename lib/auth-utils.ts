// lib/auth-utils.ts - Authentication utilities for Next.js API routes
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface AuthResult {
  user?: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  };
  error?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return { error: 'No token provided' };
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'development_jwt_secret_key_256_bit_not_for_production_use_only_123456789';
    
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch (jwtError) {
      return { error: 'Invalid or expired token' };
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        account_status: true,
        email_verified: true
      }
    });

    if (!user) {
      return { error: 'User not found' };
    }

    if (user.account_status !== 'active') {
      return { error: 'Account is not active' };
    }

    return { user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { error: 'Authentication failed' };
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const { user, error } = await verifyAuth(request);
    
    if (error) {
      return { error };
    }

    if (!user || !allowedRoles.includes(user.role)) {
      return { error: 'Insufficient permissions' };
    }

    return { user };
  };
}

export function generateToken(payload: { id: string; email: string; role: string }): string {
  const jwtSecret = process.env.JWT_SECRET || 'development_jwt_secret_key_256_bit_not_for_production_use_only_123456789';
  const expiresIn = process.env.JWT_EXPIRES_IN || '60m';
  
  return jwt.sign(payload, jwtSecret, { expiresIn });
}

export function generateRefreshToken(payload: { id: string; email: string }): string {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_256_bit_not_for_production_use_only_987654321';
  const expiresIn = process.env.JWT_REFRESH_EXPIRE || '7d';
  
  return jwt.sign(payload, refreshSecret, { expiresIn });
}