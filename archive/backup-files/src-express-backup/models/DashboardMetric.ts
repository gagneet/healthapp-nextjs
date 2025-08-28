// src/models/DashboardMetric.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const DashboardMetric = sequelize.define('DashboardMetric', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    entity_type: {
      type: DataTypes.ENUM('patient', 'doctor', 'organization', 'system'),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    metric_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    metric_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    calculated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'dashboard_metrics',
    underscored: true,
    paranoid: false,
    indexes: [
      {
        fields: ['entity_type', 'entity_id', 'metric_type'],
        unique: true,
      },
      {
        fields: ['calculated_at', 'valid_until'],
      },
    ],
  });

  return DashboardMetric;
};