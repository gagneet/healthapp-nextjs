// src/routes/admin.js
const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateQuery, schemas } = require('../middleware/validation');
const { USER_CATEGORIES } = require('../config/constants');

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

module.exports = router;
