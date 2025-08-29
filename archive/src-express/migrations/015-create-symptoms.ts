// src/migrations/015-create-symptoms.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
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
      patientId: {
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
          model: 'carePlans',
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
      onsetTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      recordedAt: {
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
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
      if (!(error as any).message.includes('already exists') && !(error as any).message.includes('duplicate key')) {
        throw error;
      }
      console.log('Constraint check_severity_range already exists, skipping');
    }

    // Add indexes with error handling
    const indexes = [
      { fields: ['patientId'], name: 'idx_symptoms_patient' },
      { fields: ['care_plan_id'], name: 'idx_symptoms_care_plan' },
      { fields: ['symptom_name'], name: 'idx_symptoms_name' },
      { fields: ['severity'], name: 'idx_symptoms_severity' },
      { fields: ['recordedAt'], name: 'idx_symptoms_recorded_at' },
      { fields: ['onsetTime'], name: 'idx_symptoms_onset_time' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('symptoms', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('symptoms');
  }
};