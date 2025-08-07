// src/migrations/015-create-symptoms.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('symptoms');
    if (tableExists) {
      console.log('Table symptoms already exists, skipping creation');
      return;
    }

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

    // Add constraint for severity range with error handling
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE symptoms ADD CONSTRAINT check_severity_range 
        CHECK (severity >= 1 AND severity <= 10);
      `);
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
        throw error;
      }
      console.log('Constraint check_severity_range already exists, skipping');
    }

    // Add indexes with error handling
    const indexes = [
      { fields: ['patient_id'], name: 'idx_symptoms_patient' },
      { fields: ['care_plan_id'], name: 'idx_symptoms_care_plan' },
      { fields: ['symptom_name'], name: 'idx_symptoms_name' },
      { fields: ['severity'], name: 'idx_symptoms_severity' },
      { fields: ['recorded_at'], name: 'idx_symptoms_recorded_at' },
      { fields: ['onset_time'], name: 'idx_symptoms_onset_time' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('symptoms', index.fields, { name: index.name });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('symptoms');
  }
};