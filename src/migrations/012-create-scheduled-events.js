// src/migrations/012-create-scheduled-events.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create event enums
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

    // Add indexes as per schema
    await queryInterface.addIndex('scheduled_events', ['patient_id'], { 
      where: { deleted_at: null },
      name: 'idx_events_patient'
    });
    await queryInterface.addIndex('scheduled_events', ['scheduled_for'], { 
      where: { deleted_at: null },
      name: 'idx_events_scheduled_for'
    });
    await queryInterface.addIndex('scheduled_events', ['status'], { 
      where: { deleted_at: null },
      name: 'idx_events_status'
    });
    await queryInterface.addIndex('scheduled_events', ['event_type'], { 
      where: { deleted_at: null },
      name: 'idx_events_type'
    });
    await queryInterface.addIndex('scheduled_events', ['priority'], { 
      where: { deleted_at: null },
      name: 'idx_events_priority'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('scheduled_events');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS event_status CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS event_type CASCADE;');
  }
};