// src/models/Doctor.js - Doctor Model for Licensed Physicians (PostgreSQL)
import { DataTypes } from 'sequelize';
import { createLogger } from '../middleware/logger.js';
import { PROVIDER_CAPABILITIES } from '../config/enums.js';

const logger = createLogger(import.meta.url);

export default (sequelize: any) => {
  const Doctor = sequelize.define('Doctor', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    
    // Professional Information
    medical_license_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'State medical license number'
    },
    
    npi_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      comment: 'National Provider Identifier'
    },
    
    board_certifications: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Board certification specialties'
    },
    
    medical_school: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Medical school attended'
    },
    
    residency_programs: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Residency and fellowship programs completed'
    },
    
    specialties: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Primary medical specialties'
    },
    
    sub_specialties: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Sub-specialties'
    },
    
    years_of_experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 60
      }
    },
    
    // Capabilities (all doctors have full medical capabilities)
    capabilities: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [
        PROVIDER_CAPABILITIES.PRESCRIBE_MEDICATIONS,
        PROVIDER_CAPABILITIES.ORDER_TESTS,
        PROVIDER_CAPABILITIES.DIAGNOSE,
        PROVIDER_CAPABILITIES.CREATE_TREATMENT_PLANS,
        PROVIDER_CAPABILITIES.CREATE_CARE_PLANS,
        PROVIDER_CAPABILITIES.MODIFY_MEDICATIONS,
        PROVIDER_CAPABILITIES.MONITOR_VITALS,
        PROVIDER_CAPABILITIES.PATIENT_EDUCATION,
        PROVIDER_CAPABILITIES.CARE_COORDINATION,
        PROVIDER_CAPABILITIES.EMERGENCY_RESPONSE
      ],
      comment: 'What this doctor is authorized to do'
    },
    
    // Verification
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether medical credentials are verified'
    },
    
    verification_documents: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Medical license and certification verification'
    },
    
    verification_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    verified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Professional Settings
    consultation_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    
    availability_schedule: {
      type: DataTypes.JSONB,
      defaultValue: {
        monday: { available: true, start: '09:00', end: '17:00' },
        tuesday: { available: true, start: '09:00', end: '17:00' },
        wednesday: { available: true, start: '09:00', end: '17:00' },
        thursday: { available: true, start: '09:00', end: '17:00' },
        friday: { available: true, start: '09:00', end: '17:00' },
        saturday: { available: false },
        sunday: { available: false }
      }
    },
    
    languages_spoken: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: ['en'],
      comment: 'Languages the doctor can communicate in'
    },
    
    notification_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        appointment_reminders: true,
        patient_updates: true,
        system_notifications: true,
        emergency_alerts: true,
        peer_consultations: true
      }
    },
    
    // Practice Information
    practice_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    practice_address: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    
    practice_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    
    signature_pic: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Digital signature for prescriptions'
    },
    
    // Integration Fields
    razorpay_account_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    // Statistics
    total_patients: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    active_treatment_plans: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    active_care_plans: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: { min: 0, max: 5 }
    },
    
    total_reviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    is_available_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // Timestamps
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
    
  }, {
    tableName: 'doctors',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['user_id'],
        unique: true
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['medical_license_number'],
        unique: true
      },
      {
        fields: ['npi_number'],
        unique: true,
        where: {
          npi_number: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['is_verified']
      },
      {
        fields: ['specialties'],
        using: 'gin'
      },
      {
        fields: ['board_certifications'],
        using: 'gin'
      }
    ],
    
    hooks: {
      beforeValidate: (doctor: any, options: any) => {
        // Normalize arrays to lowercase
        if (doctor.specialties) {
          doctor.specialties = doctor.specialties.map((s: any) => s.toLowerCase().trim());
        }
        
        if (doctor.sub_specialties) {
          doctor.sub_specialties = doctor.sub_specialties.map((s: any) => s.toLowerCase().trim());
        }
        
        if (doctor.board_certifications) {
          doctor.board_certifications = doctor.board_certifications.map((c: any) => c.toLowerCase().trim());
        }
      },
      
      beforeCreate: (doctor: any, options: any) => {
        // Set default capabilities if not provided
        if (!doctor.capabilities || doctor.capabilities.length === 0) {
          doctor.capabilities = Doctor.rawAttributes.capabilities.defaultValue;
        }
      },
      
      afterUpdate: (doctor: any, options: any) => {
        if (doctor.changed('is_verified')) {
          logger.info(`Doctor ${doctor.id} verification status changed to: ${doctor.is_verified}`);
        }
      }
    }
  });
  
  // Instance methods
  Doctor.prototype.hasCapability = function(capability: any) {
    return this.capabilities.includes(capability);
  };
  
  Doctor.prototype.canPrescribe = function() {
    return this.hasCapability(PROVIDER_CAPABILITIES.PRESCRIBE_MEDICATIONS) && this.is_verified;
  };
  
  Doctor.prototype.canDiagnose = function() {
    return this.hasCapability(PROVIDER_CAPABILITIES.DIAGNOSE) && this.is_verified;
  };
  
  Doctor.prototype.canCreateTreatmentPlans = function() {
    return this.hasCapability(PROVIDER_CAPABILITIES.CREATE_TREATMENT_PLANS) && this.is_verified;
  };
  
  Doctor.prototype.canCreateCarePlans = function() {
    return this.hasCapability(PROVIDER_CAPABILITIES.CREATE_CARE_PLANS) && this.is_verified;
  };
  
  Doctor.prototype.getPrimarySpecialty = function() {
    return this.specialties?.[0] || 'General Practice';
  };
  
  Doctor.prototype.hasSpecialty = function(specialty: any) {
    return this.specialties?.some((s: any) => 
      s.toLowerCase().includes(specialty.toLowerCase())
    );
  };
  
  Doctor.prototype.isBoardCertified = function(specialty = null) {
    if (!specialty) {
      return this.board_certifications.length > 0;
    }
    return this.board_certifications.some((cert: any) => 
      (cert as any).toLowerCase().includes((specialty as any).toLowerCase())
    );
  };
  
  Doctor.prototype.acceptsNewPatients = function() {
    return this.is_verified && this.total_patients < 500;
  };
  
  Doctor.prototype.getWorkloadPercentage = function() {
    const maxPatients = 500;
    return Math.round((this.total_patients / maxPatients) * 100);
  };
  
  return Doctor;
};