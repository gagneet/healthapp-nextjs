// src/routes/enhancedAuth.js - Enhanced Authentication Routes
import express from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole, Doctor, Patient } from '../models/index.js';
import { USER_CATEGORIES, ACCOUNT_STATUS } from '../config/constants.js';
import ResponseFormatter from '../utils/responseFormatter.js';
import { 
  generateTokens, 
  enhancedAuthenticate, 
  refreshTokenHandler, 
  enhancedLogout, 
  validateToken,
  getActiveSessions 
} from '../middleware/enhancedAuth.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const router = express.Router();

// Enhanced Sign In with device tracking
router.post('/enhanced-sign-in', async (req, res, next) => {
  try {
    const { email, password, rememberMe = false, deviceInfo = {} } = req.body;
    
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }
    
    // Find user with role information
    const user = await User.findOne({
      where: { 
        email: email.toLowerCase(),
        account_status: ACCOUNT_STATUS.ACTIVE,
        is_active: true
      },
      include: [{
        model: UserRole,
        as: 'roles',
        attributes: ['id', 'linked_with']
      }]
    });
    
    if (!user) {
      return res.status(401).json(ResponseFormatter.error(
        'Invalid email or password',
        401,
        'INVALID_CREDENTIALS'
      ));
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(ResponseFormatter.error(
        'Invalid email or password',
        401,
        'INVALID_CREDENTIALS'
      ));
    }
    
    // Get user role
    const userRole = user.roles?.[0];
    
    // Enhanced device info
    const enhancedDeviceInfo = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      rememberMe,
      ...deviceInfo
    };
    
    // Generate tokens
    const tokens = await generateTokens(user, userRole, enhancedDeviceInfo);
    
    // Get role-specific profile data
    let profileData = null;
    if (user.role === USER_CATEGORIES.DOCTOR) {
      const doctorProfile = await Doctor.findOne({
        where: { user_id: user.id },
        attributes: ['id', 'speciality_id', 'license_number', 'years_of_experience']
      });
      profileData = doctorProfile;
    } else if (user.role === USER_CATEGORIES.PATIENT) {
      const patientProfile = await Patient.findOne({
        where: { user_id: user.id },
        attributes: ['id', 'medical_record_number', 'blood_group']
      });
      profileData = patientProfile;
    }
    
    // Log successful login
    console.log('ENHANCED_LOGIN_SUCCESS:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    // Prepare response data
    const userData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.replace(/\s+/g, ' ').trim(),
      role: user.role,
      account_status: user.account_status,
      profile: profileData
    };
    
    res.status(200).json(ResponseFormatter.success(
      {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          refreshExpiresIn: tokens.refreshExpiresIn,
          sessionId: tokens.sessionId
        },
        user: userData,
        loginTime: new Date().toISOString(),
        rememberMe
      },
      'Login successful'
    ));
    
  } catch (error) {
    next(error);
  }
});

// Token refresh endpoint
router.post('/refresh-token', refreshTokenHandler);

// Enhanced logout with session management
router.post('/enhanced-logout', enhancedAuthenticate, enhancedLogout);

// Token validation
router.get('/validate-token', enhancedAuthenticate, validateToken);

// Get active sessions
router.get('/active-sessions', enhancedAuthenticate, getActiveSessions);

// Revoke specific session
router.delete('/sessions/:sessionId', enhancedAuthenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;
    
    // Implementation for revoking specific session
    // This would need to be implemented in the enhancedAuth middleware
    
    res.status(200).json(ResponseFormatter.success(
      null,
      'Session revoked successfully'
    ));
    
  } catch (error) {
    next(error);
  }
});

// Change password with enhanced security
router.post('/change-password', enhancedAuthenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, logoutOtherSessions = false } = req.body;
    const userId = req.user!.id;
    
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }
    
    // Verify current password
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json(ResponseFormatter.error(
        'Current password is incorrect',
        400,
        'INVALID_CURRENT_PASSWORD'
      ));
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await user.update({ 
      password: hashedNewPassword,
      password_changed_at: new Date()
    });
    
    // Log password change
    console.log('PASSWORD_CHANGED:', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    // If requested, logout other sessions
    if (logoutOtherSessions) {
      // This would trigger logout from other devices
      // Implementation depends on your session management strategy
    }
    
    res.status(200).json(ResponseFormatter.success(
      {
        passwordChanged: true,
        logoutOtherSessions
      },
      'Password changed successfully'
    ));
    
  } catch (error) {
    next(error);
  }
});

// Get user profile with enhanced data
router.get('/profile', enhancedAuthenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: UserRole,
        as: 'roles',
        attributes: ['id', 'linked_with']
      }]
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Get role-specific profile
    let roleProfile = null;
    if (user.role === USER_CATEGORIES.DOCTOR) {
      roleProfile = await Doctor.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'email']
          }
        ]
      });
    } else if (user.role === USER_CATEGORIES.PATIENT) {
      roleProfile = await Patient.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name', 'email']
          }
        ]
      });
    }
    
    res.status(200).json(ResponseFormatter.success(
      {
        user: user.toJSON(),
        profile: roleProfile?.toJSON() || null,
        lastLogin: new Date().toISOString() // This should come from session data
      },
      'Profile retrieved successfully'
    ));
    
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', enhancedAuthenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { 
      first_name, 
      last_name, 
      mobile_number, 
      date_of_birth,
      gender,
      // Role-specific fields would be handled separately
    } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Update basic user information
    const updateData = {};
    if (first_name !== undefined) (updateData as any).first_name = first_name;
    if (last_name !== undefined) (updateData as any).last_name = last_name;
    if (mobile_number !== undefined) (updateData as any).mobile_number = mobile_number;
    if (date_of_birth !== undefined) (updateData as any).date_of_birth = date_of_birth;
    if (gender !== undefined) (updateData as any).gender = gender;
    
    await user.update(updateData);
    
    // Log profile update
    console.log('PROFILE_UPDATED:', {
      userId: user.id,
      email: user.email,
      updatedFields: Object.keys(updateData),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json(ResponseFormatter.success(
      { user: user.toJSON() },
      'Profile updated successfully'
    ));
    
  } catch (error) {
    next(error);
  }
});

export default router;