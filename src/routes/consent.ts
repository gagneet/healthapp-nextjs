// src/routes/consent.js - Patient Consent Workflow Routes
import express from 'express';
import consentController from '../controllers/consentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_CATEGORIES } from '../config/constants.js';

const router = express.Router();

// ====== CONSENT WORKFLOW ROUTES ======

// GET /api/consent/secondary-patients (Get secondary patients with consent status)
router.get('/secondary-patients',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.getSecondaryPatients
);

// POST /api/consent/:patientId/assign-secondary (Assign secondary doctor/HSP)
router.post('/:patientId/assign-secondary',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  consentController.assignSecondaryDoctor
);

// GET /api/consent/:patientId/status (Check consent status)
router.get('/:patientId/status',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.getConsentStatus
);

// POST /api/consent/:patientId/request-otp (Generate OTP for consent)
router.post('/:patientId/request-otp',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.requestConsent
);

// POST /api/consent/:patientId/verify-otp (Verify OTP)
router.post('/:patientId/verify-otp',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.verifyConsent
);

// POST /api/consent/:patientId/resend-otp (Resend OTP)
router.post('/:patientId/resend-otp',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  consentController.resendOtp
);

// GET /api/consent/search-providers (Search for doctors/HSPs for assignment)
router.get('/search-providers',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  consentController.searchProviders
);

export default router;