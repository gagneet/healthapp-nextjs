// src/routes/symptoms.js - Symptoms and Diagnosis routes
import express from 'express';
import symptomsDiagnosisController from '../controllers/symptomsDiagnosisController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { USER_CATEGORIES } from '../config/constants.ts';

const router = express.Router();

// GET /api/symptoms - Get all symptoms
router.get('/',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  symptomsDiagnosisController.getAllSymptoms
);

// GET /api/symptoms/search - Search symptoms
router.get('/search',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  symptomsDiagnosisController.searchSymptoms
);

// POST /api/symptoms/custom - Add custom symptom
router.post('/custom',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN),
  symptomsDiagnosisController.addCustomSymptom
);

// GET /api/symptoms/diagnoses - Get all diagnoses
router.get('/diagnoses',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  symptomsDiagnosisController.getAllDiagnoses
);

// GET /api/symptoms/diagnoses/search - Search diagnoses
router.get('/diagnoses/search',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  symptomsDiagnosisController.searchDiagnoses
);

// POST /api/symptoms/diagnoses/find-by-symptoms - Find diagnoses by symptoms
router.post('/diagnoses/find-by-symptoms',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  symptomsDiagnosisController.findDiagnosesBySymptoms
);

// POST /api/symptoms/diagnoses/custom - Add custom diagnosis
router.post('/diagnoses/custom',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN),
  symptomsDiagnosisController.addCustomDiagnosis
);

// GET /api/symptoms/treatments - Get all treatments
router.get('/treatments',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  symptomsDiagnosisController.getAllTreatments
);

// GET /api/symptoms/treatments/search - Search treatments
router.get('/treatments/search',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  symptomsDiagnosisController.searchTreatments
);

// POST /api/symptoms/treatments/for-conditions - Get treatments for conditions
router.post('/treatments/for-conditions',
  authenticate,
  authorize(USER_CATEGORIES.DOCTOR, (USER_CATEGORIES as any).ADMIN, USER_CATEGORIES.HSP),
  symptomsDiagnosisController.getTreatmentsForConditions
);

export default router;