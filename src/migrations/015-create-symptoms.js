// src/migrations/015-create-symptoms.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Create symptoms table
    await queryInterface.createTable('symptoms', {
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
      
      // Symptom details
      symptom_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      severity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 10
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      body_location: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
      // Timing
      onset_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      recorded_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      
      // Additional data
      triggers: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      relieving_factors: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      associated_symptoms: {
        type: Sequelize.JSONB,
        defaultValue: [],
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

    // Add constraint for severity range
    await queryInterface.sequelize.query(`
      ALTER TABLE symptoms ADD CONSTRAINT check_severity_range 
      CHECK (severity >= 1 AND severity <= 10);
    `);

    // Add indexes
    await queryInterface.addIndex('symptoms', ['patient_id']);
    await queryInterface.addIndex('symptoms', ['care_plan_id']);
    await queryInterface.addIndex('symptoms', ['symptom_name']);
    await queryInterface.addIndex('symptoms', ['severity']);
    await queryInterface.addIndex('symptoms', ['recorded_at']);
    await queryInterface.addIndex('symptoms', ['onset_time']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('symptoms');
  }
};