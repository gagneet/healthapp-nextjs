// src/models/HealthcareProvider.js - Healthcare Provider Model
import { DataTypes } from 'sequelize';
import { createLogger } from '../middleware/logger.js';

const logger = createLogger(import.meta.url);

export default (sequelize: any) => {
  const HealthcareProvider = sequelize.define('HealthcareProvider', {
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
    
    // Professional Information
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    
    specialties: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Array of medical specialties'
    },
    
    sub_specialties: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Array of sub-specialties'
    },
    
    qualifications: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Educational qualifications and certifications'
    },
    
    years_of_experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 60
      }
    },
    
    // Verification
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether provider credentials are verified'
    },
    
    verification_documents: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Verification documents and their status'
    },
    
    verification_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When verification was completed'
    },
    
    verified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Who verified this provider'
    },
    
    // Settings
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
      },
      comment: 'Weekly availability schedule'
    },
    
    notification_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        appointment_reminders: true,
        patient_updates: true,
        system_notifications: true,
        marketing_emails: false,
        sms_notifications: true,
        push_notifications: true
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
    
    practice_website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    
    // Statistics (updated by triggers/jobs)
    total_patients: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    
    active_care_plans: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    
    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5
      }
    },
    
    total_reviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
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
    tableName: 'healthcare_providers',
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
        fields: ['license_number'],
        unique: true,
        where: {
          license_number: {
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
        fields: ['verification_date']
      }
    ],
    
    hooks: {
      beforeValidate: (provider: any, options: any) => {
        // Normalize specialties to lowercase
        if (provider.specialties) {
          provider.specialties = provider.specialties.map((s: any) => s.toLowerCase().trim());
        }
        
        if (provider.sub_specialties) {
          provider.sub_specialties = provider.sub_specialties.map((s: any) => s.toLowerCase().trim());
        }
      },
      
      beforeCreate: (provider: any, options: any) => {
        // Set default availability if not provided
        if (!provider.availability_schedule) {
          provider.availability_schedule = HealthcareProvider.rawAttributes.availability_schedule.defaultValue;
        }
        
        // Set default notification preferences
        if (!provider.notification_preferences) {
          provider.notification_preferences = HealthcareProvider.rawAttributes.notification_preferences.defaultValue;
        }
      },
      
      afterUpdate: (provider: any, options: any) => {
        // Log verification status changes for audit
        if (provider.changed('is_verified')) {
          logger.info(`Provider ${provider.id} verification status changed to: ${provider.is_verified}`);
        }
      }
    },
    
    // Instance methods
    instanceMethods: {
      // Check if provider is available on a given day
      isAvailableOnDay(dayOfWeek: any) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const day = days[dayOfWeek];
        return (this as any).availability_schedule?.[day]?.available || false;
      },
      
      // Get availability for a specific day
      getDayAvailability(dayOfWeek: any) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const day = days[dayOfWeek];
        return (this as any).availability_schedule?.[day] || { available: false };
      },
      
      // Check if provider accepts new patients
      acceptsNewPatients() {
        return (this as any).is_verified && (this as any).total_patients < 1000; // Configurable limit
      },
      
      // Get primary specialty
      getPrimarySpecialty() {
        return (this as any).specialties?.[0] || 'General Practice';
      },
      
      // Check if provider has specialty
      hasSpecialty(specialty: any) {
        return (this as any).specialties?.some((s: any) => 
          s.toLowerCase().includes(specialty.toLowerCase())
        );
      },
      
      // Get formatted practice address
      getFormattedAddress() {
        const addr = (this as any).practice_address;
        if (!addr) return '';
        
        return [addr.street, addr.city, addr.state, addr.zip]
          .filter(Boolean)
          .join(', ');
      },
      
      // Calculate workload percentage
      getWorkloadPercentage() {
        const maxPatients = 1000; // Configurable
        return Math.round(((this as any).total_patients / maxPatients) * 100);
      }
    },
    
    // Class methods
    classMethods: {
      // Find verified providers
      findVerified() {
        return (this as any).findAll({
          where: {
            is_verified: true,
            deleted_at: null
          }
        });
      },
      
      // Find by specialty
      findBySpecialty(specialty: any) {
        return (this as any).findAll({
          where: {
            specialties: {
              [sequelize.Sequelize.Op.contains]: [specialty.toLowerCase()]
            },
            is_verified: true,
            deleted_at: null
          }
        });
      },
      
      // Find available providers
      findAvailable() {
        return (this as any).findAll({
          where: {
            is_verified: true,
            deleted_at: null
          },
          having: sequelize.where(
            sequelize.col('total_patients'), 
            '<', 
            1000
          )
        });
      },
      
      // Search providers
      searchProviders(query: any) {
        return (this as any).findAll({
          include: [{
            model: sequelize.models.User,
            as: 'user',
            where: {
              [sequelize.Sequelize.Op.or]: [
                { first_name: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } },
                { last_name: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } }
              ]
            }
          }],
          where: {
            [sequelize.Sequelize.Op.or]: [
              { specialties: { [sequelize.Sequelize.Op.contains]: [query.toLowerCase()] } },
              { license_number: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } }
            ],
            is_verified: true,
            deleted_at: null
          }
        });
      }
    }
  });
  
  return HealthcareProvider;
};