// src/migrations/020-create-audit-logs.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('audit_logs');
    if (tableExists) {
      console.log('Table audit_logs already exists, skipping creation');
      return;
    }

    // Create audit_logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
      },
      
      // Action details
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      resource_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      
      // Changes
      old_values: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      new_values: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      
      // Context
      ip_address: {
        type: Sequelize.INET,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      
      // Timestamps
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes with error handling
    const indexes = [
      { fields: ['user_id'], name: 'idx_audit_logs_user' },
      { fields: ['action'], name: 'idx_audit_logs_action' },
      { fields: ['resource_type'], name: 'idx_audit_logs_resource_type' },
      { fields: ['resource_id'], name: 'idx_audit_logs_resource_id' },
      { fields: ['created_at'], name: 'idx_audit_logs_created_at' },
      { fields: ['user_id', 'created_at'], name: 'idx_audit_logs_user_time' },
      { fields: ['resource_type', 'resource_id'], name: 'idx_audit_logs_resource_composite' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('audit_logs', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('audit_logs');
  }
};