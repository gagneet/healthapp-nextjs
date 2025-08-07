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

interface PaginatedPatientsResponse {
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
    }
  }
  pagination: {
    current_page: number
    total_pages: number
    total_count: number
    per_page: number
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

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    // TODO: Replace with actual API call to adherelive-be
    // const queryString = new URLSearchParams({
    //   page: page.toString(),
    //   limit: limit.toString(),
    //   ...(search && { search })
    // }).toString()
    // 
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/patients/pagination?${queryString}`, {
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to fetch patients from adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // For now, return empty data structure that matches the expected format
    // This should be replaced with actual data from adherelive-be backend
    const patientsData: PaginatedPatientsResponse = {
      patients: {},
      pagination: {
        current_page: page,
        total_pages: 0,
        total_count: 0,
        per_page: limit
      }
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: patientsData,
        message: 'Patients retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching patients:', error)
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