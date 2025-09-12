export const APPOINTMENT_TYPES = [
  { id: 'consultation', name: 'Consultation' },
  { id: 'follow-up', name: 'Follow-up' },
  { id: 'check-up', name: 'Check-up' },
  { id: 'emergency', name: 'Emergency' },
] as const;

export type AppointmentType = typeof APPOINTMENT_TYPES[number]['id'];
