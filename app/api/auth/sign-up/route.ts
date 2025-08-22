// Force dynamic rendering for API routes using headers/auth
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { checkRateLimit } from '@/lib/auth-helpers';
import { createUser, handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * POST /api/auth/sign-up
 * User registration endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
      return NextResponse.json(handleApiError({
        message: 'Too many registration attempts. Please try again later.'
      }), { status: 429 });
    }

    const userData = await request.json();

    // Basic validation
    if (!userData.email || !userData.password) {
      return NextResponse.json(handleApiError({
        message: 'Email and password are required'
      }), { status: 400 });
    }

    // Create user
    const createResult = await createUser(userData);
    
    if (!createResult.success) {
      return NextResponse.json(handleApiError({
        message: createResult.message || 'User registration failed'
      }), { status: 400 });
    }

    return NextResponse.json(formatApiSuccess(createResult.data, 'User registered successfully'), {
      status: 201
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
