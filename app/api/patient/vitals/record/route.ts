import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const vitalRecordSchema = z.object({
  vitalType: z.enum(['blood_pressure', 'heart_rate', 'temperature', 'weight', 'height', 'blood_glucose', 'oxygen_saturation']),
  value: z.string(),
  unit: z.string(),
  notes: z.string().optional(),
  systolic: z.number().optional(),
  diastolic: z.number().optional()
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

    // Get patient profile
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id }
    });

    if (!patient) {
      return NextResponse.json(handleApiError({
        message: 'Patient profile not found'
      }), { status: 404 });
    }

    // Create vital reading
    const vitalReading = await prisma.vitalReading.create({
      data: {
        patientId: patient.id,
        vitalType: validatedData.vitalType,
        value: validatedData.value,
        unit: validatedData.unit,
        notes: validatedData.notes,
        systolic: validatedData.systolic,
        diastolic: validatedData.diastolic,
        recordedAt: new Date(),
        createdAt: new Date()
      }
    });

    // Check for any vital alert rules
    const alertRules = await prisma.vitalAlertRule.findMany({
      where: {
        patientId: patient.id,
        vitalType: validatedData.vitalType,
        isActive: true
      }
    });

    // Check if any alerts should be triggered
    for (const rule of alertRules) {
      const numericValue = parseFloat(validatedData.value);
      let shouldAlert = false;

      if (rule.minValue !== null && numericValue < rule.minValue) {
        shouldAlert = true;
      }
      if (rule.maxValue !== null && numericValue > rule.maxValue) {
        shouldAlert = true;
      }

      if (shouldAlert) {
        await prisma.emergencyAlert.create({
          data: {
            patientId: patient.id,
            alertType: 'VITAL_SIGN_ABNORMAL',
            priorityLevel: rule.alertLevel || 'MEDIUM',
            message: `${validatedData.vitalType} reading of ${validatedData.value} ${validatedData.unit} is outside normal range`,
            triggerData: {
              vitalType: validatedData.vitalType,
              value: validatedData.value,
              unit: validatedData.unit,
              rule: rule.ruleName
            },
            resolved: false,
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