// src/models/DoctorAvailability.js
export default (sequelize: any, DataTypes: any) => {
  const DoctorAvailability = sequelize.define('DoctorAvailability', {
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
    day_of_week: {
      type: DataTypes.INTEGER, // 0=Sunday, 1=Monday, etc.
      allowNull: false,
      validate: {
        min: 0,
        max: 6
      }
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    slot_duration: {
      type: DataTypes.INTEGER, // in minutes
      defaultValue: 30,
    },
    max_appointments_per_slot: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    break_start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    break_end_time: {
      type: DataTypes.TIME,
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
    tableName: 'doctor_availability',
    indexes: [
      { fields: ['doctorId', 'day_of_week'] },
      { fields: ['doctorId', 'is_available'] },
    ],
  });

  return DoctorAvailability;
};