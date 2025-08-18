// app/api/assignments/secondary-doctors/consent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

// Generate OTP for patient consent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const body = await request.json();
    const { assignment_id, patient_phone, consent_method = 'SMS' } = body;

    if (!assignment_id) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Assignment ID is required' } }
      }, { status: 400 });
    }

    // Find the assignment
    const assignment = await prisma.secondary_doctor_assignments.findUnique({
      where: { id: assignment_id },
      include: {
        patients: {
          include: {
            user: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Assignment not found' } }
      }, { status: 404 });
    }

    // Verify user has permission to request consent for this assignment
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { user_id: session.user.id }
      });
      if (!doctor || doctor.id !== assignment.primary_doctor_id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Only the primary doctor can request consent' } }
        }, { status: 403 });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Create consent OTP record
    const consentOTP = await prisma.patient_consent_otp.create({
      data: {
        secondary_assignment_id: assignment_id,
        patient_phone: patient_phone || assignment.patients.user.phone,
        consent_method,
        otp_code: otp,
        expires_at: expiresAt,
        is_verified: false,
        attempts_count: 0,
        created_at: new Date()
      }
    });

    // In a real implementation, you would send the OTP via SMS/email here
    // For now, we'll just return it in the response (NOT recommended for production)

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: {
          otp_id: consentOTP.id,
          otp_code: otp, // Remove this in production
          expires_at: expiresAt,
          patient_phone: consentOTP.patient_phone,
          consent_method
        },
        message: `OTP sent to patient's ${consent_method.toLowerCase()}`
      }
    });

  } catch (error) {
    console.error('Error generating consent OTP:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

// Verify OTP and grant consent
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const body = await request.json();
    const { otp_id, otp_code, assignment_id } = body;

    if (!otp_id || !otp_code || !assignment_id) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'OTP ID, OTP code, and assignment ID are required' } }
      }, { status: 400 });
    }

    // Find the OTP record
    const otpRecord = await prisma.patient_consent_otp.findUnique({
      where: { id: otp_id },
      include: {
        secondary_doctor_assignments: true
      }
    });

    if (!otpRecord) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'OTP record not found' } }
      }, { status: 404 });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expires_at) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'expired', message: 'OTP has expired' } }
      }, { status: 400 });
    }

    // Check if OTP is already verified
    if (otpRecord.is_verified) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'already_verified', message: 'OTP already verified' } }
      }, { status: 400 });
    }

    // Check attempt count
    if (otpRecord.attempts_count >= 3) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'max_attempts', message: 'Maximum verification attempts exceeded' } }
      }, { status: 400 });
    }

    // Verify OTP code
    if (otpRecord.otp_code !== otp_code) {
      // Increment attempt count
      await prisma.patient_consent_otp.update({
        where: { id: otp_id },
        data: { attempts_count: otpRecord.attempts_count + 1 }
      });

      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'invalid_otp', message: 'Invalid OTP code' } }
      }, { status: 400 });
    }

    // Mark OTP as verified and update assignment consent status
    await prisma.$transaction([
      prisma.patient_consent_otp.update({
        where: { id: otp_id },
        data: {
          is_verified: true,
          verified_at: new Date()
        }
      }),
      prisma.secondary_doctor_assignments.update({
        where: { id: assignment_id },
        data: {
          consent_status: 'granted',
          access_granted: true,
          access_granted_at: new Date(),
          updated_at: new Date()
        }
      })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          assignment_id,
          consent_status: 'granted',
          access_granted: true
        },
        message: 'Patient consent verified successfully'
      }
    });

  } catch (error) {
    console.error('Error verifying consent OTP:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
