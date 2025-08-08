// src/models/Medicine.js
export default (sequelize: any, DataTypes: any) => {
  const Medicine = sequelize.define('Medicine', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(1000),
      defaultValue: 'tablet',
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    creator_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    public_medicine: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    algolia_object_id: {
      type: DataTypes.STRING(255),
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
    tableName: 'medicines',
    charset: 'latin1',
    paranoid: true,
  });

  return Medicine;
};
