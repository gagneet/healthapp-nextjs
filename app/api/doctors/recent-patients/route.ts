import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/doctors/recent-patients
 * Get recently active patients for the authenticated doctor
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
    const limit = parseInt(searchParams.get('limit') || '5');

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

    // Get recent patients based on last visit or medication activity
    const recentPatients = await prisma.patients.findMany({
      where: {
        primary_care_doctor_id: doctor.id,
        is_active: true
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        },
        vital_readings: {
          select: {
            created_at: true
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 1
        },
        appointments: {
          select: {
            appointment_date: true,
            status: true
          },
          orderBy: {
            appointment_date: 'desc'
          },
          take: 1
        }
      },
      orderBy: [
        {
          last_visit_date: 'desc'
        },
        {
          updated_at: 'desc'
        }
      ],
      take: limit
    });

    const formattedPatients = recentPatients.map(patient => ({
      id: patient.id,
      patientId: patient.patient_id,
      name: `${patient.user?.first_name || ''} ${patient.user?.last_name || ''}`.trim(),
      email: patient.user?.email,
      lastActivity: patient.last_visit_date || patient.vital_readings?.[0]?.created_at || patient.updated_at,
      lastAppointment: patient.appointments?.[0]?.appointment_date,
      appointmentStatus: patient.appointments?.[0]?.status,
      riskLevel: patient.risk_level || 'low'
    }));

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { patients: formattedPatients },
        message: 'Recent patients retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Error fetching recent patients:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Internal server error' } }
    }, { status: 500 });
  }
}
