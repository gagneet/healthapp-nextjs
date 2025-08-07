// src/migrations/007-create-care-plans.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('care_plans');
    if (tableExists) {
      console.log('Table care_plans already exists, skipping creation');
      return;
    }

    // Create enums first with error handling
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE care_plan_status AS ENUM (
          'DRAFT',
          'ACTIVE', 
          'PAUSED',
          'COMPLETED',
          'CANCELLED'
        );
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Enum care_plan_status already exists, skipping');
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Enum priority_level already exists, skipping');
    }

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
      title: {
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

    // Add indexes with error handling
    const indexes = [
      { fields: ['patient_id'], options: { where: { deleted_at: null }, name: 'idx_care_plans_patient' } },
      { fields: ['provider_id'], options: { where: { deleted_at: null }, name: 'idx_care_plans_provider' } },
      { fields: ['status'], options: { where: { deleted_at: null }, name: 'idx_care_plans_status' } },
      { fields: ['start_date', 'end_date'], options: { where: { deleted_at: null }, name: 'idx_care_plans_dates' } }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('care_plans', index.fields, index.options);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.options.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('care_plans');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS care_plan_status CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS priority_level CASCADE;');
  }
};