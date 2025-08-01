// src/models/User.js - Centralized User Model
export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Identity Information
    user_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: { isEmail: true },
    },
    mobile_number: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    // Common Personal Information (moved from separate tables)
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
    prefix: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('m', 'f', 'o', ''),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    
    // Common Address Information
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
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    
    // System Fields
    password: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    profile_picture_url: {
      type: DataTypes.STRING(255),
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
    
    // Computed Fields
    full_name: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.first_name || ''} ${this.middle_name || ''} ${this.last_name || ''}`.replace(/\s+/g, ' ').trim();
      },
    },
    current_age: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.date_of_birth) return null;
        const today = new Date();
        const birthDate = new Date(this.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      },
    },
    
    // Metadata
    professional_info: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    activated_on: {
      type: DataTypes.DATE,
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
    paranoid: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['mobile_number'] },
      { fields: ['category'] },
      { fields: ['first_name', 'last_name'] },
      { fields: ['city', 'state'] },
    ],
  });

  return User;
};