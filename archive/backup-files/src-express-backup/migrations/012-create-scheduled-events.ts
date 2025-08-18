// src/migrations/012-create-scheduled-events.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('scheduled_events');
    if (tableExists) {
      console.log('Table scheduled_events already exists, skipping creation');
      return;
    }

    // Create event enums with error handling
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE event_status AS ENUM (
          'SCHEDULED',
          'PENDING',
          'IN_PROGRESS', 
          'COMPLETED',
          'MISSED',
          'CANCELLED',
          'EXPIRED'
        );
      `);
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Enum event_status already exists, skipping');
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE event_type AS ENUM (
          'MEDICATION',
          'APPOINTMENT',
          'VITAL_CHECK',
          'SYMPTOM_LOG',
          'DIET_LOG',
          'EXERCISE',
          'REMINDER'
        );
      `);
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Enum event_type already exists, skipping');
    }

    // Create scheduled_events table
    await queryInterface.createTable('scheduled_events', {
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
      care_plan_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'care_plans',
          key: 'id'
        },
      },
      
      // Event details
      event_type: {
        type: 'event_type',
        allowNull: false,
      },
      event_id: {
        type: Sequelize.UUID, // Reference to specific medication, vital requirement, etc.
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
      // Scheduling
      scheduled_for: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'UTC',
      },
      
      // Status and priority
      status: {
        type: 'event_status',
        defaultValue: 'SCHEDULED',
      },
      priority: {
        type: 'priority_level',
        defaultValue: 'MEDIUM',
      },
      
      // Event data
      event_data: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
      // Completion tracking
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
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
      { fields: ['patient_id'], options: { where: { deleted_at: null }, name: 'idx_events_patient' } },
      { fields: ['scheduled_for'], options: { where: { deleted_at: null }, name: 'idx_events_scheduled_for' } },
      { fields: ['status'], options: { where: { deleted_at: null }, name: 'idx_events_status' } },
      { fields: ['event_type'], options: { where: { deleted_at: null }, name: 'idx_events_type' } },
      { fields: ['priority'], options: { where: { deleted_at: null }, name: 'idx_events_priority' } }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('scheduled_events', index.fields, index.options);
      } catch (error) {
        if (!(error as any).message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.options.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('scheduled_events');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS event_status CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS event_type CASCADE;');
  }
};