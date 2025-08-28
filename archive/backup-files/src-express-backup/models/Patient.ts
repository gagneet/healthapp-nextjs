// src/models/Patient.js - Enhanced Patient Model for PostgreSQL
import { DataTypes } from 'sequelize';
import { createLogger } from '../middleware/logger.js';

const logger = createLogger(import.meta.url);

export default (sequelize: any) => {
  const Patient = sequelize.define('Patient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    userId: {
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
    
    // Medical Information
    medical_record_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'Organization-specific patient identifier'
    },
    
    patientId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Custom patient identifier - supports any format (numbers, alphanumeric, structured)'
    },
    
    emergency_contacts: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of emergency contact objects',
      validate: {
        isValidContacts(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Emergency contacts must be an array');
          }
        }
      }
    },
    
    insurance_information: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Insurance details and coverage information'
    },
    
    medical_history: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Past medical conditions and treatments'
    },
    
    allergies: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Known allergies and reactions',
      validate: {
        isValidAllergies(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Allergies must be an array');
          }
        }
      }
    },
    
    current_medications: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Current medications from external sources'
    },
    
    // Physical Measurements
    height_cm: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 300
      },
      comment: 'Height in centimeters'
    },
    
    weight_kg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1000
      },
      comment: 'Weight in kilograms'
    },
    
    // Additional Medical Fields
    blood_type: {
      type: DataTypes.STRING(5),
      allowNull: true,
      validate: {
        isIn: [['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']]
      }
    },
    
    primary_language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en',
      comment: 'Primary language for communication'
    },
    
    // Risk Assessment
    risk_level: {
      type: DataTypes.STRING(20),
      defaultValue: 'low',
      validate: {
        isIn: [['low', 'medium', 'high', 'critical']]
      }
    },
    
    risk_factors: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Clinical risk factors'
    },
    
    // Settings
    communication_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        preferred_contact_method: 'email',
        appointment_reminders: true,
        medication_reminders: true,
        health_tips: false,
        research_participation: false,
        language: 'en',
        time_zone: 'UTC'
      }
    },
    
    privacy_settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        share_with_family: false,
        share_for_research: false,
        marketing_communications: false,
        data_sharing_consent: false,
        provider_directory_listing: true
      }
    },
    
    // Care Coordination - Updated to support both doctors and HSPs
    primaryCareDoctorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      },
      comment: 'Primary care physician'
    },
    
    primary_care_hsp_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hsps',
        key: 'id'
      },
      comment: 'Primary HSP (if no doctor assigned)'
    },
    
    care_coordinator_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Care coordinator (can be doctor or HSP)'
    },
    
    care_coordinator_type: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [['doctor', 'hsp']]
      },
      comment: 'Type of care coordinator'
    },
    
    // Analytics and Tracking
    overall_adherence_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Overall medication adherence percentage'
    },
    
    last_adherence_calculation: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When adherence score was last calculated'
    },
    
    total_appointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    
    missed_appointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    
    last_visit_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    next_appointment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Health Metrics
    bmi: {
      type: DataTypes.VIRTUAL,
      get() {
        if ((this as any).height_cm && (this as any).weight_kg) {
          const heightInMeters = (this as any).height_cm / 100;
          return ((this as any).weight_kg / (heightInMeters * heightInMeters)).toFixed(1);
        }
        return null;
      }
    },
    
    // Status flags
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    requires_interpreter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    has_mobility_issues: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    },
    
    // Provider linkage and consent tracking
    linked_provider_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      comment: 'Current provider organization linked to this patient'
    },
    
    provider_linked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the patient was linked to the current provider'
    },
    
    provider_consent_given: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether patient gave consent for current provider linkage'
    },
    
    provider_consent_given_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When consent was given for current provider linkage'
    },
    
    provider_consent_method: {
      type: DataTypes.ENUM('sms', 'email', 'in_person', 'phone', 'automatic'),
      allowNull: true,
      comment: 'Method used to obtain consent for provider linkage'
    }
    
  }, {
    tableName: 'patients',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['userId'],
        unique: true
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['medical_record_number'],
        unique: true,
        where: {
          medical_record_number: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['primaryCareDoctorId']
      },
      {
        fields: ['primary_care_hsp_id']
      },
      {
        fields: ['risk_level']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['allergies'],
        using: 'gin'
      },
      {
        fields: ['medical_history'],
        using: 'gin'
      }
    ],
    
    hooks: {
      beforeValidate: (patient: any, options: any) => {
        // Generate medical record number if not provided
        if (!patient.medical_record_number && patient.organization_id) {
          const timestamp = Date.now().toString().slice(-6);
          const random = Math.random().toString(36).substring(2, 5).toUpperCase();
          patient.medical_record_number = `PAT-${timestamp}-${random}`;
        }
      },
      
      beforeCreate: (patient: any, options: any) => {
        // Set default preferences
        if (!patient.communication_preferences) {
          patient.communication_preferences = Patient.rawAttributes.communication_preferences.defaultValue;
        }
        
        if (!patient.privacy_settings) {
          patient.privacy_settings = Patient.rawAttributes.privacy_settings.defaultValue;
        }
      },
      
      afterUpdate: (patient: any, options: any) => {
        // Recalculate BMI if height or weight changed
        if (patient.changed('height_cm') || patient.changed('weight_kg')) {
          // BMI is calculated as virtual field, no action needed
        }
        
        // Update risk level based on conditions
        if (patient.changed('medical_history') || patient.changed('allergies')) {
          // Trigger risk assessment recalculation (implement as needed)
          logger.info(`Risk assessment needed for patient ${patient.id}`);
        }
      }
    },
    
    // Instance methods
    instanceMethods: {
      // Get age from user's date of birth
      async getAge() {
        const user = await (this as any).getUser();
        if (!user || !user.date_of_birth) return null;
        
        const today = new Date();
        const birthDate = new Date(user.date_of_birth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
      },
      
      // Check if patient has specific allergy
      hasAllergy(allergen: any) {
        return (this as any).allergies.some((allergy: any) => 
          allergy.name?.toLowerCase().includes(allergen.toLowerCase()) ||
          allergy.allergen?.toLowerCase().includes(allergen.toLowerCase())
        );
      },
      
      // Get BMI category
      getBMICategory() {
        const bmi = parseFloat((this as any).bmi);
        if (!bmi) return null;
        
        if (bmi < 18.5) return 'underweight';
        if (bmi < 25) return 'normal';
        if (bmi < 30) return 'overweight';
        return 'obese';
      },
      
      // Calculate appointment adherence
      getAppointmentAdherence() {
        if ((this as any).total_appointments === 0) return null;
        
        const attended = (this as any).total_appointments - (this as any).missed_appointments;
        return ((attended / (this as any).total_appointments) * 100).toFixed(1);
      },
      
      // Check if patient is high risk
      isHighRisk() {
        return ['high', 'critical'].includes((this as any).risk_level);
      },
      
      // Get primary emergency contact
      getPrimaryEmergencyContact() {
        return (this as any).emergency_contacts.find((contact: any) => contact.primary) || 
               (this as any).emergency_contacts[0] || 
               null;
      },
      
      // Check if patient needs interpreter
      needsInterpreter() {
        return this.requires_interpreter || (this as any).primary_language !== 'en';
      },
      
      // Get preferred contact method
      getPreferredContactMethod() {
        return (this as any).communication_preferences?.preferred_contact_method || 'email';
      },
      
      // Format height for display
      getFormattedHeight() {
        if (!(this as any).height_cm) return null;
        
        const feet = Math.floor((this as any).height_cm / 30.48);
        const inches = Math.round(((this as any).height_cm / 2.54) % 12);
        return `${feet}'${inches}" (${(this as any).height_cm}cm)`;
      },
      
      // Format weight for display
      getFormattedWeight() {
        if (!(this as any).weight_kg) return null;
        
        const pounds = Math.round((this as any).weight_kg * 2.20462);
        return `${pounds} lbs (${(this as any).weight_kg}kg)`;
      },
      
      // Get primary care provider (doctor or HSP)
      async getPrimaryCareProvider() {
        if ((this as any).primaryCareDoctorId) {
          const Doctor = sequelize.models.Doctor;
          return await Doctor.findByPk((this as any).primaryCareDoctorId);
        } else if ((this as any).primary_care_hsp_id) {
          const HSP = sequelize.models.HSP;
          return await HSP.findByPk((this as any).primary_care_hsp_id);
        }
        return null;
      },
      
      // Get care coordinator
      async getCareCoordinator() {
        if (!this.care_coordinator_id || !(this as any).care_coordinator_type) return null;
        
        if ((this as any).care_coordinator_type === 'doctor') {
          const Doctor = sequelize.models.Doctor;
          return await Doctor.findByPk(this.care_coordinator_id);
        } else if ((this as any).care_coordinator_type === 'hsp') {
          const HSP = sequelize.models.HSP;
          return await HSP.findByPk(this.care_coordinator_id);
        }
        return null;
      },
      
      // Set primary care provider
      setPrimaryCareProvider(providerId: any, providerType: any) {
        if (providerType === 'doctor') {
          (this as any).primaryCareDoctorId = providerId;
          (this as any).primary_care_hsp_id = null;
        } else if (providerType === 'hsp') {
          (this as any).primary_care_hsp_id = providerId;
          (this as any).primaryCareDoctorId = null;
        }
        return (this as any).save();
      },
      
      // Set care coordinator
      setCareCoordinator(providerId: any, providerType: any) {
        this.care_coordinator_id = providerId;
        (this as any).care_coordinator_type = providerType;
        return (this as any).save();
      }
    },
    
    // Class methods
    classMethods: {
      // Find active patients
      findActive() {
        return (this as any).findAll({
          where: {
            is_active: true,
            deleted_at: null
          }
        });
      },
      
      // Find high-risk patients
      findHighRisk() {
        return (this as any).findAll({
          where: {
            risk_level: ['high', 'critical'],
            deleted_at: null
          }
        });
      },
      
      // Find by doctor provider
      findByDoctor(doctorId: any) {
        return (this as any).findAll({
          where: {
            [sequelize.Sequelize.Op.or]: [
              { primaryCareDoctorId: doctorId },
              { 
                care_coordinator_id: doctorId,
                care_coordinator_type: 'doctor'
              }
            ],
            deleted_at: null
          }
        });
      },
      
      // Find by HSP provider
      findByHSP(hspId: any) {
        return (this as any).findAll({
          where: {
            [sequelize.Sequelize.Op.or]: [
              { primary_care_hsp_id: hspId },
              { 
                care_coordinator_id: hspId,
                care_coordinator_type: 'hsp'
              }
            ],
            deleted_at: null
          }
        });
      },
      
      // Search patients
      searchPatients(query: any) {
        return (this as any).findAll({
          include: [{
            model: sequelize.models.User,
            as: 'user',
            where: {
              [sequelize.Sequelize.Op.or]: [
                { first_name: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } },
                { last_name: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } },
                { email: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } }
              ]
            }
          }],
          where: {
            [sequelize.Sequelize.Op.or]: [
              { medical_record_number: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } }
            ],
            deleted_at: null
          }
        });
      }
    }
  });
  
  return Patient;
};