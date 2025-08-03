// src/utils/generators.js - ID and Code Generators

import crypto from 'crypto';

/**
 * Generate a random medical record number
 * @param {string} prefix - Optional prefix for the MRN
 * @returns {string} Medical record number
 */
export function generateMRN(prefix = 'MRN') {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a patient ID with specific format
 * @param {string} prefix - Optional prefix
 * @returns {string} Patient ID
 */
export function generatePatientId(prefix = 'PAT') {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${year}${random}`;
}

/**
 * Generate a provider ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Provider ID
 */
export function generateProviderId(prefix = 'PRV') {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Generate a secure random code
 * @param {number} length - Length of the code
 * @param {boolean} alphanumeric - Include letters and numbers
 * @returns {string} Random code
 */
export function generateSecureCode(length = 8, alphanumeric = true) {
  const chars = alphanumeric 
    ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    : '0123456789';
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a verification token
 * @returns {string} Verification token
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a password reset token
 * @returns {string} Password reset token
 */
export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a care plan ID
 * @param {string} patientId - Patient identifier
 * @returns {string} Care plan ID
 */
export function generateCarePlanId(patientId) {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CP-${patientId}-${timestamp}-${random}`;
}

/**
 * Generate an appointment ID
 * @returns {string} Appointment ID
 */
export function generateAppointmentId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `APT-${date}-${random}`;
}

/**
 * Generate a prescription number
 * @returns {string} Prescription number
 */
export function generatePrescriptionNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RX-${timestamp}-${random}`;
}

// Default exports for most commonly used generators
export default {
  generateMRN,
  generatePatientId,
  generateProviderId,
  generateSecureCode,
  generateVerificationToken,
  generatePasswordResetToken,
  generateCarePlanId,
  generateAppointmentId,
  generatePrescriptionNumber
};