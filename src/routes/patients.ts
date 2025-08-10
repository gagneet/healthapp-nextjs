// src/routes/patients.js
import express from 'express';
import patientController from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, validateQuery, schemas } from '../middleware/validation.js';
import { USER_CATEGORIES } from '../config/constants.js';

const router = express.Router();

// GET /api/patients/pagination
router.get('/pagination',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  validateQuery(schemas.pagination),
  patientController.getPatients
);

// GET /api/patients/:patientId
router.get('/:patientId',
  authenticate,
  patientController.getPatient
);

// POST /api/doctors/patients (Create patient under doctor)
router.post('/',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN),
  validateRequest(schemas.patientCreate),
  patientController.createPatient
);

// PUT /api/patients/:patientId
router.put('/:patientId',
  authenticate,
  patientController.updatePatient
);

// DELETE /api/patients/:patientId
router.delete('/:patientId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN),
  patientController.deletePatient
);

// POST /api/patients/search-by-phone - Search patient by phone number
router.post('/search-by-phone',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  patientController.searchPatientByPhone
);

// POST /api/patients/validate-phone - Validate patient phone number
router.post('/validate-phone',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  patientController.validatePatientPhone
);

// POST /api/patients/generate-id - Generate patient ID preview
router.post('/generate-id',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN),
  patientController.generatePatientId
);

// GET /api/patients/:patientId/dashboard - Get patient dashboard data
router.get('/:patientId/dashboard',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  patientController.getPatientDashboard
);

// GET /api/patients/:patientId/events - Get patient medication events
router.get('/:patientId/events',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  patientController.getPatientEvents
);

// POST /api/patients/:patientId/events - Record patient medication event
router.post('/:patientId/events',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  patientController.recordPatientEvent
);

// POST /api/patients/:patientId/consent/request - Request patient consent for secondary assignment
router.post('/:patientId/consent/request',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN),
  patientController.requestPatientConsent
);

// POST /api/patients/consent/verify - Verify patient consent with OTP
router.post('/consent/verify',
  authenticate,
  patientController.verifyPatientConsent
);

// GET /api/patients/:patientId/consent/status - Get patient consent status
router.get('/:patientId/consent/status',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  patientController.getPatientConsentStatus
);

export default router;
