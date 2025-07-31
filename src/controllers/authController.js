// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const { User, Doctor, Patient, UserRole, Speciality } = require('../models');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const { USER_CATEGORIES, ACCOUNT_STATUS } = require('../config/constants');

class AuthController {
  async signIn(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({
        where: { 
          email,
          account_status: ACCOUNT_STATUS.ACTIVE 
        },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            include: [{ model: Speciality, as: 'speciality' }]
          },
          {
            model: Patient,
            as: 'patient'
          },
          {
            model: UserRole,
            as: 'roles'
          }
        ]
      });

      if (!user) {
        return res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'Invalid credentials'
            }
          }
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'Invalid credentials'
            }
          }
        });
      }

      // Generate tokens
      const userRole = user.roles?.[0];
      const tokenPayload = {
        userId: user.id,
        userCategory: user.category,
        userRoleId: userRole?.id || null,
        permissions: [] // Add permissions logic as needed
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Update last login
      await user.update({ last_login_at: new Date() });

      // Format response according to API documentation
      const responseData = {
        users: {
          [user.id]: {
            basic_info: {
              id: user.id.toString(),
              email: user.email,
              mobile_number: user.mobile_number,
              user_name: user.user_name,
              category: user.category,
              account_status: user.account_status,
              email_verified: user.verified,
              mobile_verified: user.verified
            },
            feedId: Buffer.from(`${user.category}_${userRole?.id || user.id}`).toString('base64'),
            notificationToken: 'getstream_token', // Implement GetStream integration
            created_at: user.created_at,
            updated_at: user.updated_at
          }
        }
      };

      res.status(200).json({
        status: true,
        statusCode: 200,
        payload: {
          data: responseData,
          tokens: {
            accessToken,
            refreshToken
          },
          message: 'Login successful'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async signUp(req, res, next) {
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
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'DUPLICATE_ERROR',
              message: 'User with this email already exists'
            }
          }
        });
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
        user_identity: user.id,
        linked_with: category,
        linked_id: null // Will be set when profile is completed
      });

      // Create category-specific record
      if (category === USER_CATEGORIES.DOCTOR) {
        await Doctor.create({
          user_id: user.id,
          first_name,
          last_name
        });
      } else if (category === USER_CATEGORIES.PATIENT) {
        await Patient.create({
          user_id: user.id,
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

  async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          payload: {
            error: {
              status: 'VALIDATION_ERROR',
              message: 'Refresh token required'
            }
          }
        });
      }

      const decoded = verifyToken(refresh_token);
      const user = await User.findByPk(decoded.userId);

      if (!user || user.account_status !== ACCOUNT_STATUS.ACTIVE) {
        return res.status(401).json({
          status: false,
          statusCode: 401,
          payload: {
            error: {
              status: 'UNAUTHORIZED',
              message: 'Invalid refresh token'
            }
          }
        });
      }

      const newAccessToken = generateToken({
        userId: user.id,
        userCategory: user.category,
        userRoleId: decoded.userRoleId
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
}

module.exports = new AuthController();
