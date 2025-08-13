import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/auth/verify
 * Verify current JWT token
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user;
    
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