import { NextResponse } from 'next/server'

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.VERSION || '1.0.0',
    services: {
      database: 'connected', // This would check actual DB connection in real implementation
      redis: 'connected',    // This would check actual Redis connection in real implementation
    }
  }

  return NextResponse.json(healthCheck, { status: 200 })
}