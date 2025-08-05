// src/migrations/016-create-notifications.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('notifications');
    if (tableExists) {
      console.log('Table notifications already exists, skipping creation');
      return;
    }

    // Create notification channel enum with error handling
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE notification_channel AS ENUM ('PUSH', 'SMS', 'EMAIL', 'VOICE_CALL');
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Enum notification_channel already exists, skipping');
    }

    // Create notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
      },
      
      // Notification details
      type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      priority: {
        type: 'priority_level',
        defaultValue: 'MEDIUM',
      },
      
      // Scheduling
      scheduled_for: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      
      // Status
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      
      // Channels
      channels: {
        type: Sequelize.ARRAY('notification_channel'),
        defaultValue: ['PUSH'],
      },
      delivery_status: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
      // Context
      reference_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      metadata: {
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

    // Add indexes with error handling
    const indexes = [
      { fields: ['recipient_id'], options: { where: { deleted_at: null }, name: 'idx_notifications_recipient' } },
      { fields: ['scheduled_for'], options: { where: { deleted_at: null }, name: 'idx_notifications_scheduled' } },
      { fields: ['recipient_id', 'is_read'], options: { where: { deleted_at: null }, name: 'idx_notifications_unread' } },
      { fields: ['priority'], options: { where: { deleted_at: null }, name: 'idx_notifications_priority' } }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('notifications', index.fields, index.options);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.options.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS notification_channel CASCADE;');
  }
};