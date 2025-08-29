// src/migrations/002-create-users.ts
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if users table already exists
    const tableExists = await queryInterface.tableExists('users');
    if (tableExists) {
      console.log('ℹ️ Table "users" already exists, skipping creation');
      return;
    }

    // First create the enum types (with idempotent checks)
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE user_role AS ENUM (
          'SYSTEM_ADMIN',
          'HOSPITAL_ADMIN', 
          'DOCTOR',
          'HSP',
          'NURSE',
          'PATIENT',
          'CAREGIVER'
        );
      `);
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE account_status AS ENUM (
          'PENDING_VERIFICATION',
          'ACTIVE',
          'INACTIVE', 
          'SUSPENDED',
          'DEACTIVATED'
        );
      `);
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
      `);
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      email: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: 'user_role',
        allowNull: false,
      },
      account_status: {
        type: 'account_status',
        defaultValue: 'PENDING_VERIFICATION',
      },
      
      // Profile information
      firstName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      lastName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      middle_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: 'gender',
        allowNull: true,
      },
      
      // Security fields
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      email_verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      two_factor_secret: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      locked_until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      
      // Metadata
      profilePictureUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'UTC',
      },
      locale: {
        type: Sequelize.STRING(10),
        defaultValue: 'en',
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
      // Timestamps
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes as per schema (with idempotent checks)
    try {
      await queryInterface.addIndex('users', ['email'], { 
        where: { deleted_at: null },
        name: 'idx_users_email'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
    
    try {
      await queryInterface.addIndex('users', ['role'], { 
        where: { deleted_at: null },
        name: 'idx_users_role'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
    
    try {
      await queryInterface.addIndex('users', ['account_status'], { 
        where: { deleted_at: null },
        name: 'idx_users_status'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
    
    try {
      await queryInterface.addIndex('users', ['phone'], { 
        where: { deleted_at: null },
        name: 'idx_users_phone'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }

    // Full-text search index (with idempotent check)
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX idx_users_name_search ON users 
        USING GIN(to_tsvector('english', COALESCE(firstName, '') || ' ' || COALESCE(lastName, '')));
      `);
    } catch (error) {
      if (!(error as any).message.includes('already exists')) throw (error as any);
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS user_role CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS account_status CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS gender CASCADE;');
  }
};