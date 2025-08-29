import { Prisma } from '@prisma/client';

export const patientUserSelect = {
  patient: {
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          name: true,
          email: true,
        },
      },
    },
  },
};

export type EmergencyAlertWithPatient = Prisma.EmergencyAlertGetPayload<{
  include: typeof patientUserSelect;
}>;

export type MedicationSafetyAlertWithPatient = Prisma.MedicationSafetyAlertGetPayload<{
  include: typeof patientUserSelect;
}>;

export type NotificationWithPatient = Prisma.NotificationGetPayload<{
  include: typeof patientUserSelect;
}>;
