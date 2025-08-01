// src/migrations/007-create-care-plans.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Create enums first
    await queryInterface.sequelize.query(`
      CREATE TYPE care_plan_status AS ENUM (
        'DRAFT',
        'ACTIVE', 
        'PAUSED',
        'COMPLETED',
        'CANCELLED'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    `);

    // Create care_plans table
    await queryInterface.createTable('care_plans', {
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
      provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'healthcare_providers',
          key: 'id'
        },
      },
      template_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'care_plan_templates',
          key: 'id'
        },
      },
      
      // Plan details
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      diagnosis: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      goals: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      
      // Status and timing
      status: {
        type: 'care_plan_status',
        defaultValue: 'DRAFT',
      },
      priority: {
        type: 'priority_level',
        defaultValue: 'MEDIUM',
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      
      // Plan data
      plan_data: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
      // Collaboration
      secondary_providers: {
        type: Sequelize.ARRAY(Sequelize.UUID),
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes as per schema
    await queryInterface.addIndex('care_plans', ['patient_id'], { 
      where: { deleted_at: null },
      name: 'idx_care_plans_patient'
    });
    await queryInterface.addIndex('care_plans', ['provider_id'], { 
      where: { deleted_at: null },
      name: 'idx_care_plans_provider'
    });
    await queryInterface.addIndex('care_plans', ['status'], { 
      where: { deleted_at: null },
      name: 'idx_care_plans_status'
    });
    await queryInterface.addIndex('care_plans', ['start_date', 'end_date'], { 
      where: { deleted_at: null },
      name: 'idx_care_plans_dates'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('care_plans');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS care_plan_status CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS priority_level CASCADE;');
  }
};