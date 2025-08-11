// src/routes/patient.ts - Patient self-service routes
import express from 'express';
import patientController from '../controllers/patientController.js';
import { authenticate } from '../middleware/auth.js';
import { USER_CATEGORIES } from '../config/constants.js';

const router = express.Router();

// GET /api/patient/dashboard/:userId - Get patient's own dashboard data
router.get('/dashboard/:userId',
  authenticate,
  async (req, res, next) => {
    // Ensure patient can only access their own dashboard
    const { user } = req as any;
    const requestedUserId = req.params.userId;
    
    if (user.userCategory !== USER_CATEGORIES.PATIENT) {
      return res.status(403).json({
        status: false,
        statusCode: 403,
        payload: {
          error: {
            status: 'FORBIDDEN',
            message: 'Access denied. Patients only.'
          }
        }
      });
    }
    
    if (user.userId !== requestedUserId) {
      return res.status(403).json({
        status: false,
        statusCode: 403,
        payload: {
          error: {
            status: 'FORBIDDEN',
            message: 'Access denied. Can only access your own dashboard.'
          }
        }
      });
    }
    
    // Rename the parameter to match what the controller expects
    req.params.patientId = requestedUserId;
    
    next();
  },
  patientController.getPatientDashboard
);

// GET /api/patient/events/:userId - Get patient's own medication events
router.get('/events/:userId',
  authenticate,
  async (req, res, next) => {
    const { user } = req as any;
    const requestedUserId = req.params.userId;
    
    if (user.userCategory !== USER_CATEGORIES.PATIENT) {
      return res.status(403).json({
        status: false,
        statusCode: 403,
        payload: {
          error: {
            status: 'FORBIDDEN',
            message: 'Access denied. Patients only.'
          }
        }
      });
    }
    
    if (user.userId !== requestedUserId) {
      return res.status(403).json({
        status: false,
        statusCode: 403,
        payload: {
          error: {
            status: 'FORBIDDEN',
            message: 'Access denied. Can only access your own events.'
          }
        }
      });
    }
    
    next();
  },
  patientController.getPatientEvents
);

// POST /api/patient/events/:eventId/complete - Complete patient medication event
router.post('/events/:eventId/complete',
  authenticate,
  async (req, res, next) => {
    const { user } = req as any;
    
    if (user.userCategory !== USER_CATEGORIES.PATIENT) {
      return res.status(403).json({
        status: false,
        statusCode: 403,
        payload: {
          error: {
            status: 'FORBIDDEN',
            message: 'Access denied. Patients only.'
          }
        }
      });
    }
    
    next();
  },
  patientController.recordPatientEvent
);

// POST /api/patient/events/:eventId/missed - Mark patient medication event as missed
router.post('/events/:eventId/missed',
  authenticate,
  async (req, res, next) => {
    const { user } = req as any;
    
    if (user.userCategory !== USER_CATEGORIES.PATIENT) {
      return res.status(403).json({
        status: false,
        statusCode: 403,
        payload: {
          error: {
            status: 'FORBIDDEN',
            message: 'Access denied. Patients only.'
          }
        }
      });
    }
    
    next();
  },
  patientController.recordPatientEvent
);

export default router;