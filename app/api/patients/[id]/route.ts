import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPatient, handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/patients/[id]
 * Get detailed patient information by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!['DOCTOR', 'HSP', 'PATIENT', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const user = session.user;
    const patientId = params.id;

    // Additional authorization: patients can only access their own data
    if (user.role === 'PATIENT' && user.patientId !== patientId) {
      return NextResponse.json(handleApiError({
        message: 'Access denied: You can only access your own patient data'
      }), { status: 403 });

    const patientData = await getPatient(patientId);
    
    if (!patientData) {
      return NextResponse.json(handleApiError({
        message: 'Patient not found'
      }), { status: 404 });
    
    return NextResponse.json(formatApiSuccess(patientData, 'Patient data retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}