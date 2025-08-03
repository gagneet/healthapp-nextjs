// src/config/enums.js
// PostgreSQL ENUMs mapped to JavaScript constants

export const USER_ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  DOCTOR: 'DOCTOR',
  HSP: 'HSP', // Healthcare Support Personnel (Nurses, PAs, etc.)
  PATIENT: 'PATIENT',
  CAREGIVER: 'CAREGIVER'
};

export const ACCOUNT_STATUS = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED'
};

export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY'
};

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED'
};

export const CARE_PLAN_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const EVENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

export const EVENT_TYPE = {
  MEDICATION: 'MEDICATION',
  APPOINTMENT: 'APPOINTMENT',
  VITAL_CHECK: 'VITAL_CHECK',
  SYMPTOM_LOG: 'SYMPTOM_LOG',
  DIET_LOG: 'DIET_LOG',
  EXERCISE: 'EXERCISE',
  REMINDER: 'REMINDER'
};

// Alias for backward compatibility
export const EVENT_TYPES = EVENT_TYPE;

export const PRIORITY_LEVEL = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Alias for backward compatibility
export const PRIORITY_LEVELS = PRIORITY_LEVEL;

export const NOTIFICATION_CHANNEL = {
  PUSH: 'PUSH',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  VOICE_CALL: 'VOICE_CALL'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

// Helper function to get all values of an enum
export const getEnumValues = (enumObject) => Object.values(enumObject);

// Helper function to validate enum value
export const isValidEnumValue = (enumObject, value) => {
  return Object.values(enumObject).includes(value);
};

// Multi-tenant organization types
export const ORGANIZATION_TYPES = {
  HOSPITAL: 'hospital',
  CLINIC: 'clinic',
  PRACTICE: 'practice',
  HEALTH_SYSTEM: 'health_system',
  TELEHEALTH: 'telehealth'
};

// Provider assignment roles
export const PROVIDER_ASSIGNMENT_ROLE = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  CONSULTANT: 'consultant',
  SPECIALIST: 'specialist',
  EMERGENCY: 'emergency'
};

// HSP (Healthcare Support Personnel) Types
export const HSP_TYPES = {
  REGISTERED_NURSE: 'registered_nurse',
  LICENSED_PRACTICAL_NURSE: 'licensed_practical_nurse',
  NURSE_PRACTITIONER: 'nurse_practitioner',
  PHYSICIAN_ASSISTANT: 'physician_assistant',
  CLINICAL_PHARMACIST: 'clinical_pharmacist',
  CARE_COORDINATOR: 'care_coordinator',
  SOCIAL_WORKER: 'social_worker',
  DIETITIAN: 'dietitian',
  PHYSICAL_THERAPIST: 'physical_therapist',
  OCCUPATIONAL_THERAPIST: 'occupational_therapist',
  RESPIRATORY_THERAPIST: 'respiratory_therapist',
  MEDICAL_ASSISTANT: 'medical_assistant',
  OTHER: 'other'
};

// Provider capabilities (what they can do)
export const PROVIDER_CAPABILITIES = {
  PRESCRIBE_MEDICATIONS: 'prescribe_medications',
  ORDER_TESTS: 'order_tests',
  DIAGNOSE: 'diagnose',
  CREATE_TREATMENT_PLANS: 'create_treatment_plans',
  CREATE_CARE_PLANS: 'create_care_plans',
  MODIFY_MEDICATIONS: 'modify_medications',
  MONITOR_VITALS: 'monitor_vitals',
  PATIENT_EDUCATION: 'patient_education',
  CARE_COORDINATION: 'care_coordination',
  EMERGENCY_RESPONSE: 'emergency_response'
};

// Plan types
export const PLAN_TYPES = {
  TREATMENT_PLAN: 'treatment_plan', // Short-term, acute issues
  CARE_PLAN: 'care_plan' // Long-term, chronic conditions
};

export default {
  USER_ROLES,
  ACCOUNT_STATUS,
  GENDER,
  APPOINTMENT_STATUS,
  CARE_PLAN_STATUS,
  EVENT_STATUS,
  EVENT_TYPE,
  PRIORITY_LEVEL,
  NOTIFICATION_CHANNEL,
  SUBSCRIPTION_STATUS,
  ORGANIZATION_TYPES,
  PROVIDER_ASSIGNMENT_ROLE,
  getEnumValues,
  isValidEnumValue
};