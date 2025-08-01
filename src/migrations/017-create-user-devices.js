// src/migrations/017-create-user-devices.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Create user_devices table
    await queryInterface.createTable('user_devices', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
      },
      
      // Device information
      device_type: {
        type: Sequelize.STRING(50),
        allowNull: false, // ios, android, web
      },
      push_token: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      device_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      
      // Settings
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      notification_settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
      // Timestamps
      last_used_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
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
    });

    // Add indexes
    await queryInterface.addIndex('user_devices', ['user_id']);
    await queryInterface.addIndex('user_devices', ['device_type']);
    await queryInterface.addIndex('user_devices', ['is_active']);
    await queryInterface.addIndex('user_devices', ['push_token']);
    await queryInterface.addIndex('user_devices', ['last_used_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_devices');
  }
};