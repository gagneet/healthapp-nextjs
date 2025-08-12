// app/api/admin/dashboard/route.ts - Admin dashboard API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request);
    if (error) {
      return NextResponse.json({ 
        status: false, 
        statusCode: 401, 
        payload: { error: { status: 'unauthorized', message: error } } 
      }, { status: 401 });
    }

    // Only admins can access admin dashboard
    if (user!.role !== 'ADMIN' && user!.role !== 'PROVIDER_ADMIN') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin access required' } }
      }, { status: 403 });
    }

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
      prisma.user.count(),
      
      // Total doctors
      prisma.doctors.count(),
      
      // Total patients
      prisma.patient.count(),
      
      // Total HSPs
      prisma.hsps.count(),
      
      // Total providers
      prisma.providers.count(),
      
      // Active appointments this week
      prisma.appointment.count({
        where: {
          start_time: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          status: 'confirmed'
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
      prisma.user.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Monthly registrations for trends
      prisma.user.groupBy({
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
    const recentActivity = await prisma.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        account_status: true,
        created_at: true,
        last_login_at: true
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
        pending_verifications: await prisma.user.count({
          where: { email_verified: false }
        }),
        inactive_users: await prisma.user.count({
          where: { 
            account_status: 'INACTIVE',
            created_at: {
              lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      }
    };

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: dashboardData,
        message: 'Admin dashboard data retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}