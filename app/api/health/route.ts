import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { prisma, checkDatabaseConnection } from '@/lib/prisma';
import { handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/health
 * Health check endpoint for the API with real database connection
 */
export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const dbHealth = await checkDatabaseConnection();
    
    // Get basic statistics
    const [userCount, patientCount, doctorCount] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.doctors.count()
    ]);
    
    const healthData = {
      status: 'healthy',
      database: dbHealth.connected ? 'connected' : 'disconnected',
      api: 'operational',
      timestamp: new Date().toISOString(),
      version: '2.0.0-prisma',
      statistics: {
        totalUsers: userCount,
        totalPatients: patientCount,
        totalDoctors: doctorCount
      },
      prisma: {
        modelsIntrospected: 46,
        schemaSource: 'database_introspection'
      }
    };
    
    return NextResponse.json(formatApiSuccess(healthData, 'Health check completed'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
