import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit } from "@/lib/auth-helpers";
import { 
  checkPatientDrugInteractions, 
  handleApiError, 
  formatApiSuccess 
} from '@/lib/api-services';

/**
 * POST /api/drug-interactions/check
 * Check for drug interactions for a specific patient
 * Body: { patientId: string, medications: string[], newMedication?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'HSP', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    }

    const user = session.user;
    const { patientId, medications, newMedication } = await request.json();

    // Validation
    if (!patientId) {
      return NextResponse.json(handleApiError({
        message: 'Patient ID is required'
      }), { status: 400 });
    }

    if (!medications || !Array.isArray(medications)) {
      return NextResponse.json(handleApiError({
        message: 'Medications array is required'
      }), { status: 400 });
    }

    const interactionResults = await checkPatientDrugInteractions({
      patientId,
      medications,
      newMedication,
      requestedBy: user.id || user.userId
    });
    
    return NextResponse.json(formatApiSuccess(interactionResults, 'Drug interaction check completed'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * GET /api/drug-interactions/check
 * Get interaction checking status or results for a patient
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'HSP', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(handleApiError({
        message: 'Patient ID is required'
      }), { status: 400 });
    }

    // For future implementation - could return cached results or status
    return NextResponse.json(formatApiSuccess({
      patientId,
      status: 'ready',
      message: 'Ready to check interactions'
    }, 'Interaction check service available'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}