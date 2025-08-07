// src/migrations/010-create-vital-requirements.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('vital_requirements');
    if (tableExists) {
      console.log('Table vital_requirements already exists, skipping creation');
      return;
    }

    // Create vital_requirements table
    await queryInterface.createTable('vital_requirements', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      care_plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'care_plans',
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
      
      frequency: {
        type: Sequelize.STRING(100),
        allowNull: false, // daily, twice_daily, weekly, etc.
      },
      preferred_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      is_critical: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      monitoring_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
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
      { fields: ['care_plan_id'], name: 'idx_vital_requirements_care_plan' },
      { fields: ['vital_type_id'], name: 'idx_vital_requirements_vital_type' },
      { fields: ['is_critical'], name: 'idx_vital_requirements_critical' },
      { fields: ['frequency'], name: 'idx_vital_requirements_frequency' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('vital_requirements', index.fields, { name: index.name });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('vital_requirements');
  }
};