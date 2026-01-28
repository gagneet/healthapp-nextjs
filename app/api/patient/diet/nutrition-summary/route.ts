import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/diet/nutrition-summary
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view nutrition summary' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const logs = await prisma.mealLog.findMany({
      where: {
        patientId: patient.id,
        loggedAt: { gte: today, lte: end },
      },
    });

    const summary = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.totalCalories || 0),
        protein: acc.protein + (log.totalProtein || 0),
        carbs: acc.carbs + (log.totalCarbs || 0),
        fat: acc.fat + (log.totalFat || 0),
        fiber: acc.fiber + (log.totalFiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    return NextResponse.json(formatApiSuccess(summary, 'Nutrition summary retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
