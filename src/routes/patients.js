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
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.ADMIN, USER_CATEGORIES.HSP),
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
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.ADMIN),
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
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.ADMIN),
  patientController.deletePatient
);

export default router;
