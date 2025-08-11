import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit } from '@/lib/auth-helpers';
import { handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/symptoms
 * Search symptoms database
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
    const authResult = await requireAuth(request, ['DOCTOR', 'HSP', 'PATIENT', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    // Mock symptoms data - replace with actual database query
    const symptoms = [
      { id: 1, name: 'Headache', category: 'neurological', severity: 'mild' },
      { id: 2, name: 'Fever', category: 'general', severity: 'moderate' },
      { id: 3, name: 'Chest Pain', category: 'cardiovascular', severity: 'severe' }
    ].filter(symptom => 
      (!searchTerm || symptom.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!category || symptom.category === category)
    );

    return NextResponse.json(formatApiSuccess(symptoms, 'Symptoms retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * POST /api/symptoms
 * Record patient symptoms
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request, ['PATIENT', 'DOCTOR', 'HSP', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { user } = authResult;
    const symptomData = await request.json();

    // Basic validation
    if (!symptomData.symptoms || !Array.isArray(symptomData.symptoms)) {
      return NextResponse.json(handleApiError({
        message: 'Symptoms array is required'
      }), { status: 400 });
    }

    // Mock symptom recording - replace with actual service
    const recordedSymptoms = {
      id: Date.now(),
      patientId: symptomData.patientId || user.patientId,
      symptoms: symptomData.symptoms,
      recordedAt: new Date().toISOString(),
      recordedBy: user.id
    };

    return NextResponse.json(formatApiSuccess(recordedSymptoms, 'Symptoms recorded successfully'), {
      status: 201
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}