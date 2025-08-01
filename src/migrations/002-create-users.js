// src/migrations/002-create-users.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // First create the enum types
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

    await queryInterface.sequelize.query(`
      CREATE TYPE account_status AS ENUM (
        'PENDING_VERIFICATION',
        'ACTIVE',
        'INACTIVE', 
        'SUSPENDED',
        'DEACTIVATED'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
    `);

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
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      last_name: {
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
      profile_picture_url: {
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes as per schema
    await queryInterface.addIndex('users', ['email'], { 
      where: { deleted_at: null },
      name: 'idx_users_email'
    });
    await queryInterface.addIndex('users', ['role'], { 
      where: { deleted_at: null },
      name: 'idx_users_role'
    });
    await queryInterface.addIndex('users', ['account_status'], { 
      where: { deleted_at: null },
      name: 'idx_users_status'
    });
    await queryInterface.addIndex('users', ['phone'], { 
      where: { deleted_at: null },
      name: 'idx_users_phone'
    });

    // Full-text search index
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_users_name_search ON users 
      USING GIN(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS user_role CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS account_status CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS gender CASCADE;');
  }
};