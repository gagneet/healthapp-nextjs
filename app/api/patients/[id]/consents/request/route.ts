import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface ConsentRequest {
  doctor_id: string
  doctor_email: string
  doctor_name: string
  patient_phone: string
  consent_type: 'care_team_access' | 'data_sharing' | 'treatment_authorization'
  permissions: string[]
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

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const patientId = params.id
    const consentData: ConsentRequest = await request.json()

    // Generate OTP
    const otp = generateOTP()

    // TODO: Replace with actual API call to adherelive-be
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/patients/${patientId}/consents/request`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     ...consentData,
    //     otp
    //   })
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to send consent request to adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // TODO: Send SMS/Email with OTP
    // await sendSMS(consentData.patient_phone, `Your healthcare consent OTP is: ${otp}. Valid for 10 minutes.`)
    // await sendEmail(consentData.doctor_email, 'Consent Request Initiated', `OTP sent to patient for consent verification.`)

    console.log(`OTP for patient ${patientId} consent: ${otp}`) // For development
    console.log('Consent request:', consentData) // For development

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          consent_id: `consent_${Date.now()}`,
          otp_sent: true,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          patient_phone_masked: consentData.patient_phone.replace(/(\d{3})\d{6}(\d{4})/, '$1******$2')
        },
        message: 'OTP sent successfully for consent verification'
      }
    })

  } catch (error) {
    console.error('Error requesting consent:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to send consent request'
          }
        }
      },
      { status: 500 }
    )
  }
}