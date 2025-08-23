import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import SecondaryDoctorService from '@/lib/secondary-doctor-service';

/**
 * POST /api/assignments/{id}/verify-consent
 * Verify patient consent via OTP for secondary doctor assignments
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const { id: assignmentId } = params;
    const body = await request.json();

    // Validate OTP
    if (!body.otp || body.otp.length !== 6) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Valid 6-digit OTP is required' } }
      }, { status: 400 });
    }

    const result = await SecondaryDoctorService.verifyPatientConsent(assignmentId, body.otp);

    if (!result.success) {
      const statusCode = result.error === 'INVALID_OTP' || result.error === 'OTP_EXPIRED' ? 400 : 500;
      
      return NextResponse.json({
        status: false,
        statusCode,
        payload: { error: { status: result.error || 'error', message: result.message } }
      }, { status: statusCode });
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        message: result.message
      }
    });

  } catch (error) {
    console.error('Error verifying consent:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}