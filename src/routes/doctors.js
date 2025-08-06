// src/routes/doctors.js
import express from 'express';
import doctorController from '../controllers/doctorController.js';
import patientController from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { USER_CATEGORIES } from '../config/constants.js';

const router = express.Router();

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

// General Doctor Routes

// GET /api/doctors/:doctorId (Get doctor details by ID - for admin/other users)
router.get('/:doctorId',
  authenticate,
  doctorController.getDoctor
);

// POST /api/doctors/:doctorId/update (Legacy update endpoint - kept for backward compatibility)
router.post('/:doctorId/update',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.ADMIN),
  doctorController.updateDoctor
);

// Patient Management Routes

// GET /api/doctors/:doctorId/patients (Get doctor's patients)
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
