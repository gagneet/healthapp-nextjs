// src/migrations/014-create-vital-readings.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('vital_readings');
    if (tableExists) {
      console.log('Table vital_readings already exists, skipping creation');
      return;
    }

    // Create vital_readings table
    await queryInterface.createTable('vital_readings', {
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
      vital_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'vital_types',
          key: 'id'
        },
      },
      adherence_record_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'adherence_records',
          key: 'id'
        },
      },
      
      // Reading data
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      
      // Context
      readingTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      device_info: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      is_flagged: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      
      // Notes and attachments
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      
      // Validation
      is_validated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      validated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'healthcare_providers',
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
    });

    // Add indexes with error handling
    const indexes = [
      { fields: ['patientId'], name: 'idx_vital_readings_patient' },
      { fields: ['vital_type_id'], name: 'idx_vital_readings_vital_type' },
      { fields: ['readingTime'], name: 'idx_vital_readings_time' },
      { fields: ['is_flagged'], name: 'idx_vital_readings_flagged' },
      { fields: ['is_validated'], name: 'idx_vital_readings_validated' },
      { fields: ['patientId', 'vital_type_id', 'readingTime'], name: 'idx_vital_readings_composite' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('vital_readings', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('vital_readings');
  }
};