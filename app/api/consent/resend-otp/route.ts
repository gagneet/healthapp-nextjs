import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const resendOtpSchema = z.object({
  otpId: z.string().uuid(),
  patientId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = resendOtpSchema.parse(body);

    // Find the OTP record
    const consentOtp = await prisma.patientConsentOtp.findUnique({
      where: { id: validatedData.otpId },
      include: {
        secondaryDoctorAssignment: {
          include: {
            primaryDoctor: { include: { user: true } },
          },
        },
        patient: { include: { user: true } },
      },
    });

    if (!consentOtp) {
      return NextResponse.json({ error: 'OTP not found' }, { status: 404 });
    }

    // Verify patient ID matches
    if (consentOtp.patientId !== validatedData.patientId) {
      return NextResponse.json({ error: 'Invalid patient' }, { status: 400 });
    }

    // Check if user has permission to resend (primary doctor or admin)
    if (
      consentOtp.secondaryDoctorAssignment.primaryDoctorId !== session.user.id &&
      session.user.role !== 'SYSTEM_ADMIN'
    ) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if OTP is already verified
    if (consentOtp.isVerified) {
      return NextResponse.json({ error: 'OTP already verified' }, { status: 400 });
    }

    // Check if OTP is blocked
    if (consentOtp.isBlocked) {
      return NextResponse.json({ error: 'OTP is blocked. Please request a new one.' }, { status: 400 });
    }

    // Generate new OTP code
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update OTP record with new code and expiry
    const updatedOtp = await prisma.patientConsentOtp.update({
      where: { id: consentOtp.id },
      data: {
        otpCode: newOtpCode,
        expiresAt: newExpiresAt,
        generatedAt: new Date(),
        attemptsCount: 0, // Reset attempts count
        isExpired: false,
        isBlocked: false,
        blockedAt: null,
      },
    });

    // TODO: Implement SMS and Email sending logic here
    // For now, we'll just mark as sent
    await prisma.patientConsentOtp.update({
      where: { id: updatedOtp.id },
      data: {
        smsSent: consentOtp.otpMethod === 'SMS' || consentOtp.otpMethod === 'BOTH',
        smsSentAt: consentOtp.otpMethod === 'SMS' || consentOtp.otpMethod === 'BOTH' ? new Date() : null,
        emailSent: consentOtp.otpMethod === 'EMAIL' || consentOtp.otpMethod === 'BOTH',
        emailSentAt: consentOtp.otpMethod === 'EMAIL' || consentOtp.otpMethod === 'BOTH' ? new Date() : null,
      },
    });

    return NextResponse.json({
      message: 'OTP resent successfully',
      otpId: updatedOtp.id,
      expiresAt: updatedOtp.expiresAt,
      method: consentOtp.otpMethod,
    });

  } catch (error) {
    console.error('Error resending OTP:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to resend OTP' }, { status: 500 });
  }
}