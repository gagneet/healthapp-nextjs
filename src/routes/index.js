// src/routes/index.js
import express from 'express';
import authRoutes from './auth.js';
import patientRoutes from './patients.js';
import doctorRoutes from './doctors.js';
import medicationRoutes from './medications.js';
import appointmentRoutes from './appointments.js';
import carePlanRoutes from './carePlans.js';
import vitalsRoutes from './vitals.js';
import adminRoutes from './admin.js';
import searchRoutes from './search.js';

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

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    status: true,
    statusCode: 200,
    payload: {
      data: {
        api: 'AdhereLive Healthcare Management Platform API',
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
          '/search - Search functionality'
        ]
      },
      message: 'API is running successfully'
    }
  });
});

export default router;
