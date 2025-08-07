import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface CriticalAlert {
  id: string
  patient_id: string
  patient_name: string
  alert_type: 'medication_missed' | 'vital_abnormal' | 'appointment_missed' | 'emergency'
  severity: 'HIGH' | 'CRITICAL'
  title: string
  message: string
  created_at: string
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
  data?: any
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

async function getCriticalAlerts(doctorId: string, limit: number): Promise<CriticalAlert[]> {
  // TODO: Replace with actual database query
  // Example query needed:
  /*
    SELECT 
      a.*,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name
    FROM alerts a
    JOIN patients p ON a.patient_id = p.id
    WHERE p.assigned_doctor_id = ?
      AND a.severity IN ('HIGH', 'CRITICAL')
      AND a.status = 'ACTIVE'
    ORDER BY 
      CASE a.severity 
        WHEN 'CRITICAL' THEN 1 
        WHEN 'HIGH' THEN 2 
        ELSE 3 
      END,
      a.created_at DESC
    LIMIT ?
  */

  // Example calculations for different alert types:
  /*
    // Medication adherence alerts
    const missedMeds = await db.query(`
      SELECT 
        ml.medication_id,
        m.name as medication_name,
        p.id as patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        COUNT(*) as missed_count
      FROM medication_logs ml
      JOIN medications m ON ml.medication_id = m.id
      JOIN patients p ON m.patient_id = p.id
      WHERE p.assigned_doctor_id = ?
        AND ml.taken_at IS NULL
        AND ml.scheduled_at < DATE_SUB(NOW(), INTERVAL 4 HOUR)
        AND m.is_critical = 1
      GROUP BY ml.medication_id, p.id
      HAVING missed_count >= 2
    `, [doctorId])

    // Abnormal vital signs
    const abnormalVitals = await db.query(`
      SELECT 
        vr.*,
        p.id as patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name
      FROM vital_readings vr
      JOIN patients p ON vr.patient_id = p.id
      WHERE p.assigned_doctor_id = ?
        AND vr.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND (
          (vr.vital_type = 'blood_pressure' AND (vr.systolic > 180 OR vr.diastolic > 110)) OR
          (vr.vital_type = 'heart_rate' AND (vr.value > 120 OR vr.value < 50)) OR
          (vr.vital_type = 'blood_glucose' AND (vr.value > 300 OR vr.value < 70))
        )
    `, [doctorId])
  */

  // For now, return empty array - should be replaced with real calculations
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
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/doctors/critical-alerts?limit=${limit}`, {
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to fetch critical alerts from adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // Get critical alerts for this doctor's patients
    const alerts = await getCriticalAlerts(doctorId, limit)

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          alerts
        },
        message: 'Critical alerts retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching critical alerts:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to retrieve critical alerts'
          }
        }
      },
      { status: 500 }
    )
  }
}