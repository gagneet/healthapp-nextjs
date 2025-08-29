// src/models/Vital.js
export default (sequelize: any, DataTypes: any) => {
  const Vital = sequelize.define('Vital', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vital_template_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vital_templates',
        key: 'id',
      },
    },
    care_plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'carePlans',
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
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
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
