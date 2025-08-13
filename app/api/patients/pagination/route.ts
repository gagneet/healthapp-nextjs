import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit } from "@/lib/auth-helpers";
import { getPatients, handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/patients/pagination
 * Get paginated list of patients for authorized users
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });

    // Authenticate user and check permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'HSP', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const user = session.user;
    const { searchParams } = new URL(request.url);
    
    // Extract pagination parameters
    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'DESC') as 'asc' | 'desc'
    };

    const patientsData = await getPatients(user.id || user.userId, pagination);
    
    return NextResponse.json(formatApiSuccess(patientsData, 'Patients retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}