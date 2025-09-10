import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const requestOtpSchema = z.object({
  patientId: z.string().uuid(),
  secondaryDoctorId: z.string().uuid().optional(),
  secondaryHspId: z.string().uuid().optional(),
  secondaryAssignmentId: z.string().uuid(),
  otpMethod: z.enum(['SMS', 'EMAIL', 'BOTH']).default('BOTH'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = requestOtpSchema.parse(body);

    // Verify that the requesting user has permission to request consent
    const assignment = await prisma.secondaryDoctorAssignment.findUnique({
      where: { id: validatedData.secondaryAssignmentId },
      include: {
        primaryDoctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if user is the primary doctor or admin
    if (assignment.primaryDoctorId !== session.user.id && session.user.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create OTP record
    const consentOtp = await prisma.patientConsentOtp.create({
      data: {
        id: crypto.randomUUID(),
        secondaryAssignmentId: validatedData.secondaryAssignmentId,
        patientId: validatedData.patientId,
        primaryDoctorId: assignment.primaryDoctorId,
        secondaryDoctorId: validatedData.secondaryDoctorId,
        secondaryHspId: validatedData.secondaryHspId,
        otpCode,
        otpMethod: validatedData.otpMethod,
        patientPhone: assignment.patient.user.phone || null,
        patientEmail: assignment.patient.user.email,
        generatedAt: new Date(),
        expiresAt,
        requestedByUserId: session.user.id,
        requestIpAddress: request.ip || null,
        requestUserAgent: request.headers.get('user-agent') || null,
      },
    });

    // TODO: Implement SMS and Email sending logic here
    // For now, we'll just mark as sent
    await prisma.patientConsentOtp.update({
      where: { id: consentOtp.id },
      data: {
        smsSent: validatedData.otpMethod === 'SMS' || validatedData.otpMethod === 'BOTH',
        smsSentAt: validatedData.otpMethod === 'SMS' || validatedData.otpMethod === 'BOTH' ? new Date() : null,
        emailSent: validatedData.otpMethod === 'EMAIL' || validatedData.otpMethod === 'BOTH',
        emailSentAt: validatedData.otpMethod === 'EMAIL' || validatedData.otpMethod === 'BOTH' ? new Date() : null,
      },
    });

    return NextResponse.json({
      message: 'OTP sent successfully',
      otpId: consentOtp.id,
      expiresAt: consentOtp.expiresAt,
      method: validatedData.otpMethod,
    });

  } catch (error) {
    console.error('Error requesting OTP:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to request OTP' }, { status: 500 });
  }
}