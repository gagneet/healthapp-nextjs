// src/models/Patient.js
module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define('Patient', {
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
    assigned_doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    gender: {
      type: DataTypes.ENUM('m', 'f', 'o', ''),
      allowNull: true,
      defaultValue: '',
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
    age: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    height: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    weight: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    height_cm: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 300,
      },
    },
    weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1000,
      },
    },
    current_age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    activated_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    uid: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    payment_terms_accepted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
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
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    place_id: {
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
    tableName: 'patients',
    charset: 'latin1',
    paranoid: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['assigned_doctor_id'] },
      { fields: ['uid'] },
    ],
    hooks: {
      beforeCreate: (patient) => {
        if (patient.dob) {
          const today = new Date();
          const birthDate = new Date(patient.dob);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          patient.current_age = age;
        }
      },
      beforeUpdate: (patient) => {
        if (patient.changed('dob') && patient.dob) {
          const today = new Date();
          const birthDate = new Date(patient.dob);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          patient.current_age = age;
        }
      },
    },
  });

  return Patient;
};
