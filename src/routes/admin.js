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

// GET /api/admin/medicines
router.get('/medicines',
  authenticate,
  authorize(USER_CATEGORIES.ADMIN),
  validateQuery(schemas.pagination),
  adminController.getMedicines
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
