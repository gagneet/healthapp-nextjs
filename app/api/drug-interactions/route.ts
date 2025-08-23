import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

import { checkRateLimit } from "@/lib/auth-helpers";
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'HSP', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const user = session.user;
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
