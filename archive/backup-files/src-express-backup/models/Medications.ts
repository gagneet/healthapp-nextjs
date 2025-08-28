// src/models/Medication.js
export default (sequelize: any, DataTypes: any) => {
  const Medication = sequelize.define('Medication', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    participant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    organizer_type: {
      type: DataTypes.ENUM('doctor', 'patient', 'care_taker', 'hsp', 'provider', 'admin'),
      allowNull: true,
    },
    organizer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    medicine_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'medicines',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
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
    frequency: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this as any).details?.frequency || null;
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
    tableName: 'medications',
    charset: 'latin1',
    paranoid: true,
    indexes: [
      { fields: ['medicine_id'] },
      { fields: ['participant_id'] },
      { fields: ['organizer_type', 'organizer_id'] },
    ],
  });

  return Medication;
};
