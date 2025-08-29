// src/models/AppointmentSlot.js
export default (sequelize: any, DataTypes: any) => {
  const AppointmentSlot = sequelize.define('AppointmentSlot', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    doctorId: {
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
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
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
  }, {
    tableName: 'appointment_slots',
    indexes: [
      { fields: ['doctorId', 'date', 'startTime'] },
      { fields: ['doctorId', 'is_available'] },
      { fields: ['date', 'is_available'] },
    ],
  });

  return AppointmentSlot;
};