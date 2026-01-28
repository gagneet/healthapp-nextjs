import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const activitySchema = z.object({
  totalSteps: z.number().int().optional(),
  totalDistance: z.number().optional(),
  totalCaloriesBurned: z.number().int().optional(),
  activeMinutes: z.number().int().optional(),
  sedentaryMinutes: z.number().int().optional(),
  flightsClimbed: z.number().int().optional(),
  restingHeartRate: z.number().int().optional(),
});

/**
 * GET /api/patient/exercise/activity
 * POST /api/patient/exercise/activity
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view activity summary' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const today = new Date();
    const dateKey = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const summary = await prisma.dailyActivitySummary.findUnique({
      where: { patientId_date: { patientId: patient.id, date: dateKey } },
    });

    return NextResponse.json(formatApiSuccess(summary, 'Activity summary retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can update activity summary' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const body = await request.json();
    const data = activitySchema.parse(body);

    const today = new Date();
    const dateKey = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const summary = await prisma.dailyActivitySummary.upsert({
      where: { patientId_date: { patientId: patient.id, date: dateKey } },
      update: {
        totalSteps: data.totalSteps ?? undefined,
        totalDistance: data.totalDistance ?? undefined,
        totalCaloriesBurned: data.totalCaloriesBurned ?? undefined,
        activeMinutes: data.activeMinutes ?? undefined,
        sedentaryMinutes: data.sedentaryMinutes ?? undefined,
        flightsClimbed: data.flightsClimbed ?? undefined,
        restingHeartRate: data.restingHeartRate ?? undefined,
      },
      create: {
        patientId: patient.id,
        date: dateKey,
        totalSteps: data.totalSteps ?? 0,
        totalDistance: data.totalDistance ?? 0,
        totalCaloriesBurned: data.totalCaloriesBurned ?? 0,
        activeMinutes: data.activeMinutes ?? 0,
        sedentaryMinutes: data.sedentaryMinutes,
        flightsClimbed: data.flightsClimbed,
        restingHeartRate: data.restingHeartRate,
      },
    });

    return NextResponse.json(formatApiSuccess(summary, 'Activity summary updated'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
