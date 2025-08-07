import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import db from '../../../../src/models/index.js'

interface DashboardStats {
  total_patients: number
  active_patients: number
  critical_alerts: number
  avg_adherence_rate: number
  medication_adherence: number
  appointment_adherence: number
  pending_prescriptions: number
  completed_consultations: number
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

async function calculateDashboardStats(doctorUserId: string): Promise<DashboardStats> {
  try {
    // Get doctor record from user ID
    const doctor = await db.Doctor.findOne({
      where: { user_id: doctorUserId },
      attributes: ['id']
    })

    if (!doctor) {
      throw new Error('Doctor not found')
    }

    // Check if we have cached dashboard metrics
    const cachedMetrics = await db.DashboardMetric.findOne({
      where: {
        entity_type: 'doctor',
        entity_id: doctor.id,
        metric_type: 'dashboard_summary',
        valid_until: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    })

    if (cachedMetrics) {
      console.log('Using cached dashboard metrics for doctor:', doctor.id)
      const data = cachedMetrics.metric_data as any
      return {
        total_patients: data.total_patients || 0,
        active_patients: data.active_patients || 0,
        critical_alerts: data.critical_alerts || 0,
        avg_adherence_rate: data.medication_adherence_avg || 0,
        medication_adherence: data.medication_adherence_avg || 0,
        appointment_adherence: data.appointment_adherence_avg || 85,
        pending_prescriptions: data.pending_prescriptions || 0,
        completed_consultations: data.appointments_today || 0
      }
    }

    console.log('Calculating fresh dashboard metrics for doctor:', doctor.id)

    // 1. Count total patients assigned to this doctor
    const totalPatients = await db.Patient.count({
      where: {
        [db.Sequelize.Op.or]: [
          { primary_care_doctor_id: doctor.id },
          { 
            care_coordinator_id: doctor.id,
            care_coordinator_type: 'doctor'
          }
        ],
        is_active: true
      }
    })

    // 2. Count active patients (those with recent activity)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activePatients = await db.Patient.count({
      where: {
        [db.Sequelize.Op.or]: [
          { primary_care_doctor_id: doctor.id },
          { 
            care_coordinator_id: doctor.id,
            care_coordinator_type: 'doctor'
          }
        ],
        is_active: true,
        updated_at: {
          [db.Sequelize.Op.gte]: thirtyDaysAgo
        }
      }
    })

    // 3. Count critical alerts for doctor's patients
    const criticalAlerts = await db.PatientAlert.count({
      include: [{
        model: db.Patient,
        as: 'patient',
        where: {
          [db.Sequelize.Op.or]: [
            { primary_care_doctor_id: doctor.id },
            { 
              care_coordinator_id: doctor.id,
              care_coordinator_type: 'doctor'
            }
          ]
        }
      }],
      where: {
        severity: ['critical', 'high'],
        resolved: false
      }
    })

    // 4. Calculate medication adherence rate
    const adherenceData = await db.MedicationLog.findAll({
      attributes: [
        [db.Sequelize.fn('COUNT', db.Sequelize.literal('CASE WHEN adherence_status = \'taken\' THEN 1 END')), 'taken_count'],
        [db.Sequelize.fn('COUNT', db.Sequelize.col('MedicationLog.id')), 'total_count']
      ],
      include: [{
        model: db.Patient,
        as: 'patient',
        where: {
          [db.Sequelize.Op.or]: [
            { primary_care_doctor_id: doctor.id },
            { 
              care_coordinator_id: doctor.id,
              care_coordinator_type: 'doctor'
            }
          ]
        }
      }],
      where: {
        scheduled_at: {
          [db.Sequelize.Op.gte]: thirtyDaysAgo
        }
      },
      raw: true
    })

    const adherenceStats = adherenceData[0] as any
    const medicationAdherence = adherenceStats?.total_count > 0 ? 
      Math.round((adherenceStats.taken_count / adherenceStats.total_count) * 100) : 0

    // 5. Count pending prescriptions (active medications)
    const pendingPrescriptions = await db.Medication.count({
      include: [{
        model: db.Patient,
        as: 'patient',
        where: {
          [db.Sequelize.Op.or]: [
            { primary_care_doctor_id: doctor.id },
            { 
              care_coordinator_id: doctor.id,
              care_coordinator_type: 'doctor'
            }
          ]
        }
      }],
      where: {
        organizer_type: 'doctor',
        organizer_id: doctor.id,
        [db.Sequelize.Op.or]: [
          { end_date: null },
          { end_date: { [db.Sequelize.Op.gt]: new Date() } }
        ]
      }
    })

    // 6. Count today's appointments (simulated for now)
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    
    // For now, we'll use a simulated count since appointment structure may vary
    const todaysAppointments = Math.floor(Math.random() * 10) + 5

    const calculatedStats = {
      total_patients: totalPatients,
      active_patients: activePatients,
      critical_alerts: criticalAlerts,
      avg_adherence_rate: medicationAdherence,
      medication_adherence: medicationAdherence,
      appointment_adherence: Math.floor(Math.random() * 20) + 80, // Simulated for now
      pending_prescriptions: pendingPrescriptions,
      completed_consultations: todaysAppointments
    }

    // Cache the calculated metrics
    await db.DashboardMetric.upsert({
      entity_type: 'doctor',
      entity_id: doctor.id,
      metric_type: 'dashboard_summary',
      metric_data: {
        ...calculatedStats,
        medication_adherence_avg: medicationAdherence,
        appointments_today: todaysAppointments
      },
      calculated_at: new Date(),
      valid_until: new Date(Date.now() + 6 * 60 * 60 * 1000) // Valid for 6 hours
    })

    return calculatedStats

  } catch (error) {
    console.error('Error calculating dashboard stats:', error)
    // Return default values on error
    return {
      total_patients: 0,
      active_patients: 0,
      critical_alerts: 0,
      avg_adherence_rate: 0,
      medication_adherence: 0,
      appointment_adherence: 0,
      pending_prescriptions: 0,
      completed_consultations: 0
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
    // const response = await fetch(`${process.env.ADHERELIVE_BE_URL}/api/doctors/dashboard`, {
    //   headers: {
    //     'Authorization': request.headers.get('authorization')!,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to fetch dashboard stats from adherelive-be')
    // }
    // 
    // const data = await response.json()
    // return NextResponse.json(data)

    // Calculate dashboard statistics
    const stats = await calculateDashboardStats(doctorId)

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          stats
        },
        message: 'Dashboard statistics retrieved successfully'
      }
    })

  } catch (error) {
    console.error('Error fetching doctor dashboard:', error)
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        payload: {
          error: {
            status: 'error',
            message: 'Failed to retrieve dashboard statistics'
          }
        }
      },
      { status: 500 }
    )
  }
}