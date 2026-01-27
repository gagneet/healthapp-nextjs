// app/api/assignments/secondary-doctors/consent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// Generate OTP for patient consent

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const body = await request.json();
    const { assignment_id, patient_phone, consent_method = 'SMS' } = body;

    if (!assignment_id || typeof assignment_id !== 'string' || assignment_id.trim().length === 0) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Valid assignment ID is required' } }
      }, { status: 400 });
    }

    // Find the assignment
    const assignment = await prisma.secondaryDoctorAssignment.findUnique({
      where: { id: assignment_id },
      include: {
        patient: {
          include: {
            user: true
          }
        }
      }
    });

    if (!assignment || !assignment.patient) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Assignment not found' } }
      }, { status: 404 });
    }

    // Verify user has permission to request consent for this assignment
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: session.user.id }
      });
      if (!doctor || doctor.id !== assignment.primaryDoctorId) {
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
    const consentOTP = await prisma.patientConsentOtp.create({
      data: {
        id: randomUUID(),
        secondaryAssignmentId: assignment_id,
        patientId: assignment.patientId,
        primaryDoctorId: assignment.primaryDoctorId,
        secondaryDoctorId: assignment.secondaryDoctorId,
        secondaryHspId: assignment.secondaryHspId,
        requestedByUserId: session.user.id,
        patientPhone: patient_phone || assignment.patient.user.phone,
        otpMethod: consent_method,
        otpCode: otp,
        expiresAt: expiresAt,
        isVerified: false,
        attemptsCount: 0,
        createdAt: new Date()
      }
    });

    // In a real implementation, you would send the OTP via SMS/email here
    // For now, we'll just return it in the response (NOT recommended for production)

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: {
          otpId: consentOTP.id,
          otpCode: otp, // Remove this in production
          expiresAt: expiresAt,
          patientPhone: consentOTP.patientPhone,
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    const body = await request.json();
    const { otp_id, otp_code, assignment_id } = body;

    if (!otp_id || typeof otp_id !== 'string' || otp_id.trim().length === 0 ||
        !otp_code || typeof otp_code !== 'string' || otp_code.trim().length === 0 ||
        !assignment_id || typeof assignment_id !== 'string' || assignment_id.trim().length === 0) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'validation_error', message: 'Valid OTP ID, OTP code, and assignment ID are required' } }
      }, { status: 400 });
    }

    // Find the OTP record
    const otpRecord = await prisma.patientConsentOtp.findUnique({
      where: { id: otp_id }
    });

    if (!otpRecord) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'OTP record not found' } }
      }, { status: 404 });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'expired', message: 'OTP has expired' } }
      }, { status: 400 });
    }

    // Check if OTP is already verified
    if (otpRecord.isVerified) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'already_verified', message: 'OTP already verified' } }
      }, { status: 400 });
    }

    // Check attempt count
    if (otpRecord.attemptsCount && otpRecord.attemptsCount >= 3) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'max_attempts', message: 'Maximum verification attempts exceeded' } }
      }, { status: 400 });
    }

    // Verify OTP code
    if (otpRecord.otpCode !== otp_code) {
      // Increment attempt count
      await prisma.patientConsentOtp.update({
        where: { id: otp_id },
        data: { attemptsCount: { increment: 1 } }
      });

      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'invalid_otp', message: 'Invalid OTP code' } }
      }, { status: 400 });
    }

    // Mark OTP as verified and update assignment consent status
    await prisma.$transaction([
      prisma.patientConsentOtp.update({
        where: { id: otp_id },
        data: {
          isVerified: true,
          verifiedAt: new Date()
        }
      }),
      prisma.secondaryDoctorAssignment.update({
        where: { id: assignment_id },
        data: {
          consentStatus: 'GRANTED',
          accessGranted: true,
          accessGrantedAt: new Date(),
          updatedAt: new Date()
        }
      })
    ]);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          assignmentId: assignment_id,
          consentStatus: 'GRANTED',
          accessGranted: true
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
