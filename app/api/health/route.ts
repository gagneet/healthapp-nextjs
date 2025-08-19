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
    
    let schemaStatus = 'unknown';
    
    // Only get statistics if database is connected
    if (dbHealth.connected) {
      try {
        // Check if tables exist by trying to query them
        const [userCount, patientCount, doctorCount] = await Promise.all([
          prisma.user.count().catch(() => null),
          prisma.patient.count().catch(() => null), 
          prisma.doctors.count().catch(() => null)
        ]);
        
        // If all queries succeeded, schema exists
        if (userCount !== null && patientCount !== null && doctorCount !== null) {
          statistics = {
            totalUsers: userCount,
            totalPatients: patientCount,
            totalDoctors: doctorCount
          };
          schemaStatus = 'migrated';
        } else {
          schemaStatus = 'needs_migration';
        }
      } catch (statError) {
        console.warn('Statistics query failed (likely tables not migrated yet):', statError);
        schemaStatus = 'needs_migration';
      }
    }
    
    const healthData = {
      status: dbHealth.connected ? 'healthy' : 'degraded',
      database: dbHealth.connected ? 'connected' : 'disconnected',
      schema: schemaStatus,
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
    
    // Return 200 if database is connected, even if schema needs migration
    const statusCode = dbHealth.connected ? 200 : 503;
    return NextResponse.json(
      formatApiSuccess(healthData, 'Health check completed'),
      { status: statusCode }
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
