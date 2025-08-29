// src/models/Appointment.js
export default (sequelize: any, DataTypes: any) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    participant_one_type: {
      type: DataTypes.ENUM('doctor', 'patient', 'hsp'),
      allowNull: true,
    },
    participant_one_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    participant_two_type: {
      type: DataTypes.ENUM('doctor', 'patient', 'hsp'),
      allowNull: true,
    },
    participant_two_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    organizer_type: {
      type: DataTypes.ENUM('doctor', 'patient', 'care_taker', 'hsp', 'provider', 'admin'),
      allowNull: true,
    },
    organizer_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    provider_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rr_rule: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    appointment_type: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this as any).details?.type || null;
      },
    },
    appointment_status: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this as any).details?.status || null;
      },
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'appointments',
    charset: 'latin1',
    paranoid: true,
    indexes: [
      { fields: ['participant_one_id', 'participant_one_type'] },
      { fields: ['participant_two_id', 'participant_two_type'] },
      { fields: ['organizer_id', 'organizer_type'] },
      { fields: ['startDate'] },
    ],
  });

  return Appointment;
};
