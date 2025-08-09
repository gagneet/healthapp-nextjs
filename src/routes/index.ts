// src/routes/index.js
import express from 'express';
import authRoutes from './auth.ts';
import patientRoutes from './patients.ts';
import doctorRoutes from './doctors.ts';
import medicationRoutes from './medications.ts';
import appointmentRoutes from './appointments.ts';
import carePlanRoutes from './carePlans.ts';
import vitalsRoutes from './vitals.ts';
import adminRoutes from './admin.ts';
import searchRoutes from './search.ts';
import symptomsRoutes from './symptoms.ts';
import secondaryDoctorRoutes from './secondaryDoctorRoutes.ts';
import subscriptionRoutes from './subscriptions.ts';
import consentRoutes from './consent.ts';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/medications', medicationRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/careplan', carePlanRoutes);
router.use('/vitals', vitalsRoutes);
router.use('/admin', adminRoutes);
router.use('/search', searchRoutes);
router.use('/symptoms', symptomsRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/consent', consentRoutes);
router.use('/assignments', secondaryDoctorRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    status: true,
    statusCode: 200,
    payload: {
      data: {
        api: 'Healthcare Management Platform API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: [
          '/auth - Authentication endpoints',
          '/patients - Patient management',
          '/doctors - Doctor management', 
          '/medications - Medication management',
          '/appointments - Appointment management',
          '/careplan - Care plan management',
          '/vitals - Vital signs management',
          '/admin - Administrative functions',
          '/consent - Patient consent workflow',
          '/search - Search functionality',
          '/symptoms - Symptoms and diagnosis management',
          '/assignments - Secondary doctor assignments',
          '/doctors/*/patient-access/* - Doctor patient access verification'
        ]
      },
      message: 'API is running successfully'
    }
  });
});

export default router;
