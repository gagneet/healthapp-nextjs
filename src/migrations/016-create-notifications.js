// src/migrations/016-create-notifications.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Create notification channel enum
    await queryInterface.sequelize.query(`
      CREATE TYPE notification_channel AS ENUM ('PUSH', 'SMS', 'EMAIL', 'VOICE_CALL');
    `);

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

    // Add indexes as per schema
    await queryInterface.addIndex('notifications', ['recipient_id'], { 
      where: { deleted_at: null },
      name: 'idx_notifications_recipient'
    });
    await queryInterface.addIndex('notifications', ['scheduled_for'], { 
      where: { deleted_at: null },
      name: 'idx_notifications_scheduled'
    });
    await queryInterface.addIndex('notifications', ['recipient_id', 'is_read'], { 
      where: { deleted_at: null },
      name: 'idx_notifications_unread'
    });
    await queryInterface.addIndex('notifications', ['priority'], { 
      where: { deleted_at: null },
      name: 'idx_notifications_priority'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS notification_channel CASCADE;');
  }
};