// src/migrations/014-create-vital-readings.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create vital_readings table
    await queryInterface.createTable('vital_readings', {
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
      reading_time: {
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

    // Add indexes
    await queryInterface.addIndex('vital_readings', ['patient_id']);
    await queryInterface.addIndex('vital_readings', ['vital_type_id']);
    await queryInterface.addIndex('vital_readings', ['reading_time']);
    await queryInterface.addIndex('vital_readings', ['is_flagged']);
    await queryInterface.addIndex('vital_readings', ['is_validated']);
    await queryInterface.addIndex('vital_readings', ['patient_id', 'vital_type_id', 'reading_time']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('vital_readings');
  }
};