import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  vitalTypeId: z.string().uuid(),
  value: z.number().optional(),
  unit: z.string().optional(),
  systolicValue: z.number().optional(),
  diastolicValue: z.number().optional(),
  pulseRate: z.number().int().optional(),
  oxygenSaturation: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/patient/vitals
 * POST /api/patient/vitals
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view vitals' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const vitals = await prisma.vitalReading.findMany({
      where: { patientId: patient.id },
      orderBy: { readingTime: 'desc' },
      take: 50,
      include: { vitalType: true },
    });

    const response = vitals.map((reading) => {
      const normalizedType = reading.vitalType.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      const alertStatus = reading.alertLevel === 'EMERGENCY'
        ? 'critical'
        : reading.alertLevel?.toLowerCase() || 'normal';
      return {
        id: reading.id,
        vitalType: normalizedType,
        value: reading.value ? Number(reading.value) : null,
        unit: reading.unit || reading.vitalType.unit || null,
        recordedAt: reading.readingTime.toISOString(),
        status: alertStatus,
        systolic: reading.systolicValue ? Number(reading.systolicValue) : null,
        diastolic: reading.diastolicValue ? Number(reading.diastolicValue) : null,
      };
    });

    return NextResponse.json(formatApiSuccess(response, 'Vitals retrieved successfully'));
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
      return NextResponse.json(handleApiError({ message: 'Only patients can record vitals' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const body = await request.json();
    const data = createSchema.parse(body);

    const vital = await prisma.vitalReading.create({
      data: {
        patientId: patient.id,
        vitalTypeId: data.vitalTypeId,
        value: data.value,
        unit: data.unit,
        systolicValue: data.systolicValue,
        diastolicValue: data.diastolicValue,
        pulseRate: data.pulseRate,
        oxygenSaturation: data.oxygenSaturation,
        notes: data.notes,
        readingTime: new Date(),
      },
    });

    return NextResponse.json(formatApiSuccess(vital, 'Vital recorded'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
