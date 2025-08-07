import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface PatientBasicInfo {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  mobile_number: string
  gender: string
  patient_id: string
  medical_record_number: string
  date_of_birth?: string
  status: string
  created_at: string
}

interface PatientAPIResponse {
  patients: {
    [key: string]: {
      basic_info: PatientBasicInfo
      medical_info?: {
        last_visit?: string
        next_appointment?: string
        adherence_rate?: number
        critical_alerts?: number
        total_appointments?: number
        active_care_plans?: number
      }
      created_at: string
    }
  }
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

export async function GET(
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

    // TODO: Replace with actual API call to adherelive-be
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/patients/${patientId}`, {
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to fetch patient from adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // For now, return empty data structure that matches the expected format
    // This should be replaced with actual data from adherelive-be backend
    const patientData: PatientAPIResponse = {
      patients: {
        [patientId]: {
          basic_info: {
            id: patientId,
            user_id: patientId,
            first_name: 'Patient',
            last_name: 'Name',
            email: 'patient@example.com',
            mobile_number: '+1234567890',
            gender: 'M',
            patient_id: `PAT${patientId}`,
            medical_record_number: `MRN${patientId}`,
            status: 'active',
            created_at: new Date().toISOString()
          },
          medical_info: {
            adherence_rate: 0,
            critical_alerts: 0,
            total_appointments: 0,
            active_care_plans: 0
          },
          created_at: new Date().toISOString()
        }
      }
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: patientData,
        message: 'Patient data retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Internal server error'
          }
        }
      },
      { status: 500 }
    )
  }
}