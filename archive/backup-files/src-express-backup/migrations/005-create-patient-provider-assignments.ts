// src/migrations/005-create-patient-provider-assignments.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('patient_provider_assignments');
    if (tableExists) {
      console.log('Table patient_provider_assignments already exists, skipping creation');
      return;
    }

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

    // Add unique constraint with error handling
    try {
      await queryInterface.addConstraint('patient_provider_assignments', {
        fields: ['patient_id', 'provider_id', 'role', 'ended_at'],
        type: 'unique',
        name: 'unique_patient_provider_role_assignment'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists') && !(error as any).message.includes('duplicate key')) {
        throw error;
      }
      console.log('Constraint unique_patient_provider_role_assignment already exists, skipping');
    }

    // Add indexes with error handling
    try {
      await queryInterface.addIndex('patient_provider_assignments', ['patient_id'], { 
        where: { ended_at: null },
        name: 'idx_assignments_patient'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_assignments_patient already exists, skipping');
    }

    try {
      await queryInterface.addIndex('patient_provider_assignments', ['provider_id'], { 
        where: { ended_at: null },
        name: 'idx_assignments_provider'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_assignments_provider already exists, skipping');
    }

    try {
      await queryInterface.addIndex('patient_provider_assignments', ['patient_id', 'provider_id'], { 
        where: { ended_at: null },
        name: 'idx_assignments_active'
      });
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Index idx_assignments_active already exists, skipping');
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('patient_provider_assignments');
  }
};