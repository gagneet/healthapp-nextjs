import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit } from '@/lib/auth-helpers';
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
    }

    // Authenticate user and check permissions
    const authResult = await requireAuth(request, ['DOCTOR', 'HSP', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { user } = authResult;
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