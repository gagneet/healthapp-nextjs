// src/routes/vitals.js
const express = require('express');
const vitalsController = require('../controllers/vitalsController');
const { authenticate, authorize } = require('../middleware/auth');
const { USER_CATEGORIES } = require('../config/constants');

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

module.exports = router;
