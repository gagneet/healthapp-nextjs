import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/auth/verify
 * Verify current JWT token
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { user } = authResult;
    
    // Return user information (excluding sensitive data)
    const userInfo = {
      id: user.id || user.userId,
      email: user.email,
      role: user.role || user.category,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive !== false
    };

    return NextResponse.json(formatApiSuccess(userInfo, 'Token verified successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}