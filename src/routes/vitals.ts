// src/routes/vitals.js
import express from 'express';
import vitalsController from '../controllers/vitalsController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { USER_CATEGORIES } from '../config/constants.ts';

const router = express.Router();

// POST /api/vitals
router.post('/',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  vitalsController.createVital
);

// GET /api/vitals/:patientId
router.get('/:patientId',
  authenticate,
  vitalsController.getPatientVitals
);

// GET /api/vitals/:vitalId/timeline
router.get('/:vitalId/timeline',
  authenticate,
  vitalsController.getVitalTimeline
);

// PUT /api/vitals/:vitalId
router.put('/:vitalId',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, USER_CATEGORIES.HSP),
  (req, res) => {
    res.status(501).json({
      status: false,
      statusCode: 501,
      payload: {
        error: {
          status: 'NOT_IMPLEMENTED',
          message: 'Vital update not implemented yet'
        }
      }
    });
  }
);

export default router;
