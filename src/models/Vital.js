// src/models/Vital.js
export default (sequelize, DataTypes) => {
  const Vital = sequelize.define('Vital', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vital_template_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vital_templates',
        key: 'id',
      },
    },
    care_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'care_plans',
        key: 'id',
      },
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
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
    tableName: 'vitals',
    charset: 'latin1',
    paranoid: true,
    indexes: [
      { fields: ['vital_template_id'] },
      { fields: ['care_plan_id'] },
    ],
  });

  return Vital;
};
