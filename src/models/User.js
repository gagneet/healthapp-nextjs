// src/models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    prefix: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    mobile_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    profile_picture_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    sign_in_type: {
      type: DataTypes.ENUM('basic', 'google', 'facebook'),
      allowNull: false,
      defaultValue: 'basic',
    },
    category: {
      type: DataTypes.ENUM('doctor', 'patient', 'care_taker', 'hsp', 'provider', 'admin'),
      allowNull: false,
    },
    account_status: {
      type: DataTypes.ENUM('pending_verification', 'active', 'inactive', 'deactivated', 'suspended'),
      allowNull: false,
      defaultValue: 'pending_verification',
    },
    professional_info: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    activated_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    onboarded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    onboarding_status: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    has_consent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    his_id: {
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
    tableName: 'users',
    charset: 'latin1',
    paranoid: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['mobile_number'] },
      { fields: ['category'] },
      { fields: ['account_status'] },
      { fields: ['email', 'category'] },
    ],
  });

  return User;
};
