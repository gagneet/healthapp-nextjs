import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
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
    }

    // Authenticate user and check permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }
    if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
      }, { status: 403 });
    }

    const user = session.user;
    const { searchParams } = new URL(request.url);
    
    // Extract pagination parameters
    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    };

    // For doctors, we need to get the doctor profile ID, not the user ID
    let doctorId = user.id || user.userId;
    if (user.role === 'DOCTOR') {
      // Import prisma locally to get doctor profile ID
      const { prisma } = await import('@/lib/prisma');
      const doctorProfile = await prisma.doctor.findFirst({
        where: { userId: user.id || user.userId }
      });
      
      if (!doctorProfile) {
        return NextResponse.json({
          status: false,
          statusCode: 404,
          payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
        }, { status: 404 });
      }
      
      doctorId = doctorProfile.id;
    }

    const patientsData = await getPatients(doctorId, pagination);
    
    return NextResponse.json(formatApiSuccess(patientsData, 'Patients retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
