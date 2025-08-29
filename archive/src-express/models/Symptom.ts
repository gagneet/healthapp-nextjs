// src/models/Symptom.js
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const Symptom = sequelize.define('Symptom', {
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
    
    care_plan_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'carePlans',
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
        isValidLocation(value: any) {
          if (value && typeof value !== 'object') {
            throw new Error('Body location must be a valid JSON object');
          }
        }
      }
    },
    
    // Timing
    onsetTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    recordedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    
    // Additional data
    triggers: {
      type: DataTypes.JSONB,
      defaultValue: [],
      validate: {
        isValidTriggers(value: any) {
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
        isValidFactors(value: any) {
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
        isValidSymptoms(value: any) {
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
        isValidAttachments(value: any) {
          if (value && !Array.isArray(value)) {
            throw new Error('Attachments must be an array');
          }
        }
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
    tableName: 'symptoms',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['patientId']
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
        fields: ['recordedAt']
      },
      {
        fields: ['onsetTime']
      },
      {
        fields: ['patientId', 'recordedAt']
      }
    ],
    
    // Instance methods
    instanceMethods: {
      // Get severity description
      getSeverityDescription() {
        if (!(this as any).severity) return 'Not specified';
        
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
        
        return (descriptions as any)[(this as any).severity] || 'Unknown';
      },
      
      // Check if symptom is severe
      isSevere() {
        return (this as any).severity && (this as any).severity >= 7;
      },
      
      // Get duration if onset time is available
      getDuration() {
        if (!(this as any).onsetTime) return null;
        
        const duration = new Date((this as any).recordedAt).getTime() - new Date((this as any).onsetTime).getTime();
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
      findForPatient(patientId: any, limit = 20) {
        return (this as any).findAll({
          where: {
            patientId: patientId
          },
          order: [['recordedAt', 'DESC']],
          limit
        });
      },
      
      // Find severe symptoms
      findSevere(minimumSeverity = 7) {
        return (this as any).findAll({
          where: {
            severity: {
              [sequelize.Sequelize.Op.gte]: minimumSeverity
            }
          },
          order: [['recordedAt', 'DESC']]
        });
      },
      
      // Get symptom patterns for patient
      async getPatterns(patientId: any, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const symptoms = await (this as any).findAll({
          where: {
            patientId: patientId,
            recordedAt: {
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
      searchByName(query: any) {
        return (this as any).findAll({
          where: {
            symptom_name: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          },
          order: [['recordedAt', 'DESC']]
        });
      }
    }
  });
  
  return Symptom;
};