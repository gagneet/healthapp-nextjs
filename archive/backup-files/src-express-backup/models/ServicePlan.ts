// src/models/ServicePlan.js
export default (sequelize: any, DataTypes: any) => {
  const ServicePlan = sequelize.define('ServicePlan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'healthcare_providers',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    billing_cycle: {
      type: DataTypes.ENUM('monthly', 'yearly', 'one-time', 'weekly'),
      allowNull: false,
      defaultValue: 'monthly',
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    patient_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trial_period_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    setup_fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    stripe_price_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'service_plans',
    paranoid: true,
    indexes: [
      { fields: ['provider_id'] },
      { fields: ['name'] },
      { fields: ['service_type'] },
      { fields: ['is_active'] },
      { fields: ['price'] },
      { fields: ['billing_cycle'] },
    ],
  });

  return ServicePlan;
};