// src/migrations/004-create-patients.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create patients table
    await queryInterface.createTable('patients', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
      },
      
      // Medical information
      medical_record_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      emergency_contacts: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      insurance_information: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      medical_history: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      allergies: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      current_medications: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      
      // Physical measurements with constraints
      height_cm: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 300
        }
      },
      weight_kg: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 1000
        }
      },
      
      // Settings
      communication_preferences: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      privacy_settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
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

    // Add constraints for height and weight
    await queryInterface.sequelize.query(`
      ALTER TABLE patients ADD CONSTRAINT check_height_range 
      CHECK (height_cm > 0 AND height_cm < 300);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE patients ADD CONSTRAINT check_weight_range 
      CHECK (weight_kg > 0 AND weight_kg < 1000);
    `);

    // Add indexes as per schema
    await queryInterface.addIndex('patients', ['user_id'], { 
      name: 'idx_patients_user_id'
    });
    await queryInterface.addIndex('patients', ['organization_id'], { 
      where: { deleted_at: null },
      name: 'idx_patients_org'
    });
    await queryInterface.addIndex('patients', ['medical_record_number'], { 
      where: { deleted_at: null },
      name: 'idx_patients_mrn'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('patients');
  }
};