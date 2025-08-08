// src/routes/doctors.js
import express from 'express';
import doctorController from '../controllers/doctorController.js';
import patientController from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { USER_CATEGORIES } from '../config/constants.js';

const router = express.Router();

// Dashboard Routes

// GET /api/doctors/dashboard (Get dashboard statistics)
router.get('/dashboard',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.getDashboardData
);

// GET /api/doctors/recent-patients (Get recent patients)
router.get('/recent-patients',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.getRecentPatients
);

// GET /api/doctors/critical-alerts (Get critical alerts)
router.get('/critical-alerts',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.getCriticalAlerts
);

// GET /api/doctors/adherence-analytics (Get adherence analytics)
router.get('/adherence-analytics',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.getAdherenceAnalytics
);

// Profile Management Routes

// GET /api/doctors/profile (Current doctor's comprehensive profile)
router.get('/profile',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.getProfile
);

// PUT /api/doctors/profile (Update doctor's comprehensive profile)
router.put('/profile',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.updateProfile
);

// POST /api/doctors/profile/images (Upload profile images - profile picture, banner, signature)
router.post('/profile/images',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.uploadImages
);

// Clinic Management Routes

// GET /api/doctors/clinics (Get doctor's clinics)
router.get('/clinics',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.getClinics
);

// POST /api/doctors/clinics (Create new clinic)
router.post('/clinics',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.createClinic
);

// PUT /api/doctors/clinics/:clinicId (Update clinic)
router.put('/clinics/:clinicId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.updateClinic
);

// DELETE /api/doctors/clinics/:clinicId (Soft delete clinic)
router.delete('/clinics/:clinicId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.deleteClinic
);

// Geo-location Routes for Clinics

// POST /api/doctors/clinics/:clinicId/geocode (Manually geocode clinic address)
router.post('/clinics/:clinicId/geocode',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.geocodeClinicAddress
);

// GET /api/doctors/clinics/nearby (Find nearby clinics by coordinates)
router.get('/clinics/nearby',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.PATIENT),
  doctorController.findNearbyClinics
);

// POST /api/doctors/reverse-geocode (Reverse geocode coordinates to address)
router.post('/reverse-geocode',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  doctorController.reverseGeocodeLocation
);

// General Doctor Routes

// GET /api/doctors/:doctorId (Get doctor details by ID - for admin/other users)
router.get('/:doctorId',
  authenticate,
  doctorController.getDoctor
);

// POST /api/doctors/:doctorId/update (Legacy update endpoint - kept for backward compatibility)
router.post('/:doctorId/update',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN),
  doctorController.updateDoctor
);

// Patient Management Routes

// GET /api/doctors/:doctorId/patients (Get doctor's patients)
router.get('/:doctorId/patients',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN),
  doctorController.getDoctorPatients
);

// POST /api/doctors/patients (Create patient under doctor)
router.post('/patients',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN),
  validateRequest(schemas.patientCreate),
  patientController.createPatient
);

// ====== CONSENT WORKFLOW ROUTES ======
// Temporarily commented out for debugging

/*
// GET /api/doctors/patients/secondary (Get secondary patients with consent status)
router.get('/patients/secondary',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.getSecondaryPatients
);

// POST /api/doctors/patients/:patientId/assign-secondary (Assign secondary doctor/HSP)
router.post('/patients/:patientId/assign-secondary',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, USER_CATEGORIES.ADMIN),
  consentController.assignSecondaryDoctor
);

// GET /api/doctors/patients/:patientId/consent-status (Check consent status)
router.get('/patients/:patientId/consent-status',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.getConsentStatus
);

// POST /api/doctors/patients/:patientId/request-consent (Generate OTP for consent)
router.post('/patients/:patientId/request-consent',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.requestConsent
);

// POST /api/doctors/patients/:patientId/verify-consent (Verify OTP)
router.post('/patients/:patientId/verify-consent',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.verifyConsent
);

// POST /api/doctors/patients/:patientId/resend-otp (Resend OTP)
router.post('/patients/:patientId/resend-otp',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.resendOtp
);

// GET /api/doctors/search-providers (Search for doctors/HSPs for assignment)
router.get('/search-providers',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, USER_CATEGORIES.ADMIN),
  consentController.searchProviders
);
*/

export default router;
