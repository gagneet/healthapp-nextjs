// src/routes/appointments.js
const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const { USER_CATEGORIES } = require('../config/constants');

const router = express.Router();

// POST /api/appointments
router.post('/',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  validateRequest(schemas.appointmentCreate),
  appointmentController.createAppointment
);

// GET /api/appointments/:patientId
router.get('/:patientId',
  authenticate,
  appointmentController.getPatientAppointments
);

// GET /api/appointments/date?date=2023-01-15
router.get('/date',
  authenticate,
  appointmentController.getAppointmentsByDate
);

// PUT /api/appointments/:appointmentId
router.put('/:appointmentId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  (req, res) => {
    res.status(501).json({
      status: false,
      statusCode: 501,
      payload: {
        error: {
          status: 'NOT_IMPLEMENTED',
          message: 'Appointment update not implemented yet'
        }
      }
    });
  }
);

// DELETE /api/appointments/:appointmentId
router.delete('/:appointmentId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  (req, res) => {
    res.status(501).json({
      status: false,
      statusCode: 501,
      payload: {
        error: {
          status: 'NOT_IMPLEMENTED',
          message: 'Appointment cancellation not implemented yet'
        }
      }
    });
  }
);

module.exports = router;
