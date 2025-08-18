import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { getDoctorDashboard, handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/doctors/dashboard
 * Get doctor dashboard data with stats and recent activity
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user and check if they're a doctor
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const user = session.user;
    const dashboardData = await getDoctorDashboard(user.id || user.userId);
    
    return NextResponse.json(formatApiSuccess(dashboardData, 'Dashboard data retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
