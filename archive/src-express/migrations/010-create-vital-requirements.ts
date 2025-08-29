// src/migrations/010-create-vital-requirements.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('vitalRequirements');
    if (tableExists) {
      console.log('Table vitalRequirements already exists, skipping creation');
      return;
    }

    // Create vitalRequirements table
    await queryInterface.createTable('vitalRequirements', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      care_plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'carePlans',
          key: 'id'
        },
      },
      vitalTypeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'vital_types',
          key: 'id'
        },
      },
      
      frequency: {
        type: Sequelize.STRING(100),
        allowNull: false, // daily, twice_daily, weekly, etc.
      },
      preferred_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      isCritical: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      monitoring_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes with error handling
    const indexes = [
      { fields: ['care_plan_id'], name: 'idx_vital_requirements_care_plan' },
      { fields: ['vitalTypeId'], name: 'idx_vital_requirements_vital_type' },
      { fields: ['isCritical'], name: 'idx_vital_requirements_critical' },
      { fields: ['frequency'], name: 'idx_vital_requirements_frequency' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('vitalRequirements', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('vitalRequirements');
  }
};