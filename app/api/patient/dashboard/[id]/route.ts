import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPatientDashboard, handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/patient/dashboard/[id]
 * Get patient dashboard data with real health metrics and upcoming events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['PATIENT', 'DOCTOR', 'HSP', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const user = session.user;
    const patientId = params.id;

    // Patients can only access their own dashboard
    if (user.role === 'PATIENT' && user.patientId !== patientId) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You can only access your own dashboard'
      }), { status: 403 });
    }

    // Get real patient dashboard data
    const dashboardData = await getPatientDashboard(patientId);

    return NextResponse.json(formatApiSuccess(dashboardData, 'Patient dashboard data retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}