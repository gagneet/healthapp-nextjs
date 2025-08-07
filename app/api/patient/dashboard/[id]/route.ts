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

    // For now, return a structured response that matches the expected format
    // This should be replaced with actual data from adherelive-be backend
    const dashboardData: PatientDashboardData = {
      adherence_summary: {
        today: {
          medications_due: 0,
          medications_taken: 0,
          vitals_due: 0,
          vitals_recorded: 0,
          exercises_due: 0,
          exercises_completed: 0
        },
        weekly: {
          adherence_rate: 0,
          missed_medications: 0,
          completed_activities: 0
        },
        monthly: {
          overall_score: 0,
          trend: 'stable'
        }
      },
      upcoming_events: [],
      overdue_items: [],
      recent_activities: [],
      health_metrics: {
        weight: { value: 0, date: new Date().toISOString(), trend: 'stable' },
        blood_pressure: { systolic: 0, diastolic: 0, date: new Date().toISOString() },
        heart_rate: { value: 0, date: new Date().toISOString() },
        blood_sugar: { value: 0, date: new Date().toISOString() }
      },
      alerts: []
    }

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