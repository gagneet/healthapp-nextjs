// src/controllers/authController.ts
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { User, Doctor, Patient, UserRole, Speciality } from '../models/index.js';
import { generateToken, generateRefreshToken, verifyToken } from '../config/jwt.js';
import { USER_CATEGORIES, ACCOUNT_STATUS } from '../config/constants.js';
import { ControllerFunction } from '../types/express.js';
import '../types/express.js';

class AuthController {
  async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user by email (simplified without associations for now)
      const user = await User.findOne({
        where: { 
          email,
          account_status: ACCOUNT_STATUS.ACTIVE 
        }
      });

      if (!user) {
        res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'Invalid credentials'
            }
          }
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'Invalid credentials'
            }
          }
        });
        return;
      }

      // Generate tokens (simplified without roles for now)
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        userCategory: user.role, // Using role field directly
        permissions: [] // Add permissions logic as needed
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Update last login
      await user.update({ last_login_at: new Date() });

      // Check if user has complete profile based on their role
      let profileComplete = true;
      let profileData = null;

      if (user.role === USER_CATEGORIES.DOCTOR) {
        const doctorRecord = await Doctor.findOne({
          where: { userId: user.id }
        });
        profileComplete = !!doctorRecord;
        profileData = doctorRecord;
      } else if (user.role === USER_CATEGORIES.PATIENT) {
        const patientRecord = await Patient.findOne({
          where: { userId: user.id }
        });
        profileComplete = !!patientRecord;
        profileData = patientRecord;
      }

      // Format response according to API documentation
      const responseData = {
        users: {
          [user.id]: {
            basic_info: {
              id: user.id.toString(),
              email: user.email,
              phone: user.phone,
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.role,
              account_status: user.account_status,
              email_verified: user.email_verified,
              profile_complete: profileComplete
            },
            feedId: Buffer.from(`${user.role}_${user.id}`).toString('base64'),
            notificationToken: 'getstream_token', // Implement GetStream integration
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      };

      const loginMessage = profileComplete 
        ? 'Login successful'
        : `Login successful. Warning: Your ${user.role.toLowerCase()} profile is incomplete. Please complete your profile setup to access all features.`;

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          tokens: {
            accessToken,
            refreshToken
          },
          message: loginMessage,
          profile_complete: profileComplete
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        email,
        password,
        user_name,
        category,
        mobile_number,
        first_name,
        last_name
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email }
      });

      if (existingUser) {
        res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'DUPLICATE_ERROR',
              message: 'User with this email already exists'
            }
          }
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        user_name,
        category,
        mobile_number,
        first_name,
        last_name,
        account_status: ACCOUNT_STATUS.PENDING_VERIFICATION
      });

      // Create user role
      const userRole = await UserRole.create({
        userIdentity: user.id,
        linked_with: category,
        linked_id: null // Will be set when profile is completed
      });

      // Create category-specific record
      if (category === USER_CATEGORIES.DOCTOR) {
        await Doctor.create({
          userId: user.id,
          first_name,
          last_name
        });
      } else if (category === USER_CATEGORIES.PATIENT) {
        await Patient.create({
          userId: user.id,
          first_name,
          last_name
        });
      }

      res.status(201).json({
        status: true,
        statusCode: 201,
        payload: {
          data: {
            user: {
              id: user.id,
              email: user.email,
              category: user.category,
              account_status: user.account_status
            }
          },
          message: 'User created successfully. Please verify your email.'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is populated by authenticate middleware
      const user = req.user;

      if (!user) {
        res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'User not authenticated'
            }
          }
        });
        return;
      }

      // Get user with all necessary associations
      const fullUser = await User.findByPk(user.id, {
        include: [{
          model: UserRole,
          as: 'roles',
          attributes: ['id', 'linked_with', 'linked_id']
        }]
      });

      if (!fullUser) {
        res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'User not found'
            }
          }
        });
        return;
      }

      // Format response similar to login
      const responseData = {
        users: {
          [fullUser.id]: {
            basic_info: {
              id: fullUser.id.toString(),
              email: fullUser.email,
              phone: fullUser.phone,
              first_name: fullUser.first_name,
              last_name: fullUser.last_name,
              role: fullUser.role,
              account_status: fullUser.account_status,
              email_verified: fullUser.email_verified
            },
            feedId: Buffer.from(`${fullUser.role}_${fullUser.id}`).toString('base64'),
            notificationToken: 'getstream_token',
            createdAt: fullUser.createdAt,
            updatedAt: fullUser.updatedAt
          }
        }
      };

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          message: 'Token verified successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Refresh token required'
            }
          }
        });
        return;
      }

      const decoded = verifyToken(refresh_token) as JwtPayload & { userId: string };
      const user = await User.findByPk(decoded.userId);

      if (!user || user.account_status !== ACCOUNT_STATUS.ACTIVE) {
        res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'Invalid refresh token'
            }
          }
        });
        return;
      }

      const newAccessToken = generateToken({
        userId: user.id,
        email: user.email,
        userCategory: user.role
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: {
            accessToken: newAccessToken
          },
          message: 'Token refreshed successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Current password and new password are required'
            }
          }
        });
        return;
      }

      // Find user
      const user = await User.findByPk(userId);
      if (!user) {
        res.status(404).json({
          status: false,
          statusCode: 404,
          payload: {
            error: {
              status: 'NOT_FOUND',
              message: 'User not found'
            }
          }
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'INVALID_PASSWORD',
              message: 'Current password is incorrect'
            }
          }
        });
        return;
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await user.update({ 
        password_hash: hashedNewPassword,
        updatedAt: new Date()
      });

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Password changed successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout from all devices
  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // For now, just return success
      // In production, you would invalidate all sessions/tokens for the user
      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          message: 'Logged out from all devices successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
