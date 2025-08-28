// src/models/ScheduleEvent.js
export default (sequelize: any, DataTypes: any) => {
  const ScheduleEvent = sequelize.define('ScheduleEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    critical: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    event_type: {
      type: DataTypes.ENUM('appointment', 'reminder', 'medication-reminder', 'vitals', 'careplan-activation', 'diet', 'workout'),
      allowNull: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'pending', 'completed', 'expired', 'cancelled', 'started', 'prior'),
      allowNull: false,
      defaultValue: 'pending',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    event_priority: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this as any).details?.priority || null;
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'schedule_events',
    charset: 'latin1',
    paranoid: true,
    indexes: [
      { fields: ['event_type', 'status', 'date', 'start_time'] },
      { fields: ['event_id', 'event_type'] },
      { fields: ['status', 'date'] },
    ],
  });

  return ScheduleEvent;
};
