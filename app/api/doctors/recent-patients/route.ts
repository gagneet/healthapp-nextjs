import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface Patient {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  gender: string
  medical_record_number: string
  last_visit?: string
  next_appointment?: string
  adherence_rate?: number
  critical_alerts: number
  status: string
  created_at: string
  profile_picture_url?: string
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

async function getRecentPatients(doctorId: string, limit: number): Promise<Patient[]> {
  // TODO: Replace with actual database query
  // Example query needed:
  /*
    SELECT 
      p.*,
      u.email,
      u.phone,
      (
        SELECT AVG(
          CASE WHEN ml.taken_at IS NOT NULL THEN 100 ELSE 0 END
        )
        FROM medication_logs ml
        JOIN medications m ON ml.medication_id = m.id
        WHERE m.patient_id = p.id
          AND ml.scheduled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ) as adherence_rate,
      (
        SELECT COUNT(*)
        FROM alerts a
        WHERE a.patient_id = p.id
          AND a.severity = 'CRITICAL'
          AND a.status = 'ACTIVE'
      ) as critical_alerts,
      (
        SELECT MAX(a.appointment_date)
        FROM appointments a
        WHERE a.patient_id = p.id
          AND a.status = 'COMPLETED'
      ) as last_visit,
      (
        SELECT MIN(a.appointment_date)
        FROM appointments a
        WHERE a.patient_id = p.id
          AND a.status IN ('SCHEDULED', 'CONFIRMED')
          AND a.appointment_date > NOW()
      ) as next_appointment
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE p.assigned_doctor_id = ?
      AND p.status = 'active'
    ORDER BY p.updated_at DESC
    LIMIT ?
  */

  // For now, return empty array - should be replaced with real database query
  return []
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')
    const doctorId = auth.userId

    // TODO: Replace with actual API call to adherelive-be
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/doctors/recent-patients?limit=${limit}`, {
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to fetch recent patients from adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // Get recent patients for this doctor
    const patients = await getRecentPatients(doctorId, limit)

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          patients
        },
        message: 'Recent patients retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching recent patients:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to retrieve recent patients'
          }
        }
      },
      { status: 500 }
    )
  }
}