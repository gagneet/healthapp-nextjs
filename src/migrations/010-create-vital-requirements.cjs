// src/migrations/010-create-vital-requirements.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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

    // Add indexes
    await queryInterface.addIndex('vital_requirements', ['care_plan_id']);
    await queryInterface.addIndex('vital_requirements', ['vital_type_id']);
    await queryInterface.addIndex('vital_requirements', ['is_critical']);
    await queryInterface.addIndex('vital_requirements', ['frequency']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('vital_requirements');
  }
};