'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments'",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (tableExists.length > 0) {
      console.log('ℹ️ Table "payments" already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      subscription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patient_subscriptions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'healthcare_providers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'),
        defaultValue: 'pending',
      },
      payment_method: {
        type: Sequelize.ENUM('card', 'bank_account', 'paypal', 'apple_pay', 'google_pay'),
        allowNull: false,
      },
      stripe_payment_intent_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      stripe_charge_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      failure_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      failure_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      refund_reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      invoice_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      billing_period_start: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      billing_period_end: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {},
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
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex('payments', ['subscription_id']);
    await queryInterface.addIndex('payments', ['patient_id']);
    await queryInterface.addIndex('payments', ['provider_id']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['stripe_payment_intent_id']);
    await queryInterface.addIndex('payments', ['created_at']);
    await queryInterface.addIndex('payments', ['billing_period_start', 'billing_period_end']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  }
};