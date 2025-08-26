// app/api/admin/system/stats/route.ts - System statistics and overview API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        status: false,
        statusCode: 401,
        payload: { error: { status: 'unauthorized', message: 'Authentication required' } }
      }, { status: 401 });
    }

    // Only admins can view system statistics
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin access required' } }
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // Days
    const includeDetails = searchParams.get('details') === 'true';

    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(period));

    // Basic counts
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalHSPs,
      totalAppointments,
      totalCarePlans,
      totalMedications,
      totalVitals,
      totalSecondaryAssignments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.hsp.count(),
      prisma.appointment.count(),
      prisma.carePlan.count(),
      prisma.medication.count(),
      prisma.vitals.count(),
      prisma.secondary_doctor_assignments.count()
    ]);

    // User statistics by role and status
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    const usersByStatus = await prisma.user.groupBy({
      by: ['account_status'],
      _count: { id: true }
    });

    // Recent activity (last 30 days)
    const recentUsers = await prisma.user.count({
      where: {
        created_at: {
          gte: periodDate
        }
      }
    });

    const recentAppointments = await prisma.appointment.count({
      where: {
        created_at: {
          gte: periodDate
        }
      }
    });

    const recentCarePlans = await prisma.carePlan.count({
      where: {
        created_at: {
          gte: periodDate
        }
      }
    });

    // System health metrics
    const activeUsers = await prisma.user.count({
      where: { accountStatus: 'ACTIVE' }
    });

    const verifiedUsers = await prisma.user.count({
      where: { emailVerifiedLegacy: true }
    });

    // Appointment statistics
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // Care plan statistics
    const carePlansByStatus = await prisma.carePlan.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // Secondary assignment statistics
    const assignmentsByStatus = await prisma.secondary_doctor_assignments.groupBy({
      by: ['consent_status'],
      _count: { id: true }
    });

    let detailedStats = {};
    
    if (includeDetails) {
      // Top specialties
      const topSpecialties = await prisma.speciality.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              Doctor: true
            }
          }
        },
        orderBy: {
          Doctor: {
            _count: 'desc'
          }
        },
        take: 10
      });

      // Most active doctors (by appointment count)
      const activeDoctors = await prisma.doctor.findMany({
        select: {
          id: true,
          doctor_id: true,
          users_Doctor_user_idTousers: {
            select: {
              name: true,
              firstName: true,
              lastName: true
            }
          },
          specialities: {
            select: { name: true }
          },
          _count: {
            select: {
              appointments: true,
              doctor_assignments: true
            }
          }
        },
        orderBy: {
          appointments: {
            _count: 'desc'
          }
        },
        take: 10
      });

      // Recent system activity
      const recentActivity = await prisma.user.findMany({
        where: {
          created_at: {
            gte: periodDate
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' },
        take: 20
      });

      detailedStats = {
        topSpecialties: topSpecialties.map(spec => ({
          id: spec.id,
          name: spec.name,
          doctorCount: spec._count.Doctor
        })),
        activeDoctors: activeDoctors.map(doc => ({
          id: doc.id,
          doctor_id: doc.doctor_id,
          name: doc.users_Doctor_user_idTousers?.name || 
                `${doc.users_Doctor_user_idTousers?.first_name} ${doc.users_Doctor_user_idTousers?.last_name}`.trim(),
          specialty: doc.specialities?.name,
          appointmentCount: doc._count.appointments,
          assignmentCount: doc._count.doctor_assignments
        })),
        recentActivity: recentActivity.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name || `${user.first_name} ${user.last_name}`.trim(),
          role: user.role,
          createdAt: user.created_at
        }))
      };
    }

    const systemStats = {
      overview: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalHSPs,
        totalAppointments,
        totalCarePlans,
        totalMedications,
        totalVitals,
        totalSecondaryAssignments
      },
      userStatistics: {
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byStatus: usersByStatus.reduce((acc, item) => {
          acc[item.account_status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        activeUsers,
        verifiedUsers,
        verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0
      },
      recentActivity: {
        period: parseInt(period),
        newUsers: recentUsers,
        newAppointments: recentAppointments,
        newCarePlans: recentCarePlans
      },
      appointmentStatistics: {
        byStatus: appointmentsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      carePlanStatistics: {
        byStatus: carePlansByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      assignmentStatistics: {
        byConsentStatus: assignmentsByStatus.reduce((acc, item) => {
          acc[item.consent_status || 'unknown'] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      systemHealth: {
        activeUserRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        doctorPatientRatio: totalPatients > 0 ? Math.round((totalDoctors / totalPatients) * 100) / 100 : 0
      },
      ...detailedStats
    };

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: systemStats,
        message: 'System statistics retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching system statistics:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
