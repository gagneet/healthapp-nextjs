// src/migrations/005-create-patient-provider-assignments.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create patient_provider_assignments table
    await queryInterface.createTable('patient_provider_assignments', {
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
      role: {
        type: Sequelize.STRING(50),
        defaultValue: 'primary', // primary, secondary, consultant
      },
      assigned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });

    // Add unique constraint
    await queryInterface.addConstraint('patient_provider_assignments', {
      fields: ['patient_id', 'provider_id', 'role', 'ended_at'],
      type: 'unique',
      name: 'unique_patient_provider_role_assignment'
    });

    // Add indexes as per schema
    await queryInterface.addIndex('patient_provider_assignments', ['patient_id'], { 
      where: { ended_at: null },
      name: 'idx_assignments_patient'
    });
    await queryInterface.addIndex('patient_provider_assignments', ['provider_id'], { 
      where: { ended_at: null },
      name: 'idx_assignments_provider'
    });
    await queryInterface.addIndex('patient_provider_assignments', ['patient_id', 'provider_id'], { 
      where: { ended_at: null },
      name: 'idx_assignments_active'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('patient_provider_assignments');
  }
};