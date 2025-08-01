// src/routes/doctors.js
const express = require('express');
const doctorController = require('../controllers/doctorController');
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const { USER_CATEGORIES } = require('../config/constants');

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

module.exports = router;
