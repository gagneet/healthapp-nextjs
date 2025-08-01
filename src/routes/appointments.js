// src/routes/appointments.js
import express from 'express';
import appointmentController from '../controllers/appointmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { USER_CATEGORIES } from '../config/constants.js';

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

export default router;
