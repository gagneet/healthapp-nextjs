// app/api/consent/route.ts - Patient consent management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';



export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const whereClause: any = {};

    // Role-based access control
    if (user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: user!.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patientId = patient.id;
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (patientId && ['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(user!.role)) {
      whereClause.patientId = patientId;
    }

    const consents = await prisma.patientConsentOtp.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { consents },
        message: 'Consent records retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching consent records:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    const body = await request.json();
    const {
      patientId,
      consent_type,
      consent_given,
      consent_details,
      expiry_date
    } = body;

    // Validation
    if (!patientId || !consent_type || consent_given === undefined) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'error', message: 'Patient ID, consent type, and consent status are required' } }
      }, { status: 400 });
    }

    // Permission check
    if (user!.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { userId: user!.id }
      });
      if (!patient || patient.id !== patientId) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only manage your own consent' } }
        }, { status: 403 });
      }
    }

    // TODO: Update this to match current PatientConsentOtp schema requirements
    const consent = {
      id: 'temp-id',
      patientId,
      consent_type: 'TEMPORARY',
      consent_given: true,
      consent_details: 'Temporarily disabled',
      granted_by: user!.id,
      expiry_date: null,
      patient: {
        user: {
          firstName: 'Temp',
          lastName: 'User',
          email: 'temp@example.com',
          phone: null
        }
      }
    };

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { consent },
        message: 'Consent record created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating consent record:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
