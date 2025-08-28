// src/models/Clinic.js
import { DataTypes } from 'sequelize';

const Clinic = (sequelize: any) => {
  const ClinicModel = sequelize.define('Clinic', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    address: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
      validate: {
        isValidAddress(value: any) {
          if (typeof value !== 'object') {
            throw new Error('Address must be a valid JSON object');
          }
          // Expected structure: { street, city, state, country, postal_code, formatted_address, latitude, longitude }
        }
      }
    },
    
    // Geo-location fields for enhanced location services
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90
      },
      comment: 'Latitude coordinate for maps and location services'
    },
    
    longitude: {
      type: DataTypes.DECIMAL(11, 8), 
      allowNull: true,
      validate: {
        min: -180,
        max: 180
      },
      comment: 'Longitude coordinate for maps and location services'
    },
    
    location_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the location has been verified via geocoding'
    },
    
    location_accuracy: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Geocoding accuracy level (ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE)'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isValidPhone(value: any) {
          if (value && !/^[\+]?[\d\-\s\(\)]{10,15}$/.test(value)) {
            throw new Error('Phone number must be valid');
          }
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    operating_hours: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    },
    services_offered: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      allowNull: true
    },
    clinic_images: {
      type: DataTypes.JSONB,
      defaultValue: [],
      allowNull: true
    },
    banner_image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    consultation_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    registration_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    established_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1800,
        max: new Date().getFullYear()
      }
    },
    facilities: {
      type: DataTypes.JSONB,
      defaultValue: [],
      allowNull: true
    },
    insurance_accepted: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      allowNull: true
    }
  }, {
    tableName: 'clinics',
    underscored: true,
    paranoid: true, // Enable soft deletes
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        fields: ['doctorId']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_primary']
      },
      {
        fields: ['doctorId', 'is_primary'],
        unique: true,
        where: {
          is_primary: true,
          deleted_at: null
        },
        name: 'unique_primary_clinic_per_doctor'
      }
    ],
    hooks: {
      beforeCreate: async (clinic: any) => {
        // Ensure only one primary clinic per doctor
        if (clinic.is_primary) {
          await ClinicModel.update(
            { is_primary: false },
            { 
              where: { 
                doctorId: clinic.doctorId,
                is_primary: true
              }
            }
          );
        }
      },
      beforeUpdate: async (clinic: any) => {
        // Ensure only one primary clinic per doctor
        if (clinic.is_primary && clinic.changed('is_primary')) {
          await ClinicModel.update(
            { is_primary: false },
            { 
              where: { 
                doctorId: clinic.doctorId,
                is_primary: true,
                id: { [sequelize.Sequelize.Op.ne]: clinic.id }
              }
            }
          );
        }
      }
    }
  });

  return ClinicModel;
};

export default Clinic;