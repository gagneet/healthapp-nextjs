// src/routes/auth.js
import express from 'express';
import authController from '../controllers/authController.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
// import enhancedAuthRoutes from './enhancedAuth.js';

const router = express.Router();

// POST /api/auth/sign-in
router.post('/sign-in', 
  authLimiter,
  validateRequest(schemas.login),
  authController.signIn
);

// POST /api/auth/sign-up
router.post('/sign-up',
  authLimiter,
  validateRequest(schemas.patientCreate), // Modify for user creation
  authController.signUp
);

// GET /api/auth/verify - Verify current token
router.get('/verify',
  authenticate,
  authController.verify
);

// POST /api/auth/refresh-token
router.post('/refresh-token',
  authController.refreshToken
);

// POST /api/auth/logout (if needed)
router.post('/logout', (req, res) => {
  res.status(200).json({
    status: true,
    statusCode: 200,
    payload: {
      message: 'Logged out successfully'
    }
  });
});

// POST /api/auth/change-password
router.post('/change-password',
  authenticate,
  authController.changePassword
);

// POST /api/auth/logout-all
router.post('/logout-all',
  authenticate,
  authController.logoutAll
);

// GET /api/auth/sessions (simple endpoint for session info)
router.get('/sessions', authenticate, (req, res) => {
  res.status(200).json({
    status: true,
    statusCode: 200,
    payload: {
      data: {
        sessions: [{
          id: 'session_1',
          userId: req.user?.id,
          active: true,
          createdAt: new Date().toISOString()
        }]
      },
      message: 'Sessions retrieved successfully'
    }
  });
});

// GET /api/auth/enhanced/profile (simple version for compatibility)
router.get('/enhanced/profile', authenticate, (req, res) => {
  const user = req.user;
  res.status(200).json({
    status: true,
    statusCode: 200,
    payload: {
      data: {
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          role: user?.role
        },
        // Return default settings since we don't have a settings table yet
        settings: {
          notifications: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            appointmentReminders: true,
            medicationAlerts: true,
            systemUpdates: false
          },
          privacy: {
            profileVisibility: 'colleagues_only',
            showOnlineStatus: true,
            allowPatientMessaging: true
          },
          preferences: {
            language: 'en',
            timezone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '12h',
            defaultConsultationDuration: 30
          },
          security: {
            twoFactorEnabled: false,
            loginNotifications: true,
            sessionTimeout: 24
          }
        }
      },
      message: 'Profile retrieved successfully'
    }
  });
});

// Enhanced authentication routes removed - using NextAuth.js for authentication
// router.use('/enhanced', enhancedAuthRoutes);

export default router;
