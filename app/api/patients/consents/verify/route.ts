import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface OTPVerification {
  consent_id: string
  otp: string
  patient_id: string
  doctor_id: string
}

function verifyToken(request: NextRequest): { userId: string } | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    return { userId: decoded.id || decoded.userId }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = verifyToken(request)
    if (!auth) {
      return NextResponse.json(
        { 
          status: false, 
          statusCode: 401, 
          payload: { 
            error: { 
              status: 'error', 
              message: 'Unauthorized access' 
            } 
          } 
        },
        { status: 401 }
      )
    }

    const verificationData: OTPVerification = await request.json()

    // TODO: Replace with actual API call to adherelive-be
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/patients/consents/verify`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(verificationData)
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to verify consent with adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // For now, simulate OTP verification
    // In production, this should verify against the stored OTP and expiration
    const isValidOTP = verificationData.otp.length === 4 // Simple validation
    
    if (!isValidOTP) {
      return NextResponse.json(
        {
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'error',
              message: 'Invalid OTP provided'
            }
          }
        },
        { status: 400 }
      )
    }

    // Create consent record
    const consentRecord = {
      id: `consent_${Date.now()}`,
      patient_id: verificationData.patient_id,
      doctor_id: verificationData.doctor_id,
      type: 'care_team_access',
      status: 'active',
      permissions: [
        'view_medical_records',
        'add_medications',
        'schedule_appointments',
        'access_vital_signs'
      ],
      activated_on: new Date().toISOString(),
      expires_on: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      verified_at: new Date().toISOString()
    }

    console.log('Consent verified and activated:', consentRecord) // For development

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          consent: consentRecord,
          access_granted: true
        },
        message: 'Consent verified successfully. Care team access granted.'
      }
    })

  } catch (error) {
    console.error('Error verifying consent:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to verify consent'
          }
        }
      },
      { status: 500 }
    )
  }
}