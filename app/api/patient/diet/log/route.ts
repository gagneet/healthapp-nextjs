import { auth } from '@/lib/auth';
import { handleApiError, formatApiSuccess } from '@/lib/api-services';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


export const dynamic = 'force-dynamic';

const dietLogSchema = z.object({
  title: z.string().min(1),
  calories: z.number().int().positive().optional(),
  notes: z.string().optional(),
  loggedAt: z.string().datetime().optional(),
  mealType: z.enum(['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'EVENING_SNACK']).optional(),
});

/**
 * POST /api/patient/diet/log
 * Log a diet entry for the authenticated patient
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({
        message: 'Only patients can log diet entries'
      }), { status: 403 });
    }

    const body = await request.json();
    const validatedData = dietLogSchema.parse(body);

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!patient) {
      return NextResponse.json(handleApiError({
        message: 'Patient profile not found'
      }), { status: 404 });
    }

    const loggedAt = validatedData.loggedAt ? new Date(validatedData.loggedAt) : new Date();

    const mealLog = await prisma.mealLog.create({
      data: {
        patientId: patient.id,
        mealType: validatedData.mealType || 'LUNCH',
        loggedAt,
        totalCalories: validatedData.calories,
        notes: validatedData.notes,
      }
    });

    await prisma.adherenceRecord.create({
      data: {
        patientId: patient.id,
        adherenceType: 'DIET_LOG',
        dueAt: loggedAt,
        recordedAt: loggedAt,
        isCompleted: true,
        responseData: {
          mealLogId: mealLog.id,
          calories: validatedData.calories ?? null
        },
        notes: validatedData.notes
      }
    });

    return NextResponse.json(formatApiSuccess({
      id: mealLog.id,
      title: validatedData.title,
      scheduledFor: mealLog.loggedAt,
      mealType: mealLog.mealType
    }, 'Diet entry logged successfully'));
  } catch (error) {
    console.error('Diet log error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(handleApiError({ message: 'Invalid diet entry data' }), { status: 400 });
    }
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
