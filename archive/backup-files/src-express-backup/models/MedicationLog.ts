// src/models/MedicationLog.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const MedicationLog = sequelize.define('MedicationLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    medication_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'medications',
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
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    taken_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dosage_taken: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    adherence_status: {
      type: DataTypes.ENUM('taken', 'missed', 'late', 'partial'),
      defaultValue: 'missed',
    },
    reminder_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'medication_logs',
    underscored: true,
    paranoid: false,
    indexes: [
      {
        fields: ['medication_id', 'scheduled_at'],
      },
      {
        fields: ['patientId', 'scheduled_at'],
      },
      {
        fields: ['adherence_status', 'scheduled_at'],
      },
    ],
  });

  return MedicationLog;
};