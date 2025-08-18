// src/models/PatientAlert.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const PatientAlert = sequelize.define('PatientAlert', {
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
    alert_type: {
      type: DataTypes.ENUM('medication', 'vital', 'appointment', 'symptom', 'system'),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      defaultValue: 'medium',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    action_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    acknowledged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    acknowledged_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'patient_alerts',
    underscored: true,
    paranoid: false,
    indexes: [
      {
        fields: ['patient_id', 'alert_type', 'severity'],
      },
      {
        fields: ['acknowledged', 'resolved'],
      },
      {
        fields: ['created_at'],
      },
    ],
  });

  return PatientAlert;
};