// src/models/Doctor.js
module.exports = (sequelize, DataTypes) => {
  const Doctor = sequelize.define('Doctor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    speciality_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'specialities',
        key: 'id',
      },
    },
    gender: {
      type: DataTypes.ENUM('m', 'f', 'o', ''),
      allowNull: true,
    },
    profile_pic: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    middle_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    activated_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    signature_pic: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    place_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    postal_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    formatted_address: {
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
    tableName: 'doctors',
    charset: 'latin1',
    paranoid: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['speciality_id'] },
    ],
  });

  return Doctor;
};
