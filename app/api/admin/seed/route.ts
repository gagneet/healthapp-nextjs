// app/api/admin/seed/route.ts - Admin seeding API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

// import { seedComprehensiveHealthcareData, clearTestData } from '@/lib/seed';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    // Only admins can trigger seeding
    if (user!.role !== 'ADMIN') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin access required' } }
      }, { status: 403 });
    }

    // Seeding disabled temporarily for build
    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: { success: true, message: 'Seeding temporarily disabled - build mode' },
        message: 'Seeding temporarily disabled - build mode'
      }
    });
  } catch (error) {
    console.error('Error in seeding operation:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { 
        error: { 
          status: 'error', 
          message: 'Seeding operation failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user;

    // Only admins can check seeding status
    if (user!.role !== 'ADMIN') {
      return NextResponse.json({
        status: false,
        statusCode: 403,
        payload: { error: { status: 'forbidden', message: 'Admin access required' } }
      }, { status: 403 });
    }

    // Check if test data exists
    const { prisma } = await import('@/lib/prisma');
    const testUsers = await prisma.User.count({
      where: {
        email: {
          endsWith: '@healthapp.com'
        }
      }
    });

    const testPatients = await prisma.Patient.count({
      where: {
        patient_id: {
          startsWith: 'PAT-2024-'
        }
      }
    });

    return NextResponse.json({
      status: true,
      statusCode: 200,
      payload: {
        data: {
          test_data_exists: testUsers > 0,
          test_users_count: testUsers,
          test_patients_count: testPatients,
          expected: {
            users: 10,
            patients: 5,
            doctors: 2
          }
        },
        message: 'Seeding status retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error checking seeding status:', error);
    return NextResponse.json({
      status: false,
      statusCode: 500,
      payload: { error: { status: 'error', message: 'Failed to check seeding status' } }
    }, { status: 500 });
  }
}
