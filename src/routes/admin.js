// src/routes/admin.js
import express from 'express';
import adminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateQuery, schemas } from '../middleware/validation.js';
import { USER_CATEGORIES } from '../config/constants.js';

const router = express.Router();

// GET /api/admin/doctors
router.get('/doctors',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  validateQuery(schemas.pagination),
  adminController.getDoctors
);

// Medicine Management
// GET /api/admin/medicines
router.get('/medicines',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  validateQuery(schemas.pagination),
  adminController.getMedicines
);

// POST /api/admin/medicines
router.post('/medicines',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.createMedicine
);

// PUT /api/admin/medicines/:medicineId
router.put('/medicines/:medicineId',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.updateMedicine
);

// DELETE /api/admin/medicines/:medicineId
router.delete('/medicines/:medicineId',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.deleteMedicine
);

// Conditions Management
// GET /api/admin/conditions
router.get('/conditions',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.getConditions
);

// POST /api/admin/conditions
router.post('/conditions',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.createCondition
);

// PUT /api/admin/conditions/:conditionId
router.put('/conditions/:conditionId',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.updateCondition
);

// DELETE /api/admin/conditions/:conditionId
router.delete('/conditions/:conditionId',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.deleteCondition
);

// Treatments Management
// GET /api/admin/treatments
router.get('/treatments',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.getTreatments
);

// POST /api/admin/treatments
router.post('/treatments',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.createTreatment
);

// PUT /api/admin/treatments/:treatmentId
router.put('/treatments/:treatmentId',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.updateTreatment
);

// DELETE /api/admin/treatments/:treatmentId
router.delete('/treatments/:treatmentId',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.deleteTreatment
);

// GET /api/admin/stats
router.get('/stats',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.getSystemStats
);

// PUT /api/admin/doctors/:doctorId/status
router.put('/doctors/:doctorId/status',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  adminController.updateDoctorStatus
);

// GET /api/admin/patients
router.get('/patients',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  (req, res) => {
    res.status(501).json({
      status: false,
      statusCode: 501,
      payload: {
        error: {
          status: 'NOT_IMPLEMENTED',
          message: 'Admin patient list not implemented yet'
        }
      }
    });
  }
);

export default router;
