import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// This would normally connect to your adherelive-be backend
// For now, we'll create a proper structure that can be easily connected

interface PatientDashboardData {
  adherence_summary: {
    today: {
      medications_due: number
      medications_taken: number
      vitals_due: number
      vitals_recorded: number
      exercises_due: number
      exercises_completed: number
    }
    weekly: {
      adherence_rate: number
      missed_medications: number
      completed_activities: number
    }
    monthly: {
      overall_score: number
      trend: 'improving' | 'declining' | 'stable'
    }
  }
  upcoming_events: Array<{
    id: string
    event_type: 'MEDICATION' | 'VITAL_CHECK' | 'EXERCISE' | 'DIET_LOG' | 'APPOINTMENT'
    title: string
    description?: string
    scheduled_for: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    status: 'SCHEDULED' | 'PENDING' | 'COMPLETED' | 'MISSED'
    event_data: any
  }>
  overdue_items: Array<{
    id: string
    type: string
    title: string
    due_date: string
    hours_overdue: number
    priority: string
  }>
  recent_activities: Array<{
    id: string
    type: string
    title: string
    completed_at: string
    result: any
  }>
  health_metrics: {
    weight: { value: number; date: string; trend: 'up' | 'down' | 'stable' }
    blood_pressure: { systolic: number; diastolic: number; date: string }
    heart_rate: { value: number; date: string }
    blood_sugar: { value: number; date: string }
  }
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info' | 'success'
    title: string
    message: string
    action_required: boolean
    created_at: string
  }>
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

async function calculatePatientDashboard(patientId: string): Promise<PatientDashboardData> {
  // TODO: Replace with actual database queries to calculate real patient data
  // These calculations should be moved to adherelive-be backend
  
  /*
  // Example SQL queries for real data calculations:
  
  // 1. Today's medication adherence
  const todaysMeds = await db.query(`
    SELECT 
      COUNT(*) as medications_due,
      COUNT(ml.taken_at) as medications_taken
    FROM medications m
    LEFT JOIN medication_logs ml ON m.id = ml.medication_id 
      AND DATE(ml.scheduled_at) = CURDATE()
    WHERE m.patient_id = ?
      AND m.status = 'active'
  `, [patientId])

  // 2. Weekly adherence rates  
  const weeklyStats = await db.query(`
    SELECT 
      ROUND(AVG(CASE WHEN ml.taken_at IS NOT NULL THEN 100 ELSE 0 END), 1) as adherence_rate,
      COUNT(CASE WHEN ml.taken_at IS NULL AND ml.scheduled_at < NOW() THEN 1 END) as missed_medications,
      COUNT(CASE WHEN ml.taken_at IS NOT NULL THEN 1 END) as completed_activities
    FROM medication_logs ml
    JOIN medications m ON ml.medication_id = m.id
    WHERE m.patient_id = ?
      AND ml.scheduled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `, [patientId])

  // 3. Latest vital readings with trend analysis
  const latestVitals = await db.query(`
    SELECT 
      vr1.vital_type,
      vr1.value,
      vr1.systolic, 
      vr1.diastolic,
      vr1.created_at,
      CASE 
        WHEN vr1.value > COALESCE(vr2.value, 0) THEN 'up'
        WHEN vr1.value < COALESCE(vr2.value, 0) THEN 'down' 
        ELSE 'stable'
      END as trend
    FROM vital_readings vr1
    LEFT JOIN vital_readings vr2 ON vr1.patient_id = vr2.patient_id
      AND vr1.vital_type = vr2.vital_type
      AND vr2.created_at < vr1.created_at
    WHERE vr1.patient_id = ?
      AND vr1.created_at IN (
        SELECT MAX(created_at)
        FROM vital_readings vr3  
        WHERE vr3.patient_id = ? AND vr3.vital_type = vr1.vital_type
      )
  `, [patientId, patientId])

  // 4. Upcoming events from schedules
  const upcomingEvents = await db.query(`
    SELECT * FROM (
      SELECT 
        CONCAT('med_', ml.id) as id,
        'MEDICATION' as event_type,
        CONCAT('Take ', m.name, ' ', m.dosage) as title,
        m.instructions as description,
        ml.scheduled_at as scheduled_for,
        CASE WHEN m.is_critical THEN 'HIGH' ELSE 'MEDIUM' END as priority,
        'SCHEDULED' as status,
        JSON_OBJECT('medication_id', m.id) as event_data
      FROM medication_logs ml
      JOIN medications m ON ml.medication_id = m.id
      WHERE m.patient_id = ? 
        AND ml.taken_at IS NULL
        AND ml.scheduled_at > NOW()
        AND ml.scheduled_at <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
    UNION ALL
      SELECT
        CONCAT('appt_', a.id) as id,
        'APPOINTMENT' as event_type,
        a.title,
        a.notes as description,
        a.appointment_date as scheduled_for,
        'HIGH' as priority,
        a.status,
        JSON_OBJECT('appointment_id', a.id) as event_data  
      FROM appointments a
      WHERE a.patient_id = ?
        AND a.appointment_date > NOW()
        AND a.appointment_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
    ) events
    ORDER BY scheduled_for ASC
  `, [patientId, patientId])
  */

  // Return structure with placeholders - replace with real calculations
  return {
    adherence_summary: {
      today: {
        medications_due: 0, // From today's medication schedule
        medications_taken: 0, // From completed medication logs  
        vitals_due: 0, // From vital requirements
        vitals_recorded: 0, // From today's vital readings
        exercises_due: 0, // From exercise schedule
        exercises_completed: 0 // From exercise logs
      },
      weekly: {
        adherence_rate: 0, // Weekly medication adherence percentage
        missed_medications: 0, // Count of missed medications this week
        completed_activities: 0 // All completed health activities
      },
      monthly: {
        overall_score: 0, // Composite health score based on all metrics
        trend: 'stable' // Compare with previous month
      }
    },
    upcoming_events: [], // Upcoming medication times, appointments, etc
    overdue_items: [], // Overdue medications, missed appointments
    recent_activities: [], // Recently completed activities
    health_metrics: {
      weight: { value: 0, date: new Date().toISOString(), trend: 'stable' },
      blood_pressure: { systolic: 0, diastolic: 0, date: new Date().toISOString() },
      heart_rate: { value: 0, date: new Date().toISOString() },
      blood_sugar: { value: 0, date: new Date().toISOString() }
    },
    alerts: [] // Active health alerts
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
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/patients/${patientId}/dashboard`, {
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to fetch data from adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // Calculate patient dashboard data
    const dashboardData = await calculatePatientDashboard(patientId)

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: dashboardData,
        message: 'Patient dashboard data retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching patient dashboard:', error)
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