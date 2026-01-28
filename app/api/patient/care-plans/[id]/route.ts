import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patient/care-plans/[id]
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view care plans' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const carePlan = await prisma.carePlan.findFirst({
      where: { id: params.id, patientId: patient.id },
      include: {
        prescribedMedications: {
          include: {
            medicine: { select: { name: true } },
          },
        },
        appointments: true,
        vitalRequirements: {
          include: {
            vitalType: { select: { name: true, unit: true } },
          },
        },
        diets: { include: { dietPlan: true } },
        workouts: { include: { workoutPlan: true } },
      },
    });

    if (!carePlan) {
      return NextResponse.json(handleApiError({ message: 'Care plan not found' }), { status: 404 });
    }

    return NextResponse.json(formatApiSuccess(carePlan, 'Care plan retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
