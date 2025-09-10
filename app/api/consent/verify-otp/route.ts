import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  otpId: z.string().uuid(),
  otpCode: z.string().length(6),
  patientId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = verifyOtpSchema.parse(body);

    // Find the OTP record
    const consentOtp = await prisma.patientConsentOtp.findUnique({
      where: { id: validatedData.otpId },
      include: {
        secondaryDoctorAssignment: true,
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

    // Check if OTP is already verified
    if (consentOtp.isVerified) {
      return NextResponse.json({ error: 'OTP already used' }, { status: 400 });
    }

    // Check if OTP is expired
    if (consentOtp.expiresAt < new Date()) {
      await prisma.patientConsentOtp.update({
        where: { id: consentOtp.id },
        data: { isExpired: true },
      });
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Check if OTP is blocked due to too many attempts
    if (consentOtp.isBlocked || ((consentOtp.attemptsCount || 0) >= (consentOtp.maxAttempts || 3))) {
      return NextResponse.json({ error: 'OTP is blocked due to too many attempts' }, { status: 400 });
    }

    // Check OTP code
    if (consentOtp.otpCode !== validatedData.otpCode) {
      // Increment attempts count
      const newAttemptsCount = (consentOtp.attemptsCount || 0) + 1;
      const isNowBlocked = newAttemptsCount >= (consentOtp.maxAttempts || 3);
      
      await prisma.patientConsentOtp.update({
        where: { id: consentOtp.id },
        data: {
          attemptsCount: newAttemptsCount,
          isBlocked: isNowBlocked,
          blockedAt: isNowBlocked ? new Date() : null,
        },
      });

      return NextResponse.json({ 
        error: 'Invalid OTP code',
        attemptsRemaining: Math.max(0, (consentOtp.maxAttempts || 3) - newAttemptsCount)
      }, { status: 400 });
    }

    // OTP is valid - mark as verified and update assignment
    await prisma.$transaction([
      // Mark OTP as verified
      prisma.patientConsentOtp.update({
        where: { id: consentOtp.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      }),
      // Update the secondary doctor assignment with consent granted
      prisma.secondaryDoctorAssignment.update({
        where: { id: consentOtp.secondaryAssignmentId },
        data: {
          consentStatus: 'GRANTED',
          accessGranted: true,
          accessGrantedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Consent verified successfully',
      verifiedAt: new Date(),
      assignmentId: consentOtp.secondaryAssignmentId,
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}