// src/routes/admin.js
import express from 'express';
import adminController from '../controllers/adminController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { validateQuery, schemas } from '../middleware/validation.ts';
import { USER_CATEGORIES } from '../config/constants.ts';

const router = express.Router();

// Doctor Management
// GET /api/admin/doctors
router.get('/doctors',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  validateQuery(schemas.pagination),
  adminController.getDoctors
);

// POST /api/admin/doctors (Create new doctor)
router.post('/doctors',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.createDoctor
);

// GET /api/admin/doctors/:doctorId (Get single doctor)
router.get('/doctors/:doctorId',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.getDoctor
);

// PUT /api/admin/doctors/:doctorId (Update doctor)
router.put('/doctors/:doctorId',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.updateDoctor
);

// DELETE /api/admin/doctors/:doctorId (Soft delete doctor)
router.delete('/doctors/:doctorId',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.deleteDoctor
);

// Medicine Management
// GET /api/admin/medicines
router.get('/medicines',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  validateQuery(schemas.pagination),
  adminController.getMedicines
);

// POST /api/admin/medicines
router.post('/medicines',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.createMedicine
);

// PUT /api/admin/medicines/:medicineId
router.put('/medicines/:medicineId',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.updateMedicine
);

// DELETE /api/admin/medicines/:medicineId
router.delete('/medicines/:medicineId',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.deleteMedicine
);

// Conditions Management
// GET /api/admin/conditions
router.get('/conditions',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.getConditions
);

// POST /api/admin/conditions
router.post('/conditions',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.createCondition
);

// PUT /api/admin/conditions/:conditionId
router.put('/conditions/:conditionId',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.updateCondition
);

// DELETE /api/admin/conditions/:conditionId
router.delete('/conditions/:conditionId',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.deleteCondition
);

// Treatments Management
// GET /api/admin/treatments
router.get('/treatments',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.getTreatments
);

// POST /api/admin/treatments
router.post('/treatments',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.createTreatment
);

// PUT /api/admin/treatments/:treatmentId
router.put('/treatments/:treatmentId',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.updateTreatment
);

// DELETE /api/admin/treatments/:treatmentId
router.delete('/treatments/:treatmentId',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.deleteTreatment
);

// GET /api/admin/stats
router.get('/stats',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.getSystemStats
);

// PUT /api/admin/doctors/:doctorId/status
router.put('/doctors/:doctorId/status',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
  adminController.updateDoctorStatus
);

// GET /api/admin/patients
router.get('/patients',
  authenticate,
  authorize((USER_CATEGORIES as any).ADMIN),
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
