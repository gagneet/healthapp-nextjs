import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Only doctors can access this endpoint
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

    // Get doctor ID
    const doctor = await prisma.doctors.findFirst({
      where: { user_id: session.user.id }
    });

    if (!doctor) {
      return NextResponse.json({
        status: false,
        statusCode: 404,
        payload: { error: { status: 'not_found', message: 'Doctor profile not found' } }
      }, { status: 404 });
    }

    // Get adherence data for doctor's patients
    const [adherenceRecords, patientsStats] = await Promise.all([
      // Adherence records for the time period
      prisma.adherence_records.findMany({
        where: {
          patients: {
            primary_care_doctor_id: doctor.id,
            is_active: true
          },
          recorded_at: {
            gte: startDate
          }
        },
        include: {
          patients: {
            select: {
              id: true,
              patient_id: true,
              overall_adherence_score: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true
                }
              }
            }
          }
        },
        orderBy: {
          recorded_at: 'desc'
        }
      }),

      // Overall patient statistics
      prisma.patients.findMany({
        where: {
          primary_care_doctor_id: doctor.id,
          is_active: true
        },
        select: {
          id: true,
          patient_id: true,
          overall_adherence_score: true,
          user: {
            select: {
              first_name: true,
              last_name: true
            }
          },
          _count: {
            select: {
              medication_logs: true,
              adherence_records: true
            }
          }
        }
      })
    ]);

    // Calculate analytics
    const totalPatients = patientsStats.length;
    const patientsWithRecords = adherenceRecords.length > 0 ? 
      [...new Set(adherenceRecords.map(r => r.patient_id))].length : 0;
    
    const adherenceScores = patientsStats
      .filter(p => p.overall_adherence_score !== null)
      .map(p => p.overall_adherence_score as number);
    
    const averageAdherence = adherenceScores.length > 0 
      ? adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length
      : 0;

    // Categorize patients by adherence level
    const adherenceCategories = {
      excellent: adherenceScores.filter(score => score >= 90).length,
      good: adherenceScores.filter(score => score >= 75 && score < 90).length,
      fair: adherenceScores.filter(score => score >= 60 && score < 75).length,
      poor: adherenceScores.filter(score => score < 60).length
    };

    // Get recent adherence trends (daily averages for last 7 days)
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

        const dayRecords = await prisma.adherence_records.findMany({
          where: {
            patients: {
              primary_care_doctor_id: doctor.id,
              is_active: true
            },
            recorded_at: {
              gte: dayStart,
              lt: dayEnd
            }
          }
        });

        const dayScores = dayRecords.map(r => r.adherence_score).filter(s => s !== null);
        const dayAverage = dayScores.length > 0 
          ? dayScores.reduce((sum, score) => sum + score, 0) / dayScores.length
          : null;

        return {
          date,
          averageAdherence: dayAverage,
          recordCount: dayRecords.length
        };
      })
    );

    // Top patients by adherence
    const topPatients = patientsStats
      .filter(p => p.overall_adherence_score !== null)
      .sort((a, b) => (b.overall_adherence_score as number) - (a.overall_adherence_score as number))
      .slice(0, 5)
      .map(p => ({
        patientId: p.patient_id,
        name: `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim(),
        adherenceScore: p.overall_adherence_score,
        medicationCount: p._count.medication_logs,
        recordCount: p._count.adherence_records
      }));

    // Patients needing attention (low adherence)
    const patientsNeedingAttention = patientsStats
      .filter(p => p.overall_adherence_score !== null && p.overall_adherence_score < 75)
      .sort((a, b) => (a.overall_adherence_score as number) - (b.overall_adherence_score as number))
      .slice(0, 5)
      .map(p => ({
        patientId: p.patient_id,
        name: `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim(),
        adherenceScore: p.overall_adherence_score,
        riskLevel: p.overall_adherence_score < 60 ? 'high' : 'medium'
      }));

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
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