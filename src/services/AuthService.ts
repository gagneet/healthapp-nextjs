// src/services/authService.js
import bcrypt from 'bcryptjs';
import { User, Doctor, Patient, UserRole } from '../models/index.js';
import { generateToken, generateRefreshToken } from '../config/jwt.js';

class AuthService {
  async createUser(userData) {
    const {
      email,
      password,
      user_name,
      category,
      mobile_number,
      first_name,
      last_name
    } = userData;

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
      account_status: 'pending_verification'
    });

    // Create user role
    const userRole = await UserRole.create({
      user_identity: user.id,
      linked_with: category,
      linked_id: null
    });

    return { user, userRole };
  }

  async authenticateUser(email, password) {
    const user = await User.findOne({
      where: { 
        email,
        account_status: 'active'
      },
      include: [
        { model: Doctor, as: 'doctor' },
        { model: Patient, as: 'patientProfile' },
        { model: UserRole, as: 'roles' }
      ]
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  generateTokens(user, userRole) {
    const tokenPayload = {
      userId: user.id,
      userCategory: user.category,
      userRoleId: userRole?.id || null,
      permissions: [] // Add permissions logic
    };

    return {
      accessToken: generateToken(tokenPayload),
      refreshToken: generateRefreshToken(tokenPayload)
    };
  }
}

export default new AuthService();
