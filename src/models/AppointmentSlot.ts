// src/models/AppointmentSlot.js
export default (sequelize, DataTypes) => {
  const AppointmentSlot = sequelize.define('AppointmentSlot', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    max_appointments: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    booked_appointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    slot_type: {
      type: DataTypes.ENUM('regular', 'emergency', 'consultation', 'follow_up'),
      defaultValue: 'regular',
    },
    notes: {
      type: DataTypes.TEXT,
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
  }, {
    tableName: 'appointment_slots',
    indexes: [
      { fields: ['doctor_id', 'date', 'start_time'] },
      { fields: ['doctor_id', 'is_available'] },
      { fields: ['date', 'is_available'] },
    ],
  });

  return AppointmentSlot;
};