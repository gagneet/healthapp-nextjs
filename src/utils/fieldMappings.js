// src/utils/fieldMappings.js
// Comprehensive field and value mappings between frontend, backend, and database

/**
 * Gender value mappings
 */
export const GENDER_MAPPINGS = {
  // Frontend to Backend
  'm': 'MALE',
  'f': 'FEMALE',
  'male': 'MALE',
  'female': 'FEMALE',
  'other': 'OTHER',
  'prefer_not_to_say': 'PREFER_NOT_TO_SAY',
  'MALE': 'MALE',
  'FEMALE': 'FEMALE',
  'OTHER': 'OTHER',
  'PREFER_NOT_TO_SAY': 'PREFER_NOT_TO_SAY'
};

/**
 * Event status mappings (database uses lowercase, enums use uppercase)
 */
export const EVENT_STATUS_MAPPINGS = {
  // Frontend/Enum to Database
  'SCHEDULED': 'scheduled',
  'PENDING': 'pending', 
  'IN_PROGRESS': 'started',
  'COMPLETED': 'completed',
  'MISSED': 'expired',
  'CANCELLED': 'cancelled',
  'EXPIRED': 'expired',
  
  // Database to Frontend/Response
  'scheduled': 'SCHEDULED',
  'pending': 'PENDING',
  'started': 'IN_PROGRESS', 
  'completed': 'COMPLETED',
  'expired': 'MISSED',
  'cancelled': 'CANCELLED',
  'prior': 'PRIOR'
};

/**
 * Event type mappings
 */
export const EVENT_TYPE_MAPPINGS = {
  // Frontend/Enum to Database
  'MEDICATION': 'medication-reminder',
  'APPOINTMENT': 'appointment',
  'VITAL_CHECK': 'vitals',
  'SYMPTOM_LOG': 'reminder',
  'DIET_LOG': 'diet',
  'EXERCISE': 'workout',
  'REMINDER': 'reminder',
  
  // Database to Frontend/Response
  'medication-reminder': 'MEDICATION',
  'appointment': 'APPOINTMENT', 
  'vitals': 'VITAL_CHECK',
  'reminder': 'REMINDER',
  'diet': 'DIET_LOG',
  'workout': 'EXERCISE'
};

/**
 * Field name mappings between frontend and backend
 */
export const FIELD_MAPPINGS = {
  // Frontend to Backend User fields
  'dob': 'date_of_birth',
  'mobile_number': 'phone',
  'address': 'formatted_address', // Single address field to formatted address
  
  // Frontend to Backend Patient fields  
  'comorbidities': 'medical_history',
  'emergency_contacts': 'emergency_contacts', // Array handling
  'insurance_information': 'insurance_information',
  'medical_record_number': 'medical_record_number',
  
  // Backend to Frontend mappings (reverse)
  'date_of_birth': 'dob',
  'phone': 'mobile_number',
  'formatted_address': 'address',
  'medical_history': 'comorbidities'
};

/**
 * Role/Category mappings
 */
export const ROLE_MAPPINGS = {
  // Frontend to Database
  'patient': 'PATIENT',
  'doctor': 'DOCTOR', 
  'admin': 'SYSTEM_ADMIN',
  'hsp': 'HSP',
  'caregiver': 'CAREGIVER',
  
  // Database to Frontend
  'PATIENT': 'patient',
  'DOCTOR': 'doctor',
  'SYSTEM_ADMIN': 'admin',
  'HOSPITAL_ADMIN': 'admin',
  'HSP': 'hsp',
  'CAREGIVER': 'caregiver'
};

/**
 * Account status mappings
 */
export const ACCOUNT_STATUS_MAPPINGS = {
  // Various frontend formats to database
  'pending_verification': 'PENDING_VERIFICATION',
  'active': 'ACTIVE',
  'inactive': 'INACTIVE', 
  'suspended': 'SUSPENDED',
  'deactivated': 'DEACTIVATED',
  
  // Database to frontend
  'PENDING_VERIFICATION': 'pending_verification',
  'ACTIVE': 'active',
  'INACTIVE': 'inactive',
  'SUSPENDED': 'suspended', 
  'DEACTIVATED': 'deactivated'
};

/**
 * Utility functions for mapping values
 */
export const mapGender = (value) => {
  if (!value) return null;
  return GENDER_MAPPINGS[value.toString().toLowerCase()] || value.toUpperCase();
};

export const mapEventStatus = (value, toDatabase = true) => {
  if (!value) return null;
  return toDatabase 
    ? EVENT_STATUS_MAPPINGS[value.toUpperCase()] || value.toLowerCase()
    : EVENT_STATUS_MAPPINGS[value.toLowerCase()] || value.toUpperCase();
};

export const mapEventType = (value, toDatabase = true) => {
  if (!value) return null;
  return toDatabase
    ? EVENT_TYPE_MAPPINGS[value.toUpperCase()] || value.toLowerCase()
    : EVENT_TYPE_MAPPINGS[value.toLowerCase()] || value.toUpperCase();
};

export const mapFieldName = (fieldName, toBackend = true) => {
  if (!fieldName) return fieldName;
  return toBackend 
    ? FIELD_MAPPINGS[fieldName] || fieldName
    : Object.keys(FIELD_MAPPINGS).find(key => FIELD_MAPPINGS[key] === fieldName) || fieldName;
};

export const mapRole = (value, toDatabase = true) => {
  if (!value) return null;
  return toDatabase
    ? ROLE_MAPPINGS[value.toLowerCase()] || value.toUpperCase()  
    : ROLE_MAPPINGS[value.toUpperCase()] || value.toLowerCase();
};

export const mapAccountStatus = (value, toDatabase = true) => {
  if (!value) return null;
  return toDatabase
    ? ACCOUNT_STATUS_MAPPINGS[value.toLowerCase()] || value.toUpperCase()
    : ACCOUNT_STATUS_MAPPINGS[value.toUpperCase()] || value.toLowerCase();
};

/**
 * Transform object keys and values using mappings
 */
export const transformRequestData = (data) => {
  const transformed = {};
  
  Object.keys(data).forEach(key => {
    const mappedKey = mapFieldName(key, true);
    let value = data[key];
    
    // Apply value transformations based on field
    switch (key) {
      case 'gender':
        value = mapGender(value);
        break;
      case 'dob':
        // Convert to Date object if string
        value = value ? new Date(value) : null;
        break;
      case 'role':
        value = mapRole(value, true);
        break;
      case 'account_status':
        value = mapAccountStatus(value, true);
        break;
    }
    
    transformed[mappedKey] = value;
  });
  
  return transformed;
};

export const transformResponseData = (data) => {
  const transformed = {};
  
  Object.keys(data).forEach(key => {
    const mappedKey = mapFieldName(key, false);
    let value = data[key];
    
    // Apply value transformations for response
    switch (key) {
      case 'gender':
        // Keep as uppercase for responses
        break;
      case 'date_of_birth':
        // Convert to ISO date string for frontend
        value = value ? value.toISOString().split('T')[0] : null;
        break;
      case 'role':
        value = mapRole(value, false);
        break;
      case 'account_status':
        value = mapAccountStatus(value, false);
        break;
    }
    
    transformed[mappedKey] = value;
  });
  
  return transformed;
};

export default {
  GENDER_MAPPINGS,
  EVENT_STATUS_MAPPINGS,
  EVENT_TYPE_MAPPINGS,
  FIELD_MAPPINGS,
  ROLE_MAPPINGS,
  ACCOUNT_STATUS_MAPPINGS,
  mapGender,
  mapEventStatus,
  mapEventType,
  mapFieldName,
  mapRole,
  mapAccountStatus,
  transformRequestData,
  transformResponseData
};