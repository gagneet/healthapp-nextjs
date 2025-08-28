// src/migrations/017-create-user-devices.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('user_devices');
    if (tableExists) {
      console.log('Table user_devices already exists, skipping creation');
      return;
    }

    // Create user_devices table
    await queryInterface.createTable('user_devices', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      userId: {
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

    // Add indexes with error handling
    const indexes = [
      { fields: ['userId'], name: 'idx_user_devices_user' },
      { fields: ['device_type'], name: 'idx_user_devices_type' },
      { fields: ['is_active'], name: 'idx_user_devices_active' },
      { fields: ['push_token'], name: 'idx_user_devices_push_token' },
      { fields: ['last_used_at'], name: 'idx_user_devices_last_used' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('user_devices', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('user_devices');
  }
};