// src/models/Symptom.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Symptom = sequelize.define('Symptom', {
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
    
    care_plan_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'care_plans',
        key: 'id'
      }
    },
    
    // Symptom details
    symptom_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    
    severity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10
      }
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    body_location: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidLocation(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Body location must be a valid JSON object');
          }
        }
      }
    },
    
    // Timing
    onset_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    recorded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    
    // Additional data
    triggers: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isValidTriggers(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Triggers must be an array');
          }
        }
      }
    },
    
    relieving_factors: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isValidFactors(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Relieving factors must be an array');
          }
        }
      }
    },
    
    associated_symptoms: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isValidSymptoms(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Associated symptoms must be an array');
          }
        }
      }
    },
    
    // Attachments
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
    tableName: 'symptoms',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['patient_id']
      },
      {
        fields: ['care_plan_id']
      },
      {
        fields: ['symptom_name']
      },
      {
        fields: ['severity']
      },
      {
        fields: ['recorded_at']
      },
      {
        fields: ['onset_time']
      },
      {
        fields: ['patient_id', 'recorded_at']
      }
    ],
    
    // Instance methods
    instanceMethods: {
      // Get severity description
      getSeverityDescription() {
        if (!this.severity) return 'Not specified';
        
        const descriptions = {
          1: 'Very Mild',
          2: 'Mild',
          3: 'Mild to Moderate',
          4: 'Moderate',
          5: 'Moderate',
          6: 'Moderate to Severe',
          7: 'Severe',
          8: 'Severe',
          9: 'Very Severe',
          10: 'Worst Possible'
        };
        
        return descriptions[this.severity] || 'Unknown';
      },
      
      // Check if symptom is severe
      isSevere() {
        return this.severity && this.severity >= 7;
      },
      
      // Get duration if onset time is available
      getDuration() {
        if (!this.onset_time) return null;
        
        const duration = new Date(this.recorded_at) - new Date(this.onset_time);
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
          return `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
          return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
          const minutes = Math.floor(duration / (1000 * 60));
          return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
      }
    },
    
    // Class methods
    classMethods: {
      // Find symptoms for patient
      findForPatient(patientId, limit = 20) {
        return this.findAll({
          where: {
            patient_id: patientId
          },
          order: [['recorded_at', 'DESC']],
          limit
        });
      },
      
      // Find severe symptoms
      findSevere(minimumSeverity = 7) {
        return this.findAll({
          where: {
            severity: {
              [sequelize.Sequelize.Op.gte]: minimumSeverity
            }
          },
          order: [['recorded_at', 'DESC']]
        });
      },
      
      // Get symptom patterns for patient
      async getPatterns(patientId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const symptoms = await this.findAll({
          where: {
            patient_id: patientId,
            recorded_at: {
              [sequelize.Sequelize.Op.gte]: startDate
            }
          },
          attributes: [
            'symptom_name',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('AVG', sequelize.col('severity')), 'avg_severity']
          ],
          group: ['symptom_name'],
          order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
        });
        
        return symptoms;
      },
      
      // Search symptoms by name
      searchByName(query) {
        return this.findAll({
          where: {
            symptom_name: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          },
          order: [['recorded_at', 'DESC']]
        });
      }
    }
  });
  
  return Symptom;
};