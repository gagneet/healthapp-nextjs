// app/api/consent/route.ts - Patient consent management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const consentType = searchParams.get('consent_type');

    let whereClause: any = {};

    // Role-based access control
    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { user_id: user.id }
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

    if (patientId && ['DOCTOR', 'HSP', 'ADMIN'].includes(user.role)) {
      whereClause.patient_id = patientId;
    }

    if (consentType) {
      whereClause.consent_type = consentType;
    }

    // Get patient consent records
    const consents = await prisma.patient_consent_otp.findMany({
      where: whereClause,
      include: {
        patients: {
          select: {
            id: true,
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        users: {
          select: {
            first_name: true,
            last_name: true,
            role: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 50
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
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      patient_id,
      consent_type,
      provider_change_type,
      new_provider_id,
      previous_provider_id,
      reason,
      emergency_contact_phone,
      is_emergency
    } = body;

    // Generate OTP for consent verification
    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const consentRecord = await prisma.patient_consent_otp.create({
      data: {
        patient_id,
        requested_by: user.id,
        consent_type,
        provider_change_type,
        new_provider_id,
        previous_provider_id,
        reason,
        emergency_contact_phone,
        is_emergency: is_emergency || false,
        otp_code: otp,
        otp_expires_at: otpExpiresAt,
        consent_status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        patients: {
          select: {
            patient_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // In a real application, you would send the OTP via SMS/email here
    // For testing, we'll return it in the response
    console.log(`OTP for consent ${consentRecord.id}: ${otp}`);

    return NextResponse.json({
      status: true,
      statusCode: 201,
      payload: {
        data: { 
          consent: consentRecord,
          otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show OTP in development
        },
        message: 'Consent request created successfully. OTP has been sent.'
      }
    });
  } catch (error) {
    console.error('Error creating consent request:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    const body = await request.json();
    const { consent_id, otp_code, action } = body; // action: 'verify' or 'approve' or 'deny'

    const consentRecord = await prisma.patient_consent_otp.findUnique({
      where: { id: consent_id }
    });

    if (!consentRecord) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Consent record not found' } }
      }, { status: 404 });
    }

    if (action === 'verify') {
      // Verify OTP
      if (!otp_code || consentRecord.otp_code !== otp_code) {
        return NextResponse.json({
          status: false,
          statusCode: 400,
          payload: { error: { status: 'invalid_otp', message: 'Invalid OTP code' } }
        }, { status: 400 });
      }

      if (consentRecord.otp_expires_at && consentRecord.otp_expires_at < new Date()) {
        return NextResponse.json({
          status: false,
          statusCode: 400,
          payload: { error: { status: 'expired_otp', message: 'OTP has expired' } }
        }, { status: 400 });
      }

      // Mark as verified
      const updatedConsent = await prisma.patient_consent_otp.update({
        where: { id: consent_id },
        data: {
          consent_status: 'verified',
          verified_at: new Date(),
          updated_at: new Date()
        }
      });

      return NextResponse.json({
        status: true,
        statusCode: 200,
        payload: {
          data: { consent: updatedConsent },
          message: 'Consent verified successfully'
        }
      });
    }

    if (action === 'approve' || action === 'deny') {
      // Only authorized users can approve/deny
      if (!['DOCTOR', 'HSP', 'ADMIN'].includes(user.role)) {
        return NextResponse.json({
          status: false,
          statusCode: 403,
          payload: { error: { status: 'forbidden', message: 'Insufficient permissions' } }
        }, { status: 403 });
      }

      const updatedConsent = await prisma.patient_consent_otp.update({
        where: { id: consent_id },
        data: {
          consent_status: action === 'approve' ? 'approved' : 'denied',
          approved_by: action === 'approve' ? user.id : undefined,
          approved_at: action === 'approve' ? new Date() : undefined,
          denied_at: action === 'deny' ? new Date() : undefined,
          updated_at: new Date()
        }
      });

      return NextResponse.json({
        status: true,
        statusCode: 200,
        payload: {
          data: { consent: updatedConsent },
          message: `Consent ${action}d successfully`
        }
      });
    }

    return NextResponse.json({
      status: false,
      statusCode: 400,
      payload: { error: { status: 'invalid_action', message: 'Invalid action specified' } }
    }, { status: 400 });
  } catch (error) {
    console.error('Error updating consent:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}