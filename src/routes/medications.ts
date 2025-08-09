// src/routes/medications.js
import express from 'express';
import medicationController from '../controllers/medicationController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { validateRequest, schemas } from '../middleware/validation.ts';
import { USER_CATEGORIES } from '../config/constants.ts';

const router = express.Router();

// GET /api/medications/:patientId
router.get('/:patientId',
  authenticate,
  medicationController.getPatientMedications
);

// POST /api/medications/treatment/:patientId/:carePlanId
router.post('/treatment/:patientId/:carePlanId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  validateRequest(schemas.medicationCreate),
  medicationController.createMedication
);

// GET /api/medications/:medicationId/timeline
router.get('/:medicationId/timeline',
  authenticate,
  medicationController.getMedicationTimeline
);

// PUT /api/medications/:medicationId
router.put('/:medicationId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  (req, res) => {
    res.status(501).json({
      status: false,
      statusCode: 501,
      payload: {
        error: {
          status: 'NOT_IMPLEMENTED',
          message: 'Medication update not implemented yet'
        }
      }
    });
  }
);

// DELETE /api/medications/:medicationId
router.delete('/:medicationId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  (req, res) => {
    res.status(501).json({
      status: false,
      statusCode: 501,
      payload: {
        error: {
          status: 'NOT_IMPLEMENTED',
          message: 'Medication deletion not implemented yet'
        }
      }
    });
  }
);

export default router;
