import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth";
import { prisma, checkDatabaseConnection } from '@/lib/prisma';
import { handleApiError, formatApiSuccess } from '@/lib/api-services';

/**
 * GET /api/health
 * Health check endpoint for the API with real database connection
 */
export async function GET(request: NextRequest) {
  try {
    // Check database connection with retry logic
    const dbHealth = await checkDatabaseConnection();
    
    let statistics = {
      totalUsers: 0,
      totalPatients: 0,
      totalDoctors: 0
    };
    
    // Only get statistics if database is connected
    if (dbHealth.connected) {
      try {
        const [userCount, patientCount, doctorCount] = await Promise.all([
          prisma.user.count(),
          prisma.patient.count(), 
          prisma.doctors.count()
        ]);
        
        statistics = {
          totalUsers: userCount,
          totalPatients: patientCount,
          totalDoctors: doctorCount
        };
      } catch (statError) {
        console.warn('Statistics query failed:', statError);
        // Continue with zero statistics rather than failing
      }
    }
    
    const healthData = {
      status: dbHealth.connected ? 'healthy' : 'degraded',
      database: dbHealth.connected ? 'connected' : 'disconnected',
      api: 'operational',
      timestamp: new Date().toISOString(),
      version: '2.0.0-prisma',
      statistics,
      prisma: {
        modelsIntrospected: 46,
        schemaSource: 'database_introspection'
      },
      ...(dbHealth.error && { databaseError: dbHealth.error })
    };
    
    // Return 200 even if database is disconnected - service is partially healthy
    const statusCode = dbHealth.connected ? 200 : 503;
    return NextResponse.json(
      formatApiSuccess(healthData, 'Health check completed'),
      { status: statusCode }
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
