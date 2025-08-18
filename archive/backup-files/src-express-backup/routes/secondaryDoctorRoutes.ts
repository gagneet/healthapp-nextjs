// src/routes/secondaryDoctorRoutes.js - Routes for Secondary Doctor Management
import express from 'express';
import { body, param, query } from 'express-validator';
import { SecondaryDoctorController } from '../controllers/secondaryDoctorController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_CATEGORIES } from '../config/constants.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const validateAssignmentType = body('assignmentType')
  .isIn(['specialist', 'substitute', 'transferred'])
  .withMessage('Assignment type must be specialist, substitute, or transferred');

const validateUUID = (field: any) => 
  param(field).isUUID().withMessage(`${field} must be a valid UUID`);

const validateOptionalUUID = (field: any) =>
  body(field).optional().isUUID().withMessage(`${field} must be a valid UUID`);

const validatePermissions = body('permissions')
  .optional()
  .isObject()
  .withMessage('Permissions must be an object');

// Patient Secondary Doctor Management Routes
router.post('/patients/:patientId/secondary-doctors',
  authorize(USER_CATEGORIES.DOCTOR),
  validateUUID('patientId'),
  validateAssignmentType,
  validateOptionalUUID('doctorId'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('specialtyFocus').optional().isArray().withMessage('Specialty focus must be an array'),
  body('carePlanIds').optional().isArray().withMessage('Care plan IDs must be an array'),
  body('assignmentReason').optional().isString().withMessage('Assignment reason must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('requiresConsent').optional().isBoolean().withMessage('Requires consent must be boolean'),
  SecondaryDoctorController.assignSecondaryDoctor
);

router.get('/patients/:patientId/secondary-doctors',
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).PROVIDER_ADMIN),
  validateUUID('patientId'),
  query('includeInactive').optional().isBoolean().withMessage('Include inactive must be boolean'),
  SecondaryDoctorController.getPatientDoctorAssignments
);

// Assignment Management Routes
router.get('/assignments/:assignmentId',
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).PROVIDER_ADMIN),
  validateUUID('assignmentId'),
  SecondaryDoctorController.getAssignmentDetails
);

router.post('/assignments/:assignmentId/request-consent',
  authorize(USER_CATEGORIES.DOCTOR),
  validateUUID('assignmentId'),
  body('consentMethod')
    .optional()
    .isIn(['sms_otp', 'email_otp', 'in_person', 'phone_call'])
    .withMessage('Invalid consent method'),
  SecondaryDoctorController.requestPatientConsent
);

router.post('/assignments/:assignmentId/verify-consent',
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.PATIENT),
  validateUUID('assignmentId'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  SecondaryDoctorController.verifyPatientConsent
);

router.put('/assignments/:assignmentId/permissions',
  authorize(USER_CATEGORIES.DOCTOR),
  validateUUID('assignmentId'),
  validatePermissions,
  SecondaryDoctorController.updateAssignmentPermissions
);

router.delete('/assignments/:assignmentId',
  authorize(USER_CATEGORIES.DOCTOR),
  validateUUID('assignmentId'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  SecondaryDoctorController.deactivateAssignment
);

// Doctor Access Routes  
router.get('/doctors/:doctorId/patient-access/:patientId',
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).PROVIDER_ADMIN),
  validateUUID('doctorId'),
  validateUUID('patientId'),
  SecondaryDoctorController.checkDoctorPatientAccess
);

router.get('/doctors/available-for-assignment',
  authorize(USER_CATEGORIES.DOCTOR),
  query('specialty').optional().isString().withMessage('Specialty must be a string'),
  query('organizationId').optional().isUUID().withMessage('Organization ID must be UUID'),
  query('assignmentType')
    .optional()
    .isIn(['specialist', 'substitute', 'transferred'])
    .withMessage('Invalid assignment type'),
  query('patientId').optional().isUUID().withMessage('Patient ID must be UUID'),
  SecondaryDoctorController.getAvailableDoctors
);

export default router;