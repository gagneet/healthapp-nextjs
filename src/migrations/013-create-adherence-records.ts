// src/migrations/013-create-adherence-records.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('adherence_records');
    if (tableExists) {
      console.log('Table adherence_records already exists, skipping creation');
      return;
    }

    // Create adherence_records table
    await queryInterface.createTable('adherence_records', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
      },
      scheduled_event_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'scheduled_events',
          key: 'id'
        },
      },
      
      // Adherence details
      adherence_type: {
        type: 'event_type',
        allowNull: false,
      },
      due_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      
      // Adherence status
      is_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_partial: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_missed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      
      // Additional data
      response_data: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
      // Attachments
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: [],
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
    });

    // Add indexes with error handling
    const indexes = [
      { fields: ['patient_id'], name: 'idx_adherence_patient' },
      { fields: ['due_at'], name: 'idx_adherence_due_at' },
      { fields: ['adherence_type'], name: 'idx_adherence_type' },
      { fields: ['is_completed', 'is_missed'], name: 'idx_adherence_status' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('adherence_records', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('adherence_records');
  }
};