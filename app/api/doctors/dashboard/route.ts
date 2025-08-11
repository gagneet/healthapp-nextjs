import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getDoctorDashboard, handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/doctors/dashboard
 * Get doctor dashboard data with stats and recent activity
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user and check if they're a doctor
    const authResult = await requireAuth(request, ['DOCTOR', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { user } = authResult;
    const dashboardData = await getDoctorDashboard(user.id || user.userId);
    
    return NextResponse.json(formatApiSuccess(dashboardData, 'Dashboard data retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}