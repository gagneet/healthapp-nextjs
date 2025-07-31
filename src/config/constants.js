// src/config/constants.js
module.exports = {
  USER_CATEGORIES: {
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    CARE_TAKER: 'care_taker',
    HSP: 'hsp',
    PROVIDER: 'provider',
    ADMIN: 'admin',
  },
  
  ACCOUNT_STATUS: {
    PENDING_VERIFICATION: 'pending_verification',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DEACTIVATED: 'deactivated',
    SUSPENDED: 'suspended',
  },
  
  EVENT_TYPES: {
    APPOINTMENT: 'appointment',
    REMINDER: 'reminder',
    MEDICATION_REMINDER: 'medication-reminder',
    VITALS: 'vitals',
    CAREPLAN_ACTIVATION: 'careplan-activation',
    DIET: 'diet',
    WORKOUT: 'workout',
  },
  
  EVENT_STATUS: {
    SCHEDULED: 'scheduled',
    PENDING: 'pending',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    STARTED: 'started',
    PRIOR: 'prior',
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  
  RESPONSE_MESSAGES: {
    SUCCESS: 'Operation completed successfully',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Insufficient permissions',
    VALIDATION_ERROR: 'Invalid input data',
    INTERNAL_ERROR: 'Internal server error',
  },
};
