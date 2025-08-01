// src/models/User.js - Enhanced User Model for PostgreSQL Multi-tenant Architecture
import { DataTypes } from 'sequelize';
import { USER_ROLES, ACCOUNT_STATUS, GENDER } from '../config/enums.js';
import bcrypt from 'bcryptjs';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Authentication fields
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    
    role: {
      type: DataTypes.ENUM,
      values: Object.values(USER_ROLES),
      allowNull: false
    },
    
    account_status: {
      type: DataTypes.ENUM,
      values: Object.values(ACCOUNT_STATUS),
      defaultValue: ACCOUNT_STATUS.PENDING_VERIFICATION
    },
    
    // Profile Information
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [1, 100]
      }
    },
    
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [1, 100]
      }
    },
    
    middle_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [1, 100]
      }
    },
    
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/
      }
    },
    
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString().split('T')[0] // Cannot be in the future
      }
    },
    
    gender: {
      type: DataTypes.ENUM,
      values: Object.values(GENDER),
      allowNull: true
    },
    
    // Security fields
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    two_factor_secret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Metadata
    profile_picture_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC'
    },
    
    locale: {
      type: DataTypes.STRING(10),
      defaultValue: 'en'
    },
    
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          profile_visible: true,
          share_data_for_research: false
        },
        accessibility: {
          high_contrast: false,
          large_text: false
        }
      }
    },
    
    // HIPAA Compliance fields
    terms_accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user accepted terms of service'
    },
    
    privacy_policy_accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user accepted privacy policy'
    },
    
    hipaa_consent_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user provided HIPAA consent'
    },
    
    // Audit fields
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
    
  }, {
    tableName: 'users',
    underscored: true,
    paranoid: true, // Enable soft deletes
    
    indexes: [
      {
        fields: ['email'],
        unique: true,
        where: {
          deleted_at: null
        }
      },
      {
        fields: ['role']
      },
      {
        fields: ['account_status']
      },
      {
        fields: ['phone']
      },
      {
        fields: ['email_verified']
      },
      {
        fields: ['last_login_at']
      }
    ],
    
    hooks: {
      beforeValidate: (user, options) => {
        // Normalize email
        if (user.email) {
          user.email = user.email.toLowerCase().trim();
        }
        
        // Normalize names
        ['first_name', 'last_name', 'middle_name'].forEach(field => {
          if (user[field]) {
            user[field] = user[field].trim();
          }
        });
      },
      
      beforeCreate: async (user, options) => {
        // Hash password if provided
        if (user.password && !user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password, 12);
        }
        delete user.password; // Remove plain password
        
        // Set default preferences
        if (!user.preferences) {
          user.preferences = User.rawAttributes.preferences.defaultValue;
        }
      },
      
      beforeUpdate: async (user, options) => {
        // Hash password if changed
        if (user.changed('password') && user.password) {
          user.password_hash = await bcrypt.hash(user.password, 12);
          delete user.password;
        }
      },
      
      afterUpdate: (user, options) => {
        // Reset failed login attempts on successful login
        if (user.changed('last_login_at') && user.last_login_at) {
          user.failed_login_attempts = 0;
          user.locked_until = null;
        }
      }
    },
    
    // Instance methods
    instanceMethods: {
      // Check password
      async verifyPassword(password) {
        return bcrypt.compare(password, this.password_hash);
      },
      
      // Get full name
      getFullName() {
        const parts = [this.first_name, this.middle_name, this.last_name]
          .filter(Boolean);
        return parts.join(' ') || this.email;
      },
      
      // Check if account is locked
      isLocked() {
        return this.locked_until && new Date() < this.locked_until;
      },
      
      // Check if account is active
      isActive() {
        return this.account_status === ACCOUNT_STATUS.ACTIVE && !this.isLocked();
      },
      
      // Increment failed login attempts
      async incrementFailedLogins() {
        this.failed_login_attempts += 1;
        
        // Lock account after 5 failed attempts
        if (this.failed_login_attempts >= 5) {
          this.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
        
        await this.save();
      },
      
      // Reset failed login attempts
      async resetFailedLogins() {
        this.failed_login_attempts = 0;
        this.locked_until = null;
        this.last_login_at = new Date();
        await this.save();
      },
      
      // Calculate age
      getAge() {
        if (!this.date_of_birth) return null;
        
        const today = new Date();
        const birthDate = new Date(this.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
      },
      
      // Check HIPAA consent
      hasValidHipaaConsent() {
        return this.hipaa_consent_date !== null;
      },
      
      // Get initials
      getInitials() {
        const firstName = this.first_name?.[0] || '';
        const lastName = this.last_name?.[0] || '';
        return (firstName + lastName).toUpperCase() || this.email[0].toUpperCase();
      }
    },
    
    // Class methods
    classMethods: {
      // Find by email
      async findByEmail(email) {
        return this.findOne({
          where: {
            email: email.toLowerCase().trim()
          }
        });
      },
      
      // Find active users
      findActive() {
        return this.findAll({
          where: {
            account_status: ACCOUNT_STATUS.ACTIVE,
            deleted_at: null
          }
        });
      },
      
      // Find by role
      findByRole(role) {
        return this.findAll({
          where: {
            role,
            deleted_at: null
          }
        });
      },
      
      // Search users
      searchUsers(query) {
        return this.findAll({
          where: {
            [sequelize.Sequelize.Op.or]: [
              { first_name: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } },
              { last_name: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } },
              { email: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } }
            ],
            deleted_at: null
          }
        });
      }
    }
  });
  
  return User;
};