// src/models/Doctor.js - Simplified, Role-Specific Fields Only
export default (sequelize, DataTypes) => {
  const Doctor = sequelize.define('Doctor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    
    // Doctor-Specific Professional Information
    speciality_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'specialities',
        key: 'id',
      },
    },
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    medical_registration_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    years_of_experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    
    // Doctor-Specific Assets
    signature_pic: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    clinic_address: {
      type: DataTypes.JSON, // For multiple clinic locations
      allowNull: true,
    },
    
    // Professional Details
    consultation_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    available_hours: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    languages_spoken: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    
    // Integration Fields
    razorpay_account_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    // Status
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_available_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    paranoid: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['speciality_id'] },
      { fields: ['license_number'] },
      { fields: ['is_verified'] },
    ],
  });

  return Doctor;
};