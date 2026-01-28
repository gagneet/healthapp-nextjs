import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const vitalRecordSchema = z.object({
  vitalTypeId: z.string().uuid(),
  value: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  systolicValue: z.number().optional(),
  diastolicValue: z.number().optional(),
  pulseRate: z.number().int().optional(),
  oxygenSaturation: z.number().optional(),
});

/**
 * POST /api/patient/vitals/record
 * Record vital signs for a patient
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({
        message: 'Only patients can record their own vitals'
      }), { status: 403 });
    }

    const body = await request.json();
    const validatedData = vitalRecordSchema.parse(body);

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({
        message: 'Patient profile not found'
      }), { status: 404 });
    }

    const vitalType = await prisma.vitalType.findUnique({
      where: { id: validatedData.vitalTypeId },
      select: { id: true, unit: true, name: true },
    });

    if (!vitalType) {
      return NextResponse.json(handleApiError({ message: 'Vital type not found' }), { status: 404 });
    }

    const vitalReading = await prisma.vitalReading.create({
      data: {
        patientId: patient.id,
        vitalTypeId: vitalType.id,
        value: validatedData.value,
        unit: validatedData.unit ?? vitalType.unit ?? null,
        notes: validatedData.notes,
        systolicValue: validatedData.systolicValue,
        diastolicValue: validatedData.diastolicValue,
        pulseRate: validatedData.pulseRate,
        oxygenSaturation: validatedData.oxygenSaturation,
        readingTime: new Date(),
      }
    });

    const alertRules = await prisma.vitalAlertRule.findMany({
      where: {
        vitalType: vitalType.name,
        isActive: true
      }
    });

    const severityToPriority = (severity: typeof alertRules[number]['alertLevel']) => {
      switch (severity) {
        case 'CRITICAL':
          return 'EMERGENCY';
        case 'HIGH':
          return 'HIGH';
        case 'MEDIUM':
          return 'MEDIUM';
        case 'LOW':
        default:
          return 'LOW';
      }
    };

    for (const rule of alertRules) {
      const numericValue = validatedData.value ?? validatedData.systolicValue ?? 0;
      const thresholdMin = rule.thresholdMin !== null ? Number(rule.thresholdMin) : null;
      const thresholdMax = rule.thresholdMax !== null ? Number(rule.thresholdMax) : null;
      const thresholdValue = rule.thresholdValue !== null ? Number(rule.thresholdValue) : null;
      let shouldAlert = false;

      switch (rule.conditionType) {
        case 'GREATER_THAN':
          shouldAlert = thresholdValue !== null && numericValue > thresholdValue;
          break;
        case 'LESS_THAN':
          shouldAlert = thresholdValue !== null && numericValue < thresholdValue;
          break;
        case 'BETWEEN':
          shouldAlert = thresholdMin !== null && thresholdMax !== null &&
            numericValue >= thresholdMin && numericValue <= thresholdMax;
          break;
        case 'OUTSIDE_RANGE':
          shouldAlert = (thresholdMin !== null && numericValue < thresholdMin) ||
            (thresholdMax !== null && numericValue > thresholdMax);
          break;
        default:
          shouldAlert = false;
      }

      if (shouldAlert) {
        await prisma.emergencyAlert.create({
          data: {
            patientId: patient.id,
            alertType: 'VITAL_CRITICAL',
            priorityLevel: severityToPriority(rule.alertLevel),
            alertTitle: rule.name,
            alertMessage: rule.alertMessage,
            triggeredByRule: rule.name,
            vitalReadingId: vitalReading.id,
            createdAt: new Date()
          }
        });
      }
    }

    return NextResponse.json(formatApiSuccess(vitalReading, 'Vital signs recorded successfully'));
  } catch (error) {
    console.error('Record vitals error:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
