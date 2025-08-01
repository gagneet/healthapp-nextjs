// src/models/VitalReading.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const VitalReading = sequelize.define('VitalReading', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    
    vital_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vital_types',
        key: 'id'
      }
    },
    
    adherence_record_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'adherence_records',
        key: 'id'
      }
    },
    
    // Reading data
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0
      }
    },
    
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    
    // Context
    reading_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    
    device_info: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidDeviceInfo(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Device info must be a valid JSON object');
          }
        }
      }
    },
    
    is_flagged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    // Notes and attachments
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isValidAttachments(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Attachments must be an array');
          }
        }
      }
    },
    
    // Validation
    is_validated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    validated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'healthcare_providers',
        key: 'id'
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
    }
    
  }, {
    tableName: 'vital_readings',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['patient_id']
      },
      {
        fields: ['vital_type_id']
      },
      {
        fields: ['reading_time']
      },
      {
        fields: ['is_flagged']
      },
      {
        fields: ['is_validated']
      },
      {
        fields: ['patient_id', 'vital_type_id', 'reading_time']
      }
    ],
    
    hooks: {
      // Auto-flag readings outside normal range
      beforeSave: async (vitalReading, options) => {
        if (vitalReading.changed('value') || vitalReading.isNewRecord) {
          // Get vital type to check normal range
          const VitalType = sequelize.models.VitalType;
          const vitalType = await VitalType.findByPk(vitalReading.vital_type_id);
          
          if (vitalType && !vitalType.isNormalValue(vitalReading.value)) {
            vitalReading.is_flagged = true;
          }
        }
      }
    },
    
    // Instance methods
    instanceMethods: {
      // Check if reading is within normal range
      async isNormal() {
        const VitalType = sequelize.models.VitalType;
        const vitalType = await VitalType.findByPk(this.vital_type_id);
        return vitalType ? vitalType.isNormalValue(this.value) : true;
      },
      
      // Validate reading
      async validate(validatedBy) {
        this.is_validated = true;
        this.validated_by = validatedBy;
        await this.save();
      },
      
      // Flag reading
      async flag(notes = null) {
        this.is_flagged = true;
        if (notes) this.notes = notes;
        await this.save();
      },
      
      // Get formatted value with unit
      getFormattedValue() {
        return this.unit ? `${this.value} ${this.unit}` : this.value.toString();
      }
    },
    
    // Class methods
    classMethods: {
      // Get readings for patient and vital type
      findForPatientAndType(patientId, vitalTypeId, limit = 10) {
        return this.findAll({
          where: {
            patient_id: patientId,
            vital_type_id: vitalTypeId
          },
          order: [['reading_time', 'DESC']],
          limit
        });
      },
      
      // Find flagged readings
      findFlagged() {
        return this.findAll({
          where: {
            is_flagged: true
          },
          include: ['Patient', 'VitalType']
        });
      },
      
      // Get trend data for patient
      async getTrendData(patientId, vitalTypeId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        return this.findAll({
          where: {
            patient_id: patientId,
            vital_type_id: vitalTypeId,
            reading_time: {
              [sequelize.Sequelize.Op.gte]: startDate
            }
          },
          order: [['reading_time', 'ASC']],
          attributes: ['value', 'reading_time', 'unit']
        });
      },
      
      // Get latest reading for patient and type
      getLatest(patientId, vitalTypeId) {
        return this.findOne({
          where: {
            patient_id: patientId,
            vital_type_id: vitalTypeId
          },
          order: [['reading_time', 'DESC']]
        });
      }
    }
  });
  
  return VitalReading;
};