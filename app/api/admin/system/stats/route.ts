// app/api/admin/system/stats/route.ts - System statistics and overview API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { Specialty, Doctor, User } from '@/prisma/generated/prisma';


export const dynamic = 'force-dynamic';

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
      prisma.vital.count(),
      prisma.secondaryDoctorAssignment.count()
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    const usersByStatus = await prisma.user.groupBy({
      by: ['accountStatus'],
      _count: { id: true }
    });

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: periodDate
        }
      }
    });

    const recentAppointments = await prisma.appointment.count({
      where: {
        createdAt: {
          gte: periodDate
        }
      }
    });

    const recentCarePlans = await prisma.carePlan.count({
      where: {
        createdAt: {
          gte: periodDate
        }
      }
    });

    const activeUsers = await prisma.user.count({
      where: { accountStatus: 'ACTIVE' }
    });

    const verifiedUsers = await prisma.user.count({
      where: { emailVerified: { not: null } }
    });

    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: true
    });

    const carePlansByStatus = await prisma.carePlan.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const assignmentsByStatus = await prisma.secondaryDoctorAssignment.groupBy({
      by: ['consentStatus'],
      _count: { id: true }
    });

    let detailedStats = {};
    
    if (includeDetails) {
      const topSpecialties = await prisma.specialty.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              doctors: true
            }
          }
        },
        orderBy: {
          doctors: {
            _count: 'desc'
          }
        },
        take: 10
      });

      const activeDoctors = await prisma.doctor.findMany({
        select: {
          id: true,
          doctorId: true,
          user: {
            select: {
              name: true,
              firstName: true,
              lastName: true
            }
          },
          specialty: {
            select: { name: true }
          },
          _count: {
            select: {
              appointments: true,
              doctorAssignments: true
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

      const recentActivity = await prisma.user.findMany({
        where: {
          createdAt: {
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
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      detailedStats = {
        topSpecialties: topSpecialties.map((spec) => ({
          id: spec.id,
          name: spec.name,
          doctorCount: spec._count.doctors
        })),
        activeDoctors: activeDoctors.map((doc) => ({
          id: doc.id,
          doctorId: doc.doctorId,
          name: doc.user?.name ||
                `${doc.user?.firstName} ${doc.user?.lastName}`.trim(),
          specialty: doc.specialty?.name,
          appointmentCount: doc._count.appointments,
          assignmentCount: doc._count.doctorAssignments
        })),
        recentActivity: recentActivity.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`.trim(),
          role: user.role,
          createdAt: user.createdAt
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
        byRole: usersByRole.reduce((acc: Record<string, number>, item: { role: string; _count: { id: number } }) => {
          acc[item.role] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byStatus: usersByStatus.reduce((acc: Record<string, number>, item: { accountStatus: string | null; _count: { id: number } }) => {
          if (item.accountStatus) acc[item.accountStatus] = item._count.id;
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
        byStatus: appointmentsByStatus.reduce((acc: Record<string, number>, item: { status: string | null; _count: number }) => {
          if (item.status) acc[item.status] = item._count || 0;
          return acc;
        }, {} as Record<string, number>)
      },
      carePlanStatistics: {
        byStatus: carePlansByStatus.reduce((acc: Record<string, number>, item: { status: string | null; _count: { id: number } }) => {
          if (item.status) acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      assignmentStatistics: {
        byConsentStatus: assignmentsByStatus.reduce((acc: Record<string, number>, item: { consentStatus: string | null; _count: { id: number } }) => {
          acc[item.consentStatus || 'unknown'] = item._count.id;
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
