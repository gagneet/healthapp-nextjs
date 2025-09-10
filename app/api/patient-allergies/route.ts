import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

import { checkRateLimit } from "@/lib/auth-helpers";
import { 
  getPatientAllergies, 
  createPatientAllergy, 
  handleApiError, 
  formatApiSuccess 
} from '@/lib/api-services';

/**
 * GET /api/patient-allergies
 * Retrieve patient allergies with filtering
 * Query params: patientId, allergyType, severity, verified, page, limit
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
    if (!['DOCTOR', 'HSP', 'PATIENT', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    // Validation - patientId is required
    if (!patientId) {
      return NextResponse.json(handleApiError({
        message: 'Patient ID is required'
      }), { status: 400 });
    }

    const queryParameters = {
      patientId: patientId,
      allergyType: searchParams.get('allergyType') || '',
      severity: searchParams.get('severity') || '',
      verified: searchParams.get('verified') === 'true' ? true : undefined,
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    const allergies = await getPatientAllergies(queryParameters);
    
    return NextResponse.json(formatApiSuccess(allergies, 'Patient allergies retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * POST /api/patient-allergies
 * Create a new patient allergy record
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user - Only healthcare providers can add allergies
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!['DOCTOR', 'HSP', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const user = session.user;
    const allergyData = await request.json();

    // Required field validation
    if (!allergyData.patientId || !allergyData.allergen || !allergyData.severity) {
      return NextResponse.json(handleApiError({
        message: 'Patient ID, allergen, and severity are required'
      }), { status: 400 });
    }

    // Add verification information
    allergyData.verifiedBy = user.id || (user as any).userId;
    allergyData.isVerified = true;
    allergyData.verificationDate = new Date().toISOString();

    const newAllergy = await createPatientAllergy(allergyData);
    
    return NextResponse.json(formatApiSuccess(newAllergy, 'Patient allergy created successfully'), {
      status: 201
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
