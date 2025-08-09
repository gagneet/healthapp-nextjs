// src/routes/auth.js
import express from 'express';
import authController from '../controllers/authController.ts';
import { validateRequest, schemas } from '../middleware/validation.ts';
import { authLimiter } from '../middleware/rateLimiter.ts';
import { authenticate } from '../middleware/auth.ts';
import enhancedAuthRoutes from './enhancedAuth.ts';

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

// Mount enhanced authentication routes
router.use('/enhanced', enhancedAuthRoutes);

export default router;
