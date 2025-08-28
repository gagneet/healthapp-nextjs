// src/models/VitalReading.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const VitalReading = sequelize.define('VitalReading', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    patientId: {
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
      allowNull: true, // Made nullable per medical requirements
      validate: {
        isDecimal: true,
        min: 0
      },
      comment: 'General vital sign value (nullable for composite readings)'
    },

    // Blood Pressure specific fields (medical best practice)
    systolic_value: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        isDecimal: true,
        min: 40,
        max: 250
      },
      comment: 'Systolic blood pressure in mmHg (normal: 90-180)'
    },

    diastolic_value: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        isDecimal: true,
        min: 30,
        max: 150
      },
      comment: 'Diastolic blood pressure in mmHg (normal: 60-110)'
    },

    // Additional vital signs following medical standards
    pulse_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 20,
        max: 250
      },
      comment: 'Heart rate in beats per minute (normal: 60-100)'
    },

    respiratory_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 5,
        max: 50
      },
      comment: 'Respiratory rate in breaths per minute (normal: 12-20)'
    },

    oxygen_saturation: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Oxygen saturation percentage (normal: 95-100%)'
    },
    
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    
    // Context
    readingTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    
    device_info: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidDeviceInfo(value: any) {
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

    // Medical alert system
    alert_level: {
      type: DataTypes.ENUM('normal', 'warning', 'critical', 'emergency'),
      allowNull: true,
      defaultValue: 'normal',
      comment: 'Medical alert level based on vital sign values'
    },

    alert_reasons: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of medical alert reasons (e.g., ["hypertension", "tachycardia"])',
      validate: {
        isValidAlertReasons(value: any) {
          if (value && !Array.isArray(value)) {
            throw new Error('Alert reasons must be an array');
          }
        }
      }
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
        isValidAttachments(value: any) {
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
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
    
  }, {
    tableName: 'vital_readings',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['vital_type_id']
      },
      {
        fields: ['readingTime']
      },
      {
        fields: ['is_flagged']
      },
      {
        fields: ['is_validated']
      },
      {
        fields: ['patientId', 'vital_type_id', 'readingTime']
      }
    ],
    
    hooks: {
      // Medical validation and alert system
      beforeSave: async (vitalReading: any, options: any) => {
        const alertReasons: string[] = [];
        let alertLevel = 'normal';

        // Blood Pressure Validation (Medical Best Practice)
        if (vitalReading.systolic_value && vitalReading.diastolic_value) {
          // TODO: Implement validation that systolic > diastolic
          // Currently allowing inverted values but should flag as RED ALERT
          // if (vitalReading.systolic_value <= vitalReading.diastolic_value) {
          //   alertReasons.push('inverted_blood_pressure');
          //   alertLevel = 'emergency';
          // }

          // Hypertensive Crisis (Emergency)
          if (vitalReading.systolic_value > 180 || vitalReading.diastolic_value > 120) {
            alertReasons.push('hypertensive_crisis');
            alertLevel = 'emergency';
          }
          // Severe Hypotension (Critical)
          else if (vitalReading.systolic_value < 90 || vitalReading.diastolic_value < 60) {
            alertReasons.push('severe_hypotension');
            alertLevel = alertLevel === 'emergency' ? 'emergency' : 'critical';
          }
          // Mild hypertension (Warning)
          else if (vitalReading.systolic_value > 140 || vitalReading.diastolic_value > 90) {
            alertReasons.push('hypertension');
            alertLevel = alertLevel === 'emergency' || alertLevel === 'critical' ? alertLevel : 'warning';
          }
        }

        // Pulse Rate Validation
        if (vitalReading.pulse_rate) {
          if (vitalReading.pulse_rate > 150) {
            alertReasons.push('severe_tachycardia');
            alertLevel = alertLevel === 'emergency' ? 'emergency' : 'critical';
          } else if (vitalReading.pulse_rate > 100) {
            alertReasons.push('tachycardia');
            alertLevel = alertLevel === 'emergency' || alertLevel === 'critical' ? alertLevel : 'warning';
          } else if (vitalReading.pulse_rate < 40) {
            alertReasons.push('severe_bradycardia');
            alertLevel = alertLevel === 'emergency' ? 'emergency' : 'critical';
          } else if (vitalReading.pulse_rate < 60) {
            alertReasons.push('bradycardia');
            alertLevel = alertLevel === 'emergency' || alertLevel === 'critical' ? alertLevel : 'warning';
          }
        }

        // Temperature Validation (if value is temperature)
        if (vitalReading.value && vitalReading.unit === '°C') {
          if (vitalReading.value > 40) {
            alertReasons.push('hyperthermia');
            alertLevel = 'emergency';
          } else if (vitalReading.value > 38) {
            alertReasons.push('fever');
            alertLevel = alertLevel === 'emergency' || alertLevel === 'critical' ? alertLevel : 'warning';
          } else if (vitalReading.value < 35) {
            alertReasons.push('hypothermia');
            alertLevel = alertLevel === 'emergency' ? 'emergency' : 'critical';
          }
        }

        // Oxygen Saturation Validation
        if (vitalReading.oxygen_saturation) {
          if (vitalReading.oxygen_saturation < 85) {
            alertReasons.push('severe_hypoxemia');
            alertLevel = 'emergency';
          } else if (vitalReading.oxygen_saturation < 95) {
            alertReasons.push('hypoxemia');
            alertLevel = alertLevel === 'emergency' ? 'emergency' : 'warning';
          }
        }

        // Respiratory Rate Validation
        if (vitalReading.respiratory_rate) {
          if (vitalReading.respiratory_rate > 30 || vitalReading.respiratory_rate < 8) {
            alertReasons.push('respiratory_distress');
            alertLevel = alertLevel === 'emergency' ? 'emergency' : 'critical';
          } else if (vitalReading.respiratory_rate > 24 || vitalReading.respiratory_rate < 12) {
            alertReasons.push('abnormal_respiratory_rate');
            alertLevel = alertLevel === 'emergency' || alertLevel === 'critical' ? alertLevel : 'warning';
          }
        }

        // Set calculated values
        vitalReading.alert_level = alertLevel;
        vitalReading.alert_reasons = alertReasons;
        vitalReading.is_flagged = alertLevel !== 'normal';

        // TODO: Implement automatic alert notifications for critical/emergency levels
        // TODO: Log RED ALERTS to separate monitoring system
        // TODO: Trigger real-time notifications to healthcare providers

        // Legacy compatibility check
        if (vitalReading.changed('value') || vitalReading.isNewRecord) {
          try {
            const VitalType = sequelize.models.VitalType;
            if (VitalType && vitalReading.vital_type_id) {
              const vitalType = await VitalType.findByPk(vitalReading.vital_type_id);
              
              if (vitalType && vitalType.isNormalValue && !vitalType.isNormalValue(vitalReading.value)) {
                vitalReading.is_flagged = true;
              }
            }
          } catch (error) {
            // Ignore errors in legacy check
            console.log('Warning: Could not perform legacy vital type check:', error);
          }
        }
      }
    }
  });
  
  return VitalReading;
};