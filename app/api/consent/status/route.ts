import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const assignmentId = searchParams.get('assignmentId');

    if (!patientId && !assignmentId) {
      return NextResponse.json({ error: 'patientId or assignmentId is required' }, { status: 400 });
    }

    const whereClause: any = {};
    if (assignmentId) {
      whereClause.secondaryAssignmentId = assignmentId;
    } else {
      whereClause.patientId = patientId;
    }

    // Get consent OTP records with related data
    const consentRecords = await prisma.patientConsentOtp.findMany({
      where: whereClause,
      include: {
        secondaryDoctorAssignment: {
          include: {
            primaryDoctor: { include: { user: { select: { name: true, email: true } } } },
            secondaryDoctor: { include: { user: { select: { name: true, email: true } } } },
            secondaryHsp: { include: { user: { select: { name: true, email: true } } } },
          },
        },
        patient: { 
          include: { 
            user: { select: { name: true, email: true, phone: true } } 
          } 
        },
        requestedByUser: { select: { name: true, email: true } },
      },
      orderBy: { generatedAt: 'desc' },
    });

    // Transform data for response
    const consentStatus = consentRecords.map(record => ({
      id: record.id,
      assignmentId: record.secondaryAssignmentId,
      patient: {
        id: record.patientId,
        name: record.patient.user.name,
        email: record.patient.user.email,
        phone: record.patient.user.phone,
      },
      primaryDoctor: {
        id: record.primaryDoctorId,
        name: record.secondaryDoctorAssignment.primaryDoctor.user.name,
        email: record.secondaryDoctorAssignment.primaryDoctor.user.email,
      },
      secondaryProvider: record.secondaryDoctorId ? {
        id: record.secondaryDoctorId,
        name: record.secondaryDoctorAssignment.secondaryDoctor?.user.name,
        email: record.secondaryDoctorAssignment.secondaryDoctor?.user.email,
        type: 'DOCTOR',
      } : record.secondaryHspId ? {
        id: record.secondaryHspId,
        name: record.secondaryDoctorAssignment.secondaryHsp?.user.name,
        email: record.secondaryDoctorAssignment.secondaryHsp?.user.email,
        type: 'HSP',
      } : null,
      otpMethod: record.otpMethod,
      generatedAt: record.generatedAt,
      expiresAt: record.expiresAt,
      isVerified: record.isVerified,
      verifiedAt: record.verifiedAt,
      isExpired: record.isExpired || (record.expiresAt < new Date()),
      isBlocked: record.isBlocked,
      attemptsCount: record.attemptsCount,
      maxAttempts: record.maxAttempts,
      requestedByUserId: {
        name: record.requestedByUser.name,
        email: record.requestedByUser.email,
      },
      assignmentStatus: record.secondaryDoctorAssignment.consentStatus,
      assignmentActive: record.secondaryDoctorAssignment.isActive,
    }));

    return NextResponse.json({
      consentRecords: consentStatus,
      totalRecords: consentRecords.length,
    });

  } catch (error) {
    console.error('Error fetching consent status:', error);
    return NextResponse.json({ error: 'Failed to fetch consent status' }, { status: 500 });
  }
}
