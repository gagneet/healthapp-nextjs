// src/routes/carePlans.js
import express from 'express';
import carePlanController from '../controllers/carePlanController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { USER_CATEGORIES } from '../config/constants.ts';

const router = express.Router();

// GET /api/patients/:patientId/careplan-details
router.get('/patients/:patientId/careplan-details',
  authenticate,
  carePlanController.getPatientCarePlan
);

// POST /api/patients/add-careplan-for-patient/:patientId
router.post('/patients/add-careplan-for-patient/:patientId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  carePlanController.createCarePlan
);

// PUT /api/careplan/:carePlanId
router.put('/:carePlanId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR),
  carePlanController.updateCarePlan
);

// GET /api/careplan/:carePlanId
router.get('/:carePlanId',
  authenticate,
  (req, res) => {
    res.status(501).json({
      status: false,
      statusCode: 501,
      payload: {
        error: {
          status: 'NOT_IMPLEMENTED',
          message: 'Single care plan retrieval not implemented yet'
        }
      }
    });
  }
);

export default router;
