import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { checkRateLimit } from '@/lib/auth-helpers';
import { authenticateUser, handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * POST /api/auth/sign-in
 * User authentication endpoint
 */

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP, 10, 15 * 60 * 1000)) { // 10 attempts per 15 minutes
      return NextResponse.json(handleApiError({
        message: 'Too many login attempts. Please try again later.'
      }), { status: 429 });
    }

    const body = await request.json();
    const { email, password } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(handleApiError({
        message: 'Email and password are required'
      }), { status: 400 });
    }

    // Authenticate user
    const authResult = await authenticateUser(email, password);
    
    if (!authResult.success) {
      return NextResponse.json(handleApiError({
        message: authResult.message || 'Authentication failed'
      }), { status: 401 });
    }

    return NextResponse.json(formatApiSuccess(authResult.data, 'Authentication successful'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
