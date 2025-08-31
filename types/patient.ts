// types/patient.ts

// This type is used for the patient list on the doctor dashboard.
// It is a stricter version of the more general Patient type in types/dashboard.ts

export type ConsentStatus =
  | 'not_required'
  | 'granted'
  | 'requested'
  | 'pending'
  | 'expired'
  | 'denied';

export interface Patient {
  id: string;
  patientId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  medicalRecordNumber: string | null;
  lastVisit: string | null;
  adherenceRate: number;
  criticalAlerts: number;
  status: string;
  // Fields for patient type and consent, which might not come directly from the main patient model
  patientType?: 'M' | 'R';
  accessType?: 'primary' | 'secondary';
  requiresConsent?: boolean;
  consentStatus?: ConsentStatus;
}
