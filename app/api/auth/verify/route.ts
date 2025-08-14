import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/auth/verify
 * Verify current Auth.js v5 session
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user with Auth.js v5
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    
    // Return user information (excluding sensitive data)
    const userInfo = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      businessId: user.businessId,
      profileId: user.profileId,
      accountStatus: user.accountStatus,
      organizationId: user.organizationId,
      // Healthcare permissions
      canPrescribeMedication: user.canPrescribeMedication,
      canAccessPatientData: user.canAccessPatientData,
      canManageProviders: user.canManageProviders,
      canViewAllPatients: user.canViewAllPatients
    };

    return NextResponse.json(formatApiSuccess(userInfo, 'Token verified successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}