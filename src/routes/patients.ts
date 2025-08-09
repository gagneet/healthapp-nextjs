// src/routes/patients.js
import express from 'express';
import patientController from '../controllers/patientController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { validateRequest, validateQuery, schemas } from '../middleware/validation.ts';
import { USER_CATEGORIES } from '../config/constants.ts';

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

export default router;
