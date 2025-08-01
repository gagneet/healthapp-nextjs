// src/routes/index.js
const express = require('express');
const authRoutes = require('./auth');
const patientRoutes = require('./patients');
const doctorRoutes = require('./doctors');
const medicationRoutes = require('./medications');
const appointmentRoutes = require('./appointments');
const carePlanRoutes = require('./carePlans');
const vitalsRoutes = require('./vitals');
const adminRoutes = require('./admin');
const searchRoutes = require('./search');

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

module.exports = router;
