// src/models/Payment.js
export default (sequelize: any, DataTypes: any) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subscription_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patient_subscriptions',
        key: 'id',
      },
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'healthcare_providers',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'),
      defaultValue: 'pending',
    },
    payment_method: {
      type: DataTypes.ENUM('card', 'bank_account', 'paypal', 'apple_pay', 'google_pay'),
      allowNull: false,
    },
    stripe_payment_intent_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    stripe_charge_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    failure_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    failure_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    refund_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    invoice_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    billing_period_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    billing_period_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'payments',
    indexes: [
      { fields: ['subscription_id'] },
      { fields: ['patientId'] },
      { fields: ['provider_id'] },
      { fields: ['status'] },
      { fields: ['stripe_payment_intent_id'] },
      { fields: ['createdAt'] },
      { fields: ['billing_period_start', 'billing_period_end'] },
    ],
  });

  return Payment;
};