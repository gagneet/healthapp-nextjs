// src/migrations/019-create-patient-subscriptions.js
'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Create subscription status enum
    await queryInterface.sequelize.query(`
      CREATE TYPE subscription_status AS ENUM (
        'ACTIVE',
        'INACTIVE', 
        'PAST_DUE',
        'CANCELLED',
        'EXPIRED'
      );
    `);

    // Create patient_subscriptions table
    await queryInterface.createTable('patient_subscriptions', {
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
      service_plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'service_plans',
          key: 'id'
        },
      },
      
      // Subscription details
      status: {
        type: 'subscription_status',
        defaultValue: 'ACTIVE',
      },
      
      // Billing
      current_period_start: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      current_period_end: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      next_billing_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      
      // Payment
      payment_method_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
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
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex('patient_subscriptions', ['patient_id']);
    await queryInterface.addIndex('patient_subscriptions', ['provider_id']);
    await queryInterface.addIndex('patient_subscriptions', ['service_plan_id']);
    await queryInterface.addIndex('patient_subscriptions', ['status']);
    await queryInterface.addIndex('patient_subscriptions', ['next_billing_date']);
    await queryInterface.addIndex('patient_subscriptions', ['patient_id', 'provider_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('patient_subscriptions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS subscription_status CASCADE;');
  }
};