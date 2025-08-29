import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type AdherenceRecordWithPatient = Prisma.AdherenceRecordGetPayload<{
  include: {
    patient: {
      select: {
        id: true,
        patientId: true,
        overallAdherenceScore: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    }
  }
}>;

type PatientStats = Prisma.PatientGetPayload<{
  select: {
    id: true,
    patientId: true,
    overallAdherenceScore: true,
    user: {
      select: {
        firstName: true,
        lastName: true,
        name: true
      }
    }
  }
}>;

type DayRecord = Prisma.AdherenceRecordGetPayload<{}>;

/**
 * GET /api/doctors/adherence-analytics
 * Get medication adherence analytics for the authenticated doctor's patients
 */
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

    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Only doctors can access this endpoint' } }
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const doctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id }
    });

    if (!doctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
      }, { status: 404 });
    }

    const [adherenceRecords, patientsStats] = await Promise.all([
      prisma.adherenceRecord.findMany({
        where: {
          patient: {
            primaryCareDoctorId: doctor.id
          },
          recordedAt: {
            gte: startDate
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              overallAdherenceScore: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          recordedAt: 'desc'
        }
      }),

      prisma.patient.findMany({
        where: {
          primaryCareDoctorId: doctor.id
        },
        select: {
          id: true,
          patientId: true,
          overallAdherenceScore: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              name: true
            }
          }
        }
      })
    ]);

    const totalPatients = patientsStats.length;
    const patientsWithRecords = adherenceRecords.length > 0 ? 
      [...new Set(adherenceRecords.map((r: AdherenceRecordWithPatient) => r.patientId))].length : 0;
    
    const adherenceScores = patientsStats
      .filter((p: PatientStats): p is PatientStats & { overallAdherenceScore: NonNullable<PatientStats['overallAdherenceScore']> } => p.overallAdherenceScore !== null)
      .map((p) => p.overallAdherenceScore.toNumber());
    
    const averageAdherence = adherenceScores.length > 0 
      ? adherenceScores.reduce((sum: number, score: number) => sum + score, 0) / adherenceScores.length
      : 0;

    const adherenceCategories = {
      excellent: adherenceScores.filter((score: number) => score >= 90).length,
      good: adherenceScores.filter((score: number) => score >= 75 && score < 90).length,
      fair: adherenceScores.filter((score: number) => score >= 60 && score < 75).length,
      poor: adherenceScores.filter((score: number) => score < 60).length
    };

    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyAdherenceData = await Promise.all(
      last7Days.map(async (date) => {
        const dayStart = new Date(date);
        const dayEnd = new Date(date);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayRecords = await prisma.adherenceRecord.findMany({
          where: {
            patient: {
              primaryCareDoctorId: doctor.id
            },
            recordedAt: {
              gte: dayStart,
              lt: dayEnd
            }
          }
        });

        const dayScores = dayRecords.filter((r: DayRecord) => r.isCompleted).map(() => 100).concat(
          dayRecords.filter((r: DayRecord) => r.isMissed).map(() => 0)
        );
        const dayAverage = dayScores.length > 0 
          ? dayScores.reduce((sum: number, score: number) => sum + score, 0) / dayScores.length
          : null;

        return {
          date,
          averageAdherence: dayAverage,
          recordCount: dayRecords.length
        };
      })
    );

    const topPatients = patientsStats
      .filter((p: PatientStats): p is PatientStats & { overallAdherenceScore: NonNullable<PatientStats['overallAdherenceScore']> } => p.overallAdherenceScore !== null)
      .sort((a, b) => b.overallAdherenceScore.toNumber() - a.overallAdherenceScore.toNumber())
      .slice(0, 5)
      .map((p) => ({
        patientId: p.patientId,
        name: p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim(),
        adherenceScore: p.overallAdherenceScore
      }));

    const patientsNeedingAttention = patientsStats
      .filter((p: PatientStats): p is PatientStats & { overallAdherenceScore: NonNullable<PatientStats['overallAdherenceScore']> } => p.overallAdherenceScore !== null && p.overallAdherenceScore.toNumber() < 75)
      .sort((a, b) => a.overallAdherenceScore.toNumber() - b.overallAdherenceScore.toNumber())
      .slice(0, 5)
      .map((p) => ({
        patientId: p.patientId,
        name: p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim(),
        adherenceScore: p.overallAdherenceScore,
        riskLevel: p.overallAdherenceScore.toNumber() < 60 ? 'high' : 'medium'
      }));

    const adherenceOverview = [
      { name: 'Excellent (≥90%)', value: adherenceCategories.excellent, color: '#10B981' },
      { name: 'Good (75-89%)', value: adherenceCategories.good, color: '#3B82F6' },
      { name: 'Fair (60-74%)', value: adherenceCategories.fair, color: '#F59E0B' },
      { name: 'Poor (<60%)', value: adherenceCategories.poor, color: '#EF4444' }
    ];

    const monthlyTrends = Array.from({length: 6}, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      
      return {
        month: monthName,
        medications: Math.floor(Math.random() * 100) + 50, // Mock data for now
        appointments: Math.floor(Math.random() * 50) + 20,
        vitals: Math.floor(Math.random() * 80) + 30
      };
    }).reverse();

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          adherenceOverview,
          monthlyTrends: monthlyTrends,
          detailedAnalytics: {
            overview: {
              totalPatients,
              patientsWithRecords,
              averageAdherence: Math.round(averageAdherence * 100) / 100,
              periodDays: days
            },
            adherenceDistribution: adherenceCategories,
            trends: dailyAdherenceData,
            topPerformers: topPatients,
            needsAttention: patientsNeedingAttention
          }
        },
        message: 'Adherence analytics retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching adherence analytics:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
