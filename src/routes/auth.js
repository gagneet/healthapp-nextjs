// src/routes/auth.js
import express from 'express';
import authController from '../controllers/authController.js';
import { validateRequest, schemas } from '../middleware/vaidation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

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

export default router;
