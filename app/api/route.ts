import { NextRequest, NextResponse } from 'next/server';

/**
 * Main API info endpoint - adapted from src/routes/index.ts
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: true,
    statusCode: 200,
    payload: {
      data: {
        api: 'Healthcare Management Platform API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        architecture: 'Next.js 14 App Router with TypeScript',
        endpoints: [
          '/api/auth - Authentication endpoints',
          '/api/patients - Patient management',
          '/api/patient - Patient self-service routes',
          '/api/doctors - Doctor management', 
          '/api/medications - Medication management',
          '/api/appointments - Appointment management',
          '/api/careplan - Care plan management',
          '/api/vitals - Vital signs management',
          '/api/admin - Administrative functions',
          '/api/consent - Patient consent workflow',
          '/api/search - Search functionality',
          '/api/symptoms - Symptoms and diagnosis management',
          '/api/assignments - Secondary doctor assignments',
          '/api/subscriptions - Subscription management'
        ]
      },
      message: 'Healthcare API is running successfully on Next.js App Router'
  });
}