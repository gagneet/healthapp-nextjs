// src/migrations/018-create-service-plans.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create service_plans table
    await queryInterface.createTable('service_plans', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'healthcare_providers',
          key: 'id'
        },
      },
      
      // Plan details
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      service_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      
      // Pricing
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
      },
      billing_cycle: {
        type: Sequelize.STRING(50), // monthly, yearly, one-time
        allowNull: true,
      },
      
      // Features
      features: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      patient_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      
      // Status
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Add indexes
    await queryInterface.addIndex('service_plans', ['provider_id']);
    await queryInterface.addIndex('service_plans', ['name']);
    await queryInterface.addIndex('service_plans', ['service_type']);
    await queryInterface.addIndex('service_plans', ['is_active']);
    await queryInterface.addIndex('service_plans', ['price']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('service_plans');
  }
};