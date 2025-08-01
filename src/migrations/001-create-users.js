// src/migrations/001-create-users.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      mobile_number: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING(1000),
        allowNull: true,
      },
      category: {
        type: Sequelize.ENUM('doctor', 'patient', 'care_taker', 'hsp', 'provider', 'admin'),
        allowNull: false,
      },
      account_status: {
        type: Sequelize.ENUM('pending_verification', 'active', 'inactive', 'deactivated', 'suspended'),
        allowNull: false,
        defaultValue: 'pending_verification',
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
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
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });

    // Add indexes
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['mobile_number']);
    await queryInterface.addIndex('users', ['category']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
