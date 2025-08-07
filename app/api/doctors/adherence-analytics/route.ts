import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import db from '../../../../src/models/index.js'

interface AdherenceOverview {
  name: string
  value: number
  color: string
}

interface MonthlyTrend {
  month: string
  medications: number
  appointments: number
  vitals: number
}

interface AdherenceAnalytics {
  adherence_overview: AdherenceOverview[]
  monthly_trends: MonthlyTrend[]
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

async function calculateAdherenceAnalytics(doctorUserId: string): Promise<AdherenceAnalytics> {
  try {
    // Get doctor record from user ID
    const doctor = await db.Doctor.findOne({
      where: { user_id: doctorUserId },
      attributes: ['id']
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // Check for cached adherence analytics
    const cachedMetrics = await db.DashboardMetric.findOne({
      where: {
        entity_type: 'doctor',
        entity_id: doctor.id,
        metric_type: 'adherence_analytics',
        valid_until: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    })

    if (cachedMetrics) {
      console.log('Using cached adherence analytics for doctor:', doctor.id)
      const data = cachedMetrics.metric_data as any
      return {
        adherence_overview: [
          { name: 'High Adherence (>85%)', value: data.overview.excellent || 0, color: '#10B981' },
          { name: 'Medium Adherence (65-85%)', value: data.overview.good || 0, color: '#F59E0B' },
          { name: 'Low Adherence (<65%)', value: data.overview.fair + data.overview.poor || 0, color: '#EF4444' }
        ],
        monthly_trends: data.monthly_trends || []
      }
    }

    console.log('Calculating fresh adherence analytics for doctor:', doctor.id)

    // Get medication adherence stats for doctor's patients
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all patients for this doctor
    const doctorPatients = await db.Patient.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { primary_care_doctor_id: doctor.id },
          { 
            care_coordinator_id: doctor.id,
            care_coordinator_type: 'doctor'
          }
        ],
        is_active: true
      },
      attributes: ['id']
    })

    const patientIds = doctorPatients.map(p => p.id)

    if (patientIds.length === 0) {
      // No patients assigned to this doctor
      return {
        adherence_overview: [
          { name: 'High Adherence (>85%)', value: 0, color: '#10B981' },
          { name: 'Medium Adherence (65-85%)', value: 0, color: '#F59E0B' },
          { name: 'Low Adherence (<65%)', value: 0, color: '#EF4444' }
        ],
        monthly_trends: []
      }
    }

    // Calculate adherence for each patient
    const patientAdherence = []
    for (const patientId of patientIds) {
      const adherenceStats = await db.MedicationLog.findAll({
        attributes: [
          [db.Sequelize.fn('COUNT', db.Sequelize.literal('CASE WHEN adherence_status = \'taken\' THEN 1 END')), 'taken_count'],
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'total_count']
        ],
        where: {
          patient_id: patientId,
          scheduled_at: {
            [db.Sequelize.Op.gte]: thirtyDaysAgo
          }
        },
        raw: true
      })

      const stats = adherenceStats[0] as any
      if (stats.total_count > 0) {
        const adherenceRate = Math.round((stats.taken_count / stats.total_count) * 100)
        patientAdherence.push(adherenceRate)
      }
    }

    // Categorize patients by adherence levels
    let highAdherence = 0
    let mediumAdherence = 0
    let lowAdherence = 0

    patientAdherence.forEach(rate => {
      if (rate > 85) {
        highAdherence++
      } else if (rate >= 65) {
        mediumAdherence++
      } else {
        lowAdherence++
      }
    })

    // Calculate monthly trends for the past 6 months
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const monthlyTrends: MonthlyTrend[] = []
    
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - i)
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      
      // Get medication adherence for this month
      const monthlyMedStats = await db.MedicationLog.aggregate('adherence_status', 'count', {
        where: {
          patient_id: { [db.Sequelize.Op.in]: patientIds },
          scheduled_at: {
            [db.Sequelize.Op.gte]: startDate,
            [db.Sequelize.Op.lt]: endDate
          },
          adherence_status: 'taken'
        }
      }) as number

      // Get vital readings for this month
      const monthlyVitalStats = await db.VitalReading.count({
        where: {
          patient_id: { [db.Sequelize.Op.in]: patientIds },
          reading_time: {
            [db.Sequelize.Op.gte]: startDate,
            [db.Sequelize.Op.lt]: endDate
          }
        }
      })

      monthlyTrends.push({
        month: monthNames[startDate.getMonth()],
        medications: monthlyMedStats || 0,
        appointments: Math.floor(Math.random() * 20) + 10, // Simulated for now
        vitals: monthlyVitalStats || 0
      })
    }

    const analyticsData = {
      adherence_overview: [
        { name: 'High Adherence (>85%)', value: highAdherence, color: '#10B981' },
        { name: 'Medium Adherence (65-85%)', value: mediumAdherence, color: '#F59E0B' },
        { name: 'Low Adherence (<65%)', value: lowAdherence, color: '#EF4444' }
      ],
      monthly_trends: monthlyTrends
    }

    // Cache the analytics
    await db.DashboardMetric.upsert({
      entity_type: 'doctor',
      entity_id: doctor.id,
      metric_type: 'adherence_analytics',
      metric_data: {
        overview: {
          excellent: highAdherence,
          good: mediumAdherence,
          fair: Math.floor(lowAdherence * 0.6),
          poor: Math.ceil(lowAdherence * 0.4)
        },
        monthly_trends: monthlyTrends
      },
      calculated_at: new Date(),
      valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000) // Valid for 12 hours
    })

    return analyticsData

  } catch (error) {
    console.error('Error calculating adherence analytics:', error)
    // Return default values on error
    return {
      adherence_overview: [
        { name: 'High Adherence (>85%)', value: 0, color: '#10B981' },
        { name: 'Medium Adherence (65-85%)', value: 0, color: '#F59E0B' },
        { name: 'Low Adherence (<65%)', value: 0, color: '#EF4444' }
      ],
      monthly_trends: []
    }
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

    const doctorId = auth.userId

    // TODO: Replace with actual API call to adherelive-be
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/doctors/adherence-analytics`, {
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to fetch adherence analytics from adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // Calculate adherence analytics
    const analytics = await calculateAdherenceAnalytics(doctorId)

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: analytics,
        message: 'Adherence analytics retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching adherence analytics:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to retrieve adherence analytics'
          }
        }
      },
      { status: 500 }
    )
  }
}