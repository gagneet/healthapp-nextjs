// src/models/Patient.js - Simplified, Medical-Specific Fields Only
export default (sequelize, DataTypes) => {
  const Patient = sequelize.define('Patient', {
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
    
    // Medical-Specific Information
    patient_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    blood_group: {
      type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
      allowNull: true,
    },
    
    // Physical Measurements
    height_cm: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: { min: 0, max: 300 },
    },
    weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: { min: 0, max: 1000 },
    },
    bmi: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.height_cm && this.weight_kg) {
          const heightM = this.height_cm / 100;
          return (this.weight_kg / (heightM * heightM)).toFixed(1);
        }
        return null;
      },
    },
    
    // Medical History
    allergies: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    chronic_conditions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    current_medications: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    family_medical_history: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    
    // Care Relationships
    primary_doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    
    // Emergency Contact
    emergency_contact: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    
    // Insurance Information
    insurance_info: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    
    // Consent and Legal
    consent_given: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    data_sharing_consent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    paranoid: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['patient_id'] },
      { fields: ['primary_doctor_id'] },
      { fields: ['blood_group'] },
    ],
    hooks: {
      beforeCreate: (patient) => {
        if (!patient.patient_id) {
          patient.patient_id = `PAT${Date.now().toString().slice(-6)}`;
        }
      },
    },
  });

  return Patient;
};
