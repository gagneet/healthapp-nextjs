// src/migrations/019-create-patient-subscriptions.js
'use strict';

export default {
  up: async (queryInterface: any, Sequelize: any) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('patient_subscriptions');
    if (tableExists) {
      console.log('Table patient_subscriptions already exists, skipping creation');
      return;
    }

    // Create subscription status enum with error handling
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE subscription_status AS ENUM (
          'ACTIVE',
          'INACTIVE', 
          'PAST_DUE',
          'CANCELLED',
          'EXPIRED',
          'TRIALING'
        );
      `);
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
      console.log('Enum subscription_status already exists, skipping');
    }

    // Create patient_subscriptions table
    await queryInterface.createTable('patient_subscriptions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      patientId: {
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
      
      trial_start: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      trial_end: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      
      // Payment
      payment_method_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      stripe_subscription_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      stripe_customer_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      last_payment_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_payment_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      failure_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      
      // Timestamps
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
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes with error handling
    const indexes = [
      { fields: ['patientId'], name: 'idx_patient_subscriptions_patient' },
      { fields: ['provider_id'], name: 'idx_patient_subscriptions_provider' },
      { fields: ['service_plan_id'], name: 'idx_patient_subscriptions_plan' },
      { fields: ['status'], name: 'idx_patient_subscriptions_status' },
      { fields: ['next_billing_date'], name: 'idx_patient_subscriptions_billing' },
      { fields: ['patientId', 'provider_id'], name: 'idx_patient_subscriptions_composite' }
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex('patient_subscriptions', index.fields, { name: index.name });
      } catch (error) {
        if (!(error as any).message.includes('already exists')) {
          throw error;
        }
        console.log(`Index ${index.name} already exists, skipping`);
      }
    }
  },

  down: async (queryInterface: any, Sequelize: any) => {
    await queryInterface.dropTable('patient_subscriptions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS subscription_status CASCADE;');
  }
};