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

// GET /api/appointments/slots/available?doctorId=123&date=2023-01-15
router.get('/slots/available',
  authenticate,
  appointmentController.getDoctorAvailableSlots
);

// GET /api/appointments/calendar/doctor/:doctorId?startDate=2023-01-01&endDate=2023-01-31
router.get('/calendar/doctor/:doctorId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  appointmentController.getDoctorCalendar
);

// GET /api/appointments/calendar/patient/:patientId?startDate=2023-01-01&endDate=2023-01-31
router.get('/calendar/patient/:patientId',
  authenticate,
  appointmentController.getPatientCalendar
);

// POST /api/appointments/availability/doctor/:doctorId
router.post('/availability/doctor/:doctorId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP, (USER_CATEGORIES as any).ADMIN),
  validateRequest(schemas.doctorAvailability),
  appointmentController.setDoctorAvailability
);

// PUT /api/appointments/:appointmentId/reschedule
router.put('/:appointmentId/reschedule',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  validateRequest(schemas.appointmentReschedule),
  appointmentController.rescheduleAppointment
);

// PUT /api/appointments/:appointmentId
router.put('/:appointmentId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  validateRequest(schemas.appointmentUpdate),
  appointmentController.updateAppointment
);

// DELETE /api/appointments/:appointmentId
router.delete('/:appointmentId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  appointmentController.cancelAppointment
);

export default router;
