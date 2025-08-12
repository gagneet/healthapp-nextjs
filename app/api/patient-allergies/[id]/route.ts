import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit } from '@/lib/auth-helpers';
import { 
  updatePatientAllergy, 
  deletePatientAllergy, 
  verifyPatientAllergy,
  handleApiError, 
  formatApiSuccess 
} from '@/lib/api-services';

/**
 * PUT /api/patient-allergies/[id]
 * Update a patient allergy record
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(handleApiError({
        message: 'Too many requests. Please try again later.'
      }), { status: 429 });
    }

    // Authenticate user - Only healthcare providers can update allergies
    const authResult = await requireAuth(request, ['DOCTOR', 'HSP', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { user } = authResult;
    const { id } = params;
    const updateData = await request.json();

    if (!id) {
      return NextResponse.json(handleApiError({
        message: 'Allergy ID is required'
      }), { status: 400 });
    }

    // Add update metadata
    updateData.lastModifiedBy = user.id || user.userId;
    updateData.lastModified = new Date().toISOString();

    const updatedAllergy = await updatePatientAllergy(id, updateData);
    
    return NextResponse.json(formatApiSuccess(updatedAllergy, 'Patient allergy updated successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * DELETE /api/patient-allergies/[id]
 * Delete a patient allergy record (soft delete with reason)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate user - Only healthcare providers can delete allergies
    const authResult = await requireAuth(request, ['DOCTOR', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { user } = authResult;
    const { id } = params;

    if (!id) {
      return NextResponse.json(handleApiError({
        message: 'Allergy ID is required'
      }), { status: 400 });
    }

    // Get deletion reason from request body
    const body = await request.json().catch(() => ({}));
    const deletionReason = body.reason || 'Removed by healthcare provider';

    const result = await deletePatientAllergy(id, {
      deletedBy: user.id || user.userId,
      deletionReason,
    });
    
    return NextResponse.json(formatApiSuccess(result, 'Patient allergy deleted successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

/**
 * PATCH /api/patient-allergies/[id]/verify
 * Verify a patient allergy record
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate user - Only doctors can verify allergies
    const authResult = await requireAuth(request, ['DOCTOR', 'admin']);
    if (authResult.error) {
      return NextResponse.json(handleApiError(authResult.error), { 
        status: authResult.error.status 
      });
    }

    const { user } = authResult;
    const { id } = params;

    if (!id) {
      return NextResponse.json(handleApiError({
        message: 'Allergy ID is required'
      }), { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const verificationNotes = body.notes || '';

    const verifiedAllergy = await verifyPatientAllergy(id, {
      verifiedBy: user.id || user.userId,
      verificationNotes,
    });
    
    return NextResponse.json(formatApiSuccess(verifiedAllergy, 'Patient allergy verified successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}