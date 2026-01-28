import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatApiSuccess, handleApiError } from '@/lib/api-services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  notifications: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    medication_reminders: z.boolean().optional(),
    appointmentReminders: z.boolean().optional(),
    vital_reminders: z.boolean().optional(),
  }).optional(),
  preferences: z.object({
    theme: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    dateFormat: z.string().optional(),
    measurement_units: z.enum(['metric', 'imperial']).optional(),
  }).optional(),
});

/**
 * GET /api/patient/settings
 * PATCH /api/patient/settings
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can view settings' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const [prefs, settings] = await Promise.all([
      prisma.patientNotificationPreference.findUnique({ where: { patientId: patient.id } }),
      prisma.patientSettings.findUnique({ where: { patientId: patient.id } }),
    ]);

    const response = {
      notifications: {
        email: prefs?.emailEnabled ?? true,
        sms: prefs?.smsEnabled ?? false,
        push: prefs?.pushEnabled ?? true,
        medication_reminders: prefs?.medicationReminders ?? true,
        appointmentReminders: prefs?.appointmentReminders ?? true,
        vital_reminders: prefs?.vitalReminders ?? true,
      },
      privacy: {
        profileVisibility: 'doctors_only',
        share_data_research: settings?.allowAnonymousAnalytics ?? true,
        allow_marketing: false,
      },
      security: {
        twoFactorEnabled: false,
        loginNotifications: false,
        sessionTimeout: 30,
      },
      preferences: {
        theme: settings?.theme ?? 'light',
        language: settings?.language ?? 'en',
        timezone: prefs?.timezone ?? 'UTC',
        dateFormat: settings?.dateFormat ?? 'MM/DD/YYYY',
        measurement_units: settings?.measurementSystem === 'metric' ? 'metric' : 'imperial',
      },
    };

    return NextResponse.json(formatApiSuccess(response, 'Settings retrieved successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(handleApiError({ message: 'Only patients can update settings' }), { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(handleApiError({ message: 'Patient profile not found' }), { status: 404 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    if (data.notifications) {
      await prisma.patientNotificationPreference.upsert({
        where: { patientId: patient.id },
        update: {
          emailEnabled: data.notifications.email ?? undefined,
          smsEnabled: data.notifications.sms ?? undefined,
          pushEnabled: data.notifications.push ?? undefined,
          medicationReminders: data.notifications.medication_reminders ?? undefined,
          appointmentReminders: data.notifications.appointmentReminders ?? undefined,
          vitalReminders: data.notifications.vital_reminders ?? undefined,
        },
        create: {
          patientId: patient.id,
          emailEnabled: data.notifications.email ?? true,
          smsEnabled: data.notifications.sms ?? false,
          pushEnabled: data.notifications.push ?? true,
          medicationReminders: data.notifications.medication_reminders ?? true,
          appointmentReminders: data.notifications.appointmentReminders ?? true,
          vitalReminders: data.notifications.vital_reminders ?? true,
        },
      });
    }

    if (data.preferences) {
      await prisma.patientSettings.upsert({
        where: { patientId: patient.id },
        update: {
          theme: data.preferences.theme ?? undefined,
          language: data.preferences.language ?? undefined,
          dateFormat: data.preferences.dateFormat ?? undefined,
          measurementSystem: data.preferences.measurement_units ?? undefined,
        },
        create: {
          patientId: patient.id,
          theme: data.preferences.theme ?? 'light',
          language: data.preferences.language ?? 'en',
          dateFormat: data.preferences.dateFormat ?? 'MM/DD/YYYY',
          measurementSystem: data.preferences.measurement_units ?? 'imperial',
        },
      });
    }

    return NextResponse.json(formatApiSuccess({ ok: true }, 'Settings updated successfully'));
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
