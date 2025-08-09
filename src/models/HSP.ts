// src/models/HSP.js - Healthcare Support Personnel Model (Nurses, PAs, etc.)
import { DataTypes } from 'sequelize';
import { createLogger } from '../middleware/logger.ts';
import { HSP_TYPES, PROVIDER_CAPABILITIES } from '../config/enums.ts';

const logger = createLogger(import.meta.url);

export default (sequelize: any) => {
  const HSP = sequelize.define('HSP', {
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
    
    // HSP Type and Qualifications
    hsp_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [Object.values(HSP_TYPES)]
      },
      comment: 'Type of Healthcare Support Personnel'
    },
    
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Professional license number (RN, LPN, etc.)'
    },
    
    certification_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Certification number for specific HSP type'
    },
    
    certifications: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Professional certifications (CPR, ACLS, etc.)'
    },
    
    education: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Educational background and degrees'
    },
    
    specializations: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Areas of specialization within HSP role'
    },
    
    years_of_experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 50
      }
    },
    
    // Capabilities (varies by HSP type)
    capabilities: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [
        PROVIDER_CAPABILITIES.MONITOR_VITALS,
        PROVIDER_CAPABILITIES.PATIENT_EDUCATION,
        PROVIDER_CAPABILITIES.CARE_COORDINATION
      ],
      comment: 'What this HSP is authorized to do based on their type'
    },
    
    // Supervision Requirements
    requires_supervision: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this HSP requires physician supervision'
    },
    
    supervising_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      },
      comment: 'Doctor supervising this HSP'
    },
    
    supervision_level: {
      type: DataTypes.STRING(20),
      defaultValue: 'direct',
      validate: {
        isIn: [['direct', 'collaborative', 'independent']]
      },
      comment: 'Level of supervision required'
    },
    
    // Verification
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether credentials are verified'
    },
    
    verification_documents: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'License and certification verification'
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
    hourly_rate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Hourly compensation rate'
    },
    
    availability_schedule: {
      type: DataTypes.JSONB,
      defaultValue: {
        monday: { available: true, start: '08:00', end: '18:00' },
        tuesday: { available: true, start: '08:00', end: '18:00' },
        wednesday: { available: true, start: '08:00', end: '18:00' },
        thursday: { available: true, start: '08:00', end: '18:00' },
        friday: { available: true, start: '08:00', end: '18:00' },
        saturday: { available: false },
        sunday: { available: false }
      }
    },
    
    languages_spoken: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: ['en'],
      comment: 'Languages the HSP can communicate in'
    },
    
    notification_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        patient_updates: true,
        system_notifications: true,
        emergency_alerts: true,
        shift_reminders: true
      }
    },
    
    // Work Environment
    departments: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Hospital departments or units where HSP works'
    },
    
    shift_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        preferred_shifts: ['day'],
        weekend_availability: false,
        night_shift_available: false
      }
    },
    
    // Statistics
    total_patients_assisted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    active_care_plans: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    
    tasks_completed: {
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
    
    is_available: {
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
    tableName: 'hsps',
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
        fields: ['hsp_type']
      },
      {
        fields: ['license_number'],
        unique: true,
        where: {
          license_number: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['supervising_doctor_id']
      },
      {
        fields: ['is_verified']
      },
      {
        fields: ['specializations'],
        using: 'gin'
      },
      {
        fields: ['departments'],
        using: 'gin'
      }
    ],
    
    hooks: {
      beforeValidate: (hsp: any, options: any) => {
        // Normalize arrays
        if (hsp.specializations) {
          hsp.specializations = hsp.specializations.map((s: any) => s.toLowerCase().trim());
        }
        
        if (hsp.departments) {
          hsp.departments = hsp.departments.map((d: any) => d.toLowerCase().trim());
        }
        
        if (hsp.certifications) {
          hsp.certifications = hsp.certifications.map((c: any) => c.toLowerCase().trim());
        }
      },
      
      beforeCreate: (hsp: any, options: any) => {
        // Set capabilities based on HSP type
        if (!hsp.capabilities || hsp.capabilities.length === 0) {
          hsp.capabilities = HSP.getCapabilitiesByType(hsp.hsp_type);
        }
        
        // Set supervision requirements based on type
        if (hsp.hsp_type === HSP_TYPES.NURSE_PRACTITIONER || 
            hsp.hsp_type === HSP_TYPES.PHYSICIAN_ASSISTANT) {
          hsp.requires_supervision = false;
          hsp.supervision_level = 'collaborative';
        }
      },
      
      afterUpdate: (hsp: any, options: any) => {
        if (hsp.changed('is_verified')) {
          logger.info(`HSP ${hsp.id} verification status changed to: ${hsp.is_verified}`);
        }
      }
    }
  });
  
  // Static method to get capabilities by HSP type
  HSP.getCapabilitiesByType = function(hspType: any) {
    const baseCapabilities = [
      PROVIDER_CAPABILITIES.MONITOR_VITALS,
      PROVIDER_CAPABILITIES.PATIENT_EDUCATION,
      PROVIDER_CAPABILITIES.CARE_COORDINATION
    ];
    
    switch (hspType) {
      case HSP_TYPES.NURSE_PRACTITIONER:
        return [
          ...baseCapabilities,
          PROVIDER_CAPABILITIES.PRESCRIBE_MEDICATIONS,
          PROVIDER_CAPABILITIES.ORDER_TESTS,
          PROVIDER_CAPABILITIES.DIAGNOSE,
          PROVIDER_CAPABILITIES.CREATE_TREATMENT_PLANS,
          PROVIDER_CAPABILITIES.CREATE_CARE_PLANS,
          PROVIDER_CAPABILITIES.MODIFY_MEDICATIONS
        ];
        
      case HSP_TYPES.PHYSICIAN_ASSISTANT:
        return [
          ...baseCapabilities,
          PROVIDER_CAPABILITIES.PRESCRIBE_MEDICATIONS,
          PROVIDER_CAPABILITIES.ORDER_TESTS,
          PROVIDER_CAPABILITIES.CREATE_TREATMENT_PLANS,
          PROVIDER_CAPABILITIES.MODIFY_MEDICATIONS
        ];
        
      case HSP_TYPES.CLINICAL_PHARMACIST:
        return [
          ...baseCapabilities,
          PROVIDER_CAPABILITIES.MODIFY_MEDICATIONS,
          PROVIDER_CAPABILITIES.ORDER_TESTS
        ];
        
      case HSP_TYPES.REGISTERED_NURSE:
        return [
          ...baseCapabilities,
          PROVIDER_CAPABILITIES.EMERGENCY_RESPONSE
        ];
        
      default:
        return baseCapabilities;
    }
  };
  
  // Instance methods
  HSP.prototype.hasCapability = function(capability: any) {
    return this.capabilities.includes(capability);
  };
  
  HSP.prototype.canPrescribe = function() {
    return this.hasCapability(PROVIDER_CAPABILITIES.PRESCRIBE_MEDICATIONS) && 
           this.is_verified && 
           !this.requiresSupervisionFor('prescribe');
  };
  
  HSP.prototype.canOrderTests = function() {
    return this.hasCapability(PROVIDER_CAPABILITIES.ORDER_TESTS) && this.is_verified;
  };
  
  HSP.prototype.canCreateTreatmentPlans = function() {
    return this.hasCapability(PROVIDER_CAPABILITIES.CREATE_TREATMENT_PLANS) && this.is_verified;
  };
  
  HSP.prototype.canCreateCarePlans = function() {
    return this.hasCapability(PROVIDER_CAPABILITIES.CREATE_CARE_PLANS) && this.is_verified;
  };
  
  HSP.prototype.requiresSupervisionFor = function(action: any) {
    if (!this.requires_supervision) return false;
    
    const supervisedActions = ['prescribe', 'diagnose', 'surgery'];
    return supervisedActions.includes(action.toLowerCase());
  };
  
  HSP.prototype.getPrimarySpecialization = function() {
    return this.specializations?.[0] || this.hsp_type.replace('_', ' ');
  };
  
  HSP.prototype.acceptsNewPatients = function() {
    return this.is_verified && this.total_patients_assisted < 200;
  };
  
  HSP.prototype.getWorkloadPercentage = function() {
    const maxPatients = 200;
    return Math.round((this.total_patients_assisted / maxPatients) * 100);
  };
  
  HSP.prototype.isIndependentPractitioner = function() {
    return [HSP_TYPES.NURSE_PRACTITIONER, HSP_TYPES.PHYSICIAN_ASSISTANT].includes(this.hsp_type);
  };
  
  return HSP;
};