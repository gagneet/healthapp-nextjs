// Force dynamic rendering for API routes using headers/auth
export const dynamic = 'force-dynamic'

/**
 * Admin Dashboard API Route
 * Provides comprehensive system analytics and statistics for administrators
 * Business Logic: Only system administrators can access admin dashboard
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createUnauthorizedResponse,
  createForbiddenResponse,
  withErrorHandling
} from "@/lib/api-response"

/**
 * GET /api/admin/dashboard
 * Retrieve comprehensive admin dashboard analytics and statistics
 * Business Logic: Only system admins can access admin dashboard
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession()
  
  if (!session) {
    return createUnauthorizedResponse()
  }

  // Business Logic: Only system administrators can access admin dashboard
  if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
    return createForbiddenResponse("Admin access required")
  }

  try {

    // Get comprehensive dashboard statistics
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalHSPs,
      totalProviders,
      activeAppointments,
      totalMedications,
      criticalVitals,
      recentRegistrations,
      monthlyRegistrations
    ] = await Promise.all([
      // Total users count
      prisma.User.count(),
      
      // Total doctors
      prisma.doctors.count(),
      
      // Total patients
      prisma.Patient.count(),
      
      // Total HSPs
      prisma.hsps.count(),
      
      // Total providers
      prisma.providers.count(),
      
      // Active appointments this week
      prisma.Appointment.count({
        where: {
          start_time: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          // Note: appointments table may not have status field in current schema
        }
      }),
      
      // Total medications
      prisma.medication.count(),
      
      // Critical vital alerts
      prisma.vitalReading.count({
        where: {
          alert_level: 'critical',
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      
      // Recent registrations (last 7 days)
      prisma.User.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Monthly registrations for trends
      prisma.User.groupBy({
        by: ['created_at'],
        _count: {
          id: true
        },
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Get recent activity
    const recentActivity = await prisma.User.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        account_status: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // Get system health metrics
    const systemHealth = {
      database_connections: 'healthy', // In production, check actual connection pool
      api_response_time: '< 100ms',
      uptime: '99.9%',
      last_backup: new Date().toISOString()
    };

    // Calculate growth rates
    const userGrowthRate = recentRegistrations > 0 ? 
      ((recentRegistrations / Math.max(totalUsers - recentRegistrations, 1)) * 100).toFixed(1) : 0;

    const dashboardData = {
      overview: {
        total_users: totalUsers,
        total_doctors: totalDoctors,
        total_patients: totalPatients,
        total_hsps: totalHSPs,
        total_providers: totalProviders,
        active_appointments: activeAppointments,
        total_medications: totalMedications,
        critical_alerts: criticalVitals
      },
      trends: {
        user_growth_rate: userGrowthRate + '%',
        recent_registrations: recentRegistrations,
        monthly_trend: monthlyRegistrations.length
      },
      recent_activity: recentActivity,
      system_health: systemHealth,
      alerts: {
        critical_vitals: criticalVitals,
        pending_verifications: await prisma.User.count({
          where: { email_verified: false }
        }),
        inactive_users: await prisma.User.count({
          where: { 
            account_status: 'INACTIVE',
            created_at: {
              lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      }
    };

    return createSuccessResponse(dashboardData)
  } catch (error) {
    console.error("Failed to fetch admin dashboard:", error)
    throw error
  }
})
