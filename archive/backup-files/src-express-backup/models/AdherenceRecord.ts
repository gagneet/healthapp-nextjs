// src/models/AdherenceRecord.js
import { DataTypes } from 'sequelize';
import { EVENT_TYPES } from '../config/enums.js';

export default (sequelize: any) => {
  const AdherenceRecord = sequelize.define('AdherenceRecord', {
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
    
    scheduled_event_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'scheduled_events',
        key: 'id'
      }
    },
    
    // Adherence details
    adherence_type: {
      type: DataTypes.ENUM,
      values: Object.values(EVENT_TYPES),
      allowNull: false,
    },
    
    due_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    
    recorded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // Adherence status
    is_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    is_partial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    is_missed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    // Additional data
    response_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidData(value: any) {
          if (value && typeof value !== 'object') {
            throw new Error('Response data must be a valid JSON object');
          }
        }
      }
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
    
  }, {
    tableName: 'adherence_records',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['scheduled_event_id']
      },
      {
        fields: ['due_at']
      },
      {
        fields: ['adherence_type']
      },
      {
        fields: ['is_completed', 'is_missed']
      },
      {
        fields: ['patientId', 'due_at']
      },
      {
        fields: ['patientId', 'adherence_type', 'due_at']
      }
    ],
    
    // Instance methods
    instanceMethods: {
      // Check if adherence was recorded on time
      isOnTime() {
        if (!(this as any).recorded_at) return false;
        
        const dueTime = new Date((this as any).due_at);
        const recordedTime = new Date((this as any).recorded_at);
        const timeDiff = recordedTime.getTime() - dueTime.getTime();
        
        // Consider on-time if recorded within 30 minutes of due time
        return Math.abs(timeDiff) <= 30 * 60 * 1000;
      },
      
      // Get adherence status
      getStatus() {
        if ((this as any).is_completed) return 'completed';
        if ((this as any).is_partial) return 'partial';
        if ((this as any).is_missed) return 'missed';
        return 'pending';
      },
      
      // Mark as completed
      async markCompleted(responseData = {}, notes = null) {
        (this as any).is_completed = true;
        (this as any).is_missed = false;
        (this as any).is_partial = false;
        (this as any).recorded_at = new Date();
        (this as any).response_data = responseData;
        if (notes) (this as any).notes = notes;
        await (this as any).save();
      },
      
      // Mark as missed
      async markMissed(notes = null) {
        (this as any).is_missed = true;
        (this as any).is_completed = false;
        (this as any).is_partial = false;
        if (notes) (this as any).notes = notes;
        await (this as any).save();
      },
      
      // Mark as partial
      async markPartial(responseData = {}, notes = null) {
        (this as any).is_partial = true;
        (this as any).is_completed = false;
        (this as any).is_missed = false;
        (this as any).recorded_at = new Date();
        (this as any).response_data = responseData;
        if (notes) (this as any).notes = notes;
        await (this as any).save();
      }
    },
    
    // Class methods
    classMethods: {
      // Get adherence summary for patient
      async getAdherenceSummary(patientId: any, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const records = await (this as any).findAll({
          where: {
            patientId: patientId,
            due_at: {
              [sequelize.Sequelize.Op.gte]: startDate
            }
          }
        });
        
        const total = records.length;
        const completed = records.filter((r: any) => r.is_completed).length;
        const missed = records.filter((r: any) => r.is_missed).length;
        const partial = records.filter((r: any) => r.is_partial).length;
        
        return {
          total,
          completed,
          missed,
          partial,
          adherence_rate: total > 0 ? (completed / total * 100).toFixed(2) : 0
        };
      },
      
      // Find overdue records
      findOverdue() {
        return (this as any).findAll({
          where: {
            due_at: {
              [sequelize.Sequelize.Op.lt]: new Date()
            },
            is_completed: false,
            is_missed: false
          }
        });
      },
      
      // Find by type and patient
      findByTypeAndPatient(patientId: any, adherenceType: any) {
        return (this as any).findAll({
          where: {
            patientId: patientId,
            adherence_type: adherenceType
          },
          order: [['due_at', 'DESC']]
        });
      }
    }
  });
  
  return AdherenceRecord;
};