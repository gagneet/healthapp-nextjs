// src/models/Medication.js
module.exports = (sequelize, DataTypes) => {
  const Medication = sequelize.define('Medication', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    participant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    organizer_type: {
      type: DataTypes.ENUM('doctor', 'patient', 'care_taker', 'hsp', 'provider', 'admin'),
      allowNull: true,
    },
    organizer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    medicine_id: {
      type: DataTypes.INTEGER,
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
        return this.details?.frequency || null;
      },
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
