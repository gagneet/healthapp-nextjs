import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit } from '@/lib/auth-helpers';
import { 
  getDrugInteractions, 
  createDrugInteraction, 
  handleApiError, 
  formatApiSuccess 
} from '@/lib/api-services';

/**
 * GET /api/drug-interactions
 * Search and retrieve drug interactions
 * Query params: drug1, drug2, severity, search, page, limit
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

    // Authenticate user
    const authResult = await requireAuth(request, ['DOCTOR', 'HSP', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { searchParams } = new URL(request.url);
    const queryParameters = {
      drug1: searchParams.get('drug1') || '',
      drug2: searchParams.get('drug2') || '',
      severity: searchParams.get('severity') || '',
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    const interactions = await getDrugInteractions(queryParameters);
    
    return NextResponse.json(formatApiSuccess(interactions, 'Drug interactions retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * POST /api/drug-interactions
 * Create a new drug interaction record (admin/doctor only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user with admin/doctor permissions
    const authResult = await requireAuth(request, ['DOCTOR', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { user } = authResult;
    const interactionData = await request.json();

    // Add created by information
    interactionData.createdBy = user.id || user.userId;

    const newInteraction = await createDrugInteraction(interactionData);
    
    return NextResponse.json(formatApiSuccess(newInteraction, 'Drug interaction created successfully'), {
      status: 201
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}