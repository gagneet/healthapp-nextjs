// src/models/CarePlan.js
module.exports = (sequelize, DataTypes) => {
  const CarePlan = sequelize.define('CarePlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id',
      },
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    care_plan_template_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    activated_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    renew_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expired_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user_role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    channel_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    treatment_id: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.details?.treatment_id || null;
      },
    },
    diagnosis: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.details?.diagnosis || null;
      },
    },
    priority: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.details?.priority || null;
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
    tableName: 'care_plans',
    charset: 'latin1',
    paranoid: true,
    indexes: [
      { fields: ['doctor_id'] },
      { fields: ['patient_id'] },
      { fields: ['doctor_id', 'patient_id'] },
    ],
  });

  return CarePlan;
};
