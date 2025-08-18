// app/api/admin/system/stats/route.ts - System statistics and overview API
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
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
      prisma.User.count(),
      prisma.doctors.count(),
      prisma.Patient.count(),
      prisma.hsps.count(),
      prisma.appointments.count(),
      prisma.care_plans.count(),
      prisma.medications.count(),
      prisma.vitals.count(),
      prisma.secondary_doctor_assignments.count()
    ]);

    // User statistics by role and status
    const usersByRole = await prisma.User.groupBy({
      by: ['role'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    const usersByStatus = await prisma.User.groupBy({
      by: ['account_status'],
      _count: { id: true }
    });

    // Recent activity (last 30 days)
    const recentUsers = await prisma.User.count({
      where: {
        created_at: {
          gte: periodDate
        }
      }
    });

    const recentAppointments = await prisma.appointments.count({
      where: {
        created_at: {
          gte: periodDate
        }
      }
    });

    const recentCarePlans = await prisma.care_plans.count({
      where: {
        created_at: {
          gte: periodDate
        }
      }
    });

    // System health metrics
    const activeUsers = await prisma.User.count({
      where: { account_status: 'ACTIVE' }
    });

    const verifiedUsers = await prisma.User.count({
      where: { email_verified: true }
    });

    // Appointment statistics
    const appointmentsByStatus = await prisma.appointments.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // Care plan statistics
    const carePlansByStatus = await prisma.care_plans.groupBy({
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
              doctors_doctors_speciality_idTospecialiy: true
            }
          }
        },
        orderBy: {
          doctors_doctors_speciality_idTospecialiy: {
            _count: 'desc'
          }
        },
        take: 10
      });

      // Most active doctors (by appointment count)
      const activeDoctors = await prisma.doctors.findMany({
        select: {
          id: true,
          doctor_id: true,
          users_doctors_user_idTousers: {
            select: {
              name: true,
              first_name: true,
              last_name: true
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
      const recentActivity = await prisma.User.findMany({
        where: {
          created_at: {
            gte: periodDate
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          first_name: true,
          last_name: true,
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
          doctorCount: spec._count.doctors_doctors_speciality_idTospecialiy
        })),
        activeDoctors: activeDoctors.map(doc => ({
          id: doc.id,
          doctor_id: doc.doctor_id,
          name: doc.users_doctors_user_idTousers?.name || 
                `${doc.users_doctors_user_idTousers?.first_name} ${doc.users_doctors_user_idTousers?.last_name}`.trim(),
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
