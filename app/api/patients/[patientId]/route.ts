import { NextRequest } from 'next/server';
import { auth } from "@/lib/auth";
import { getPatient } from '@/lib/api-services';
import { withErrorHandling, createSuccessResponse, createUnauthorizedResponse, createForbiddenResponse, HealthcareApiError, HealthcareErrorCodes, AuthorizationError } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/patients/[id]
 * Get detailed patient information by ID
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { patientId: string } }
) => {
  const session = await auth();
  if (!session?.user) {
    return createUnauthorizedResponse();
  }

  const { user } = session;
  const patientId = params.patientId;

  if (!['DOCTOR', 'HSP', 'PATIENT', 'admin'].includes(user.role)) {
    return createForbiddenResponse("Insufficient permissions");
  }

  const patientData = await getPatient(patientId);

  if (!patientData) {
    throw new HealthcareApiError(HealthcareErrorCodes.PATIENT_NOT_FOUND, "Patient not found", 404);
  }

  // Authorization checks
  if (user.role === 'PATIENT' && patientData.userId !== user.id) {
    throw new AuthorizationError('Access denied: You can only access your own patient data');
  }

  if (user.role === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (patientData.primaryCareDoctorId !== doctor?.id) {
      throw new AuthorizationError('Access denied: You are not the primary care doctor for this patient');
    }
  }

  return createSuccessResponse(patientData, 200);
});
