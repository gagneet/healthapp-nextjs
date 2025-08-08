// src/models/Organization.js
import { DataTypes } from 'sequelize';
import { ORGANIZATION_TYPES } from '../config/enums.js';

export default (sequelize: any) => {
  const Organization = sequelize.define('Organization', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    
    type: {
      type: DataTypes.STRING(100),
      defaultValue: 'clinic',
      validate: {
        isIn: [Object.values(ORGANIZATION_TYPES)]
      }
    },
    
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    
    contact_info: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidContactInfo(value: any) {
          if (value && typeof value !== 'object') {
            throw new Error('Contact info must be a valid JSON object');
          }
        }
      }
    },
    
    address: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidAddress(value: any) {
          if (value && typeof value !== 'object') {
            throw new Error('Address must be a valid JSON object');
          }
        }
      }
    },
    
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        timezone: 'UTC',
        working_hours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: { start: '09:00', end: '13:00' },
          sunday: { closed: true }
        },
        notification_preferences: {
          email_enabled: true,
          sms_enabled: false,
          push_enabled: true
        }
      }
    },
    
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // HIPAA Compliance fields
    hipaa_covered_entity: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this organization is a HIPAA covered entity'
    },
    
    business_associate_agreement: {
      type: DataTypes.JSONB,
      defaultValue: null,
      comment: 'BAA details if this organization is a business associate'
    },
    
    // Audit fields
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
    tableName: 'organizations',
    underscored: true,
    paranoid: true, // Enable soft deletes
    
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['type']
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
        fields: ['is_active']
      }
    ],
    
    hooks: {
      beforeValidate: (organization: any, options: any) => {
        // Ensure name is trimmed
        if (organization.name) {
          organization.name = organization.name.trim();
        }
      },
      
      beforeCreate: (organization: any, options: any) => {
        // Set default settings if not provided
        if (!organization.settings) {
          organization.settings = Organization.rawAttributes.settings.defaultValue;
        }
      }
    },
    
    // Instance methods
    instanceMethods: {
      // Get formatted address
      getFormattedAddress() {
        const addr = (this as any).address;
        if (!addr) return '';
        
        return [addr.street, addr.city, addr.state, addr.zip]
          .filter(Boolean)
          .join(', ');
      },
      
      // Check if organization is active
      isActive() {
        return this.is_active && !(this as any).deleted_at;
      },
      
      // Get organization timezone
      getTimezone() {
        return (this as any).settings?.timezone || 'UTC';
      }
    },
    
    // Class methods
    classMethods: {
      // Find active organizations
      findActive() {
        return (this as any).findAll({
          where: {
            is_active: true,
            deleted_at: null
          }
        });
      },
      
      // Find by type
      findByType(type: any) {
        return (this as any).findAll({
          where: {
            type,
            is_active: true,
            deleted_at: null
          }
        });
      }
    }
  });
  
  return Organization;
};