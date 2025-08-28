// src/models/PatientSubscription.js
export default (sequelize: any, DataTypes: any) => {
  const PatientSubscription = sequelize.define('PatientSubscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    service_plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'service_plans',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIALING'),
      defaultValue: 'ACTIVE',
    },
    current_period_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    current_period_end: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    next_billing_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    trial_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    trial_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    payment_method_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    stripe_subscription_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    stripe_customer_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    last_payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_payment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    failure_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'patient_subscriptions',
    indexes: [
      { fields: ['patientId'] },
      { fields: ['provider_id'] },
      { fields: ['service_plan_id'] },
      { fields: ['status'] },
      { fields: ['next_billing_date'] },
      { fields: ['stripe_subscription_id'] },
      { fields: ['stripe_customer_id'] },
      { fields: ['patientId', 'provider_id'] },
    ],
  });

  return PatientSubscription;
};