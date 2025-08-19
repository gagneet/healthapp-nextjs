import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

/**
 * GET /api/doctors/recent-patients
 * Get recently active patients for the authenticated doctor
 */
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
    const recentPatients = await prisma.patient.findMany({
      where: {
        primary_care_doctor_id: doctor.id
      },
      include: {
        users_patients_user_idTousers: {
          select: {
            first_name: true,
            last_name: true,
            name: true,
            email: true
          }
        },
        appointments: {
          select: {
            start_time: true
          },
          orderBy: {
            start_time: 'desc'
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

    const formattedPatients = recentPatients.map(patient => {
      const userName = patient.users_patients_user_idTousers.name || 
                      `${patient.users_patients_user_idTousers.first_name || ''} ${patient.users_patients_user_idTousers.last_name || ''}`.trim();
      
      return {
        id: patient.id,
        patientId: patient.patient_id,
        name: userName,
        email: patient.users_patients_user_idTousers?.email,
        lastActivity: patient.last_visit_date || patient.updated_at,
        lastAppointment: patient.appointments?.[0]?.start_time,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        riskLevel: patient.risk_level || 'low'
      };
    });

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
