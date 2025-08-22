// app/api/consent/route.ts - Patient consent management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    let whereClause: any = {};

    // Role-based access control
    if (user!.role === 'PATIENT') {
      const patient = await prisma.Patient.findFirst({
        where: { user_id: user!.id }
      });
      if (!patient) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Patient profile not found' } }
        }, { status: 403 });
      }
      whereClause.patient_id = patient.id;
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');

    if (patientId && ['DOCTOR', 'HSP', 'ADMIN'].includes(user!.role)) {
      whereClause.patient_id = patientId;
    }

    const consents = await prisma.patient_consent.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
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
      patient_id,
      consent_type,
      consent_given,
      consent_details,
      expiry_date
    } = body;

    // Validation
    if (!patient_id || !consent_type || consent_given === undefined) {
      return NextResponse.json({
        status: false,
        statusCode: 400,
        payload: { error: { status: 'error', message: 'Patient ID, consent type, and consent status are required' } }
      }, { status: 400 });
    }

    // Permission check
    if (user!.role === 'PATIENT') {
      const patient = await prisma.Patient.findFirst({
        where: { user_id: user!.id }
      });
      if (!patient || patient.id !== patient_id) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Can only manage your own consent' } }
        }, { status: 403 });
      }
    }

    const consent = await prisma.patient_consent.create({
      data: {
        patient_id,
        consent_type,
        consent_given,
        consent_details: consent_details || '',
        granted_by: user!.id,
        expiry_date: expiry_date ? new Date(expiry_date) : null
      },
      include: {
        patient: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        }
      }
    });

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
