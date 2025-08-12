// src/models/PaymentMethod.js
export default (sequelize: any, DataTypes: any) => {
  const PaymentMethod = sequelize.define('PaymentMethod', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    stripe_payment_method_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('card', 'bank_account', 'paypal'),
      allowNull: false,
    },
    // Card details (encrypted/masked)
    card_brand: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    card_last4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    card_exp_month: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    card_exp_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Bank account details (masked)
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bank_last4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    billing_address: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
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
    tableName: 'payment_methods',
    paranoid: true,
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['stripe_payment_method_id'] },
      { fields: ['type'] },
      { fields: ['is_default'] },
      { fields: ['is_active'] },
    ],
  });

  return PaymentMethod;
};