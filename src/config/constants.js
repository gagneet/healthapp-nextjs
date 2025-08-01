// src/config/constants.js
export const USER_CATEGORIES = {
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  CARE_TAKER: 'care_taker',
  HSP: 'hsp',
  PROVIDER: 'provider',
  ADMIN: 'admin',
};

export const ACCOUNT_STATUS = {
  PENDING_VERIFICATION: 'pending_verification',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DEACTIVATED: 'deactivated',
  SUSPENDED: 'suspended',
};

export const EVENT_TYPES = {
  APPOINTMENT: 'appointment',
  REMINDER: 'reminder',
  MEDICATION_REMINDER: 'medication-reminder',
  VITALS: 'vitals',
  CAREPLAN_ACTIVATION: 'careplan-activation',
  DIET: 'diet',
  WORKOUT: 'workout',
};

export const EVENT_STATUS = {
  SCHEDULED: 'scheduled',
  PENDING: 'pending',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  STARTED: 'started',
  PRIOR: 'prior',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const RESPONSE_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  VALIDATION_ERROR: 'Invalid input data',
  INTERNAL_ERROR: 'Internal server error',
};

export default {
  USER_CATEGORIES,
  ACCOUNT_STATUS,
  EVENT_TYPES,
  EVENT_STATUS,
  PAGINATION,
  RESPONSE_MESSAGES,
};
