// src/models/UserRole.js
export default (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_identity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    linked_with: {
      type: DataTypes.ENUM('doctor', 'patient', 'care_taker', 'hsp', 'provider', 'admin'),
      allowNull: true,
    },
    linked_id: {
      type: DataTypes.INTEGER,
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
    tableName: 'user_roles',
    charset: 'latin1',
    paranoid: true,
  });

  return UserRole;
};
