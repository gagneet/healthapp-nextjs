// app/api/patient/dashboard/[patientId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Op } from 'sequelize'
import db from '@/src/models'

const {
  Patient,
  User,
  ScheduledEvent,
  AdherenceRecord,
  VitalReading,
  Symptom,
  Medication,
  Medicine,
  Appointment
} = db

interface DashboardParams {
  patientId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: DashboardParams }
) {
  try {
    const { patientId } = params

    // Find patient by user ID or patient ID
    const patient = await Patient.findOne({
      where: {
        [Op.or]: [
          { user_id: patientId },
          { id: patientId },
          { patient_id: patientId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'gender']
        }
      ]
    })

    if (!patient) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: {
          error: {
            status: 'error',
            message: 'Patient not found'
          }
        }
      }, { status: 404 })
    }

    const currentDate = new Date()
    const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const weekStart = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get today's events
    const todayEvents = await ScheduledEvent.findAll({
      where: {
        patient_id: patient.id,
        scheduled_for: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      order: [['scheduled_for', 'ASC']]
    })

    // Get upcoming events (next 7 days)
    const upcomingEvents = await ScheduledEvent.findAll({
      where: {
        patient_id: patient.id,
        scheduled_for: {
          [Op.between]: [currentDate, new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)]
        },
        status: {
          [Op.in]: ['SCHEDULED', 'PENDING']
        }
      },
      order: [['scheduled_for', 'ASC']],
      limit: 10
    })

    // Get overdue events
    const overdueEvents = await ScheduledEvent.findAll({
      where: {
        patient_id: patient.id,
        scheduled_for: {
          [Op.lt]: currentDate
        },
        status: {
          [Op.notIn]: ['COMPLETED', 'CANCELLED', 'MISSED']
        }
      },
      order: [['scheduled_for', 'ASC']]
    })

    // Get recent completed activities
    const recentActivities = await ScheduledEvent.findAll({
      where: {
        patient_id: patient.id,
        status: 'COMPLETED',
        completed_at: {
          [Op.gte]: weekStart
        }
      },
      order: [['completed_at', 'DESC']],
      limit: 10
    })

    // Get adherence records for calculations
    const weeklyAdherence = await AdherenceRecord.findAll({
      where: {
        patient_id: patient.id,
        due_at: {
          [Op.gte]: weekStart
        }
      }
    })

    const monthlyAdherence = await AdherenceRecord.findAll({
      where: {
        patient_id: patient.id,
        due_at: {
          [Op.gte]: monthStart
        }
      }
    })

    // Get recent vitals
    const recentVitals = await VitalReading.findAll({
      where: {
        patient_id: patient.id,
        reading_time: {
          [Op.gte]: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['reading_time', 'DESC']],
      limit: 20
    })

    // Get recent symptoms
    const recentSymptoms = await Symptom.findAll({
      where: {
        patient_id: patient.id,
        created_at: {
          [Op.gte]: monthStart
        }
      },
      order: [['created_at', 'DESC']],
      limit: 10
    })

    // Calculate today's summary
    const todayMedications = todayEvents.filter(e => e.event_type === 'MEDICATION')
    const todayVitals = todayEvents.filter(e => e.event_type === 'VITAL_CHECK')
    const todayExercises = todayEvents.filter(e => e.event_type === 'EXERCISE')

    const todaySummary = {
      medications_due: todayMedications.length,
      medications_taken: todayMedications.filter(e => e.status === 'COMPLETED').length,
      vitals_due: todayVitals.length,
      vitals_recorded: todayVitals.filter(e => e.status === 'COMPLETED').length,
      exercises_due: todayExercises.length,
      exercises_completed: todayExercises.filter(e => e.status === 'COMPLETED').length
    }

    // Calculate weekly adherence
    const weeklyTotal = weeklyAdherence.length
    const weeklyCompleted = weeklyAdherence.filter(r => r.is_completed).length
    const weeklyMissed = weeklyAdherence.filter(r => r.is_missed).length
    const weeklyRate = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 100

    // Calculate monthly score
    const monthlyTotal = monthlyAdherence.length
    const monthlyCompleted = monthlyAdherence.filter(r => r.is_completed).length
    const monthlyScore = monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 100

    // Process health metrics from recent vitals
    const latestWeight = recentVitals
      .filter(v => v.vital_type === 'weight')
      .sort((a, b) => new Date(b.reading_time).getTime() - new Date(a.reading_time).getTime())[0]

    const latestBP = recentVitals
      .filter(v => v.vital_type === 'blood_pressure')
      .sort((a, b) => new Date(b.reading_time).getTime() - new Date(a.reading_time).getTime())[0]

    const latestGlucose = recentVitals
      .filter(v => v.vital_type === 'blood_glucose')
      .sort((a, b) => new Date(b.reading_time).getTime() - new Date(a.reading_time).getTime())[0]

    // Generate alerts based on data
    const alerts = []

    // Check for overdue medications
    const overdueMedications = overdueEvents.filter(e => e.event_type === 'MEDICATION')
    if (overdueMedications.length > 0) {
      alerts.push({
        id: 'overdue_meds',
        type: 'warning' as const,
        title: 'Medications Overdue',
        message: `You have ${overdueMedications.length} overdue medication${overdueMedications.length > 1 ? 's' : ''}. Please take them now or contact your healthcare provider.`,
        action_required: true,
        created_at: new Date().toISOString()
      })
    }

    // Check for low adherence
    if (weeklyRate < 80) {
      alerts.push({
        id: 'low_adherence',
        type: 'error' as const,
        title: 'Low Medication Adherence',
        message: `Your weekly adherence rate is ${weeklyRate}%. Consistent medication taking is important for your health.`,
        action_required: true,
        created_at: new Date().toISOString()
      })
    }

    // Check for high blood pressure
    if (latestBP && (latestBP.systolic_value > 140 || latestBP.diastolic_value > 90)) {
      alerts.push({
        id: 'high_bp',
        type: 'warning' as const,
        title: 'Elevated Blood Pressure',
        message: `Your latest reading was ${latestBP.systolic_value}/${latestBP.diastolic_value}. Consider contacting your healthcare provider.`,
        action_required: false,
        created_at: new Date().toISOString()
      })
    }

    // Process overdue items with hours calculation
    const overdueItems = overdueEvents.map(event => {
      const hoursOverdue = Math.floor((currentDate.getTime() - new Date(event.scheduled_for).getTime()) / (1000 * 60 * 60))
      return {
        id: event.id,
        type: event.event_type,
        title: event.title,
        due_date: event.scheduled_for,
        hours_overdue: hoursOverdue,
        priority: event.priority
      }
    })

    // Format response data
    const dashboardData = {
      adherence_summary: {
        today: todaySummary,
        weekly: {
          adherence_rate: weeklyRate,
          missed_medications: weeklyMissed,
          completed_activities: weeklyCompleted
        },
        monthly: {
          overall_score: monthlyScore,
          trend: monthlyScore > 85 ? 'improving' : monthlyScore < 70 ? 'declining' : 'stable'
        }
      },
      upcoming_events: upcomingEvents.map(event => ({
        id: event.id,
        event_type: event.event_type,
        title: event.title,
        description: event.description,
        scheduled_for: event.scheduled_for,
        priority: event.priority,
        status: event.status,
        event_data: event.event_data
      })),
      overdue_items: overdueItems,
      recent_activities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.event_type,
        title: activity.title,
        completed_at: activity.completed_at,
        result: activity.event_data
      })),
      health_metrics: {
        weight: latestWeight ? {
          value: latestWeight.numeric_value,
          date: latestWeight.reading_time,
          trend: 'stable' as const // Could calculate trend from historical data
        } : null,
        blood_pressure: latestBP ? {
          systolic: latestBP.systolic_value,
          diastolic: latestBP.diastolic_value,
          date: latestBP.reading_time
        } : null,
        heart_rate: null, // No heart rate data in current schema
        blood_sugar: latestGlucose ? {
          value: latestGlucose.numeric_value,
          date: latestGlucose.reading_time
        } : null
      },
      alerts,
      patient_info: {
        id: patient.id,
        user_id: patient.user_id,
        name: `${patient.user.first_name} ${patient.user.last_name}`,
        gender: patient.user.gender,
        adherence_score: patient.overall_adherence_score
      }
    }

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: dashboardData,
        message: 'Dashboard data retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching patient dashboard data:', error)
    
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: {
        error: {
          status: 'error',
          message: 'Failed to fetch dashboard data'
        }
      }
    }, { status: 500 })
  }
}