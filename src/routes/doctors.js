// src/routes/doctors.js
import express from 'express';
import doctorController from '../controllers/doctorController.js';
import patientController from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { USER_CATEGORIES } from '../config/constants.js';

const router = express.Router();

// GET /api/doctors/:doctorId
router.get('/:doctorId',
  authenticate,
  doctorController.getDoctor
);

// POST /api/doctors/:doctorId/update
router.post('/:doctorId/update',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.ADMIN),
  doctorController.updateDoctor
);

// GET /api/doctors/:doctorId/patients
router.get('/:doctorId/patients',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.ADMIN),
  doctorController.getDoctorPatients
);

// POST /api/doctors/patients (Create patient under doctor)
router.post('/patients',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.ADMIN),
  validateRequest(schemas.patientCreate),
  patientController.createPatient
);

export default router;
