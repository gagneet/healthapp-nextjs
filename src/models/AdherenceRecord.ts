// src/models/AdherenceRecord.js
import { DataTypes } from 'sequelize';
import { EVENT_TYPES } from '../config/enums.js';

export default (sequelize) => {
  const AdherenceRecord = sequelize.define('AdherenceRecord', {
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
        isValidData(value) {
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
    tableName: 'adherence_records',
    underscored: true,
    timestamps: true,
    
    indexes: [
      {
        fields: ['patient_id']
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
        fields: ['patient_id', 'due_at']
      },
      {
        fields: ['patient_id', 'adherence_type', 'due_at']
      }
    ],
    
    // Instance methods
    instanceMethods: {
      // Check if adherence was recorded on time
      isOnTime() {
        if (!this.recorded_at) return false;
        
        const dueTime = new Date(this.due_at);
        const recordedTime = new Date(this.recorded_at);
        const timeDiff = recordedTime.getTime() - dueTime.getTime();
        
        // Consider on-time if recorded within 30 minutes of due time
        return Math.abs(timeDiff) <= 30 * 60 * 1000;
      },
      
      // Get adherence status
      getStatus() {
        if (this.is_completed) return 'completed';
        if (this.is_partial) return 'partial';
        if (this.is_missed) return 'missed';
        return 'pending';
      },
      
      // Mark as completed
      async markCompleted(responseData = {}, notes = null) {
        this.is_completed = true;
        this.is_missed = false;
        this.is_partial = false;
        this.recorded_at = new Date();
        this.response_data = responseData;
        if (notes) this.notes = notes;
        await this.save();
      },
      
      // Mark as missed
      async markMissed(notes = null) {
        this.is_missed = true;
        this.is_completed = false;
        this.is_partial = false;
        if (notes) this.notes = notes;
        await this.save();
      },
      
      // Mark as partial
      async markPartial(responseData = {}, notes = null) {
        this.is_partial = true;
        this.is_completed = false;
        this.is_missed = false;
        this.recorded_at = new Date();
        this.response_data = responseData;
        if (notes) this.notes = notes;
        await this.save();
      }
    },
    
    // Class methods
    classMethods: {
      // Get adherence summary for patient
      async getAdherenceSummary(patientId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const records = await this.findAll({
          where: {
            patient_id: patientId,
            due_at: {
              [sequelize.Sequelize.Op.gte]: startDate
            }
          }
        });
        
        const total = records.length;
        const completed = records.filter(r => r.is_completed).length;
        const missed = records.filter(r => r.is_missed).length;
        const partial = records.filter(r => r.is_partial).length;
        
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
        return this.findAll({
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
      findByTypeAndPatient(patientId, adherenceType) {
        return this.findAll({
          where: {
            patient_id: patientId,
            adherence_type: adherenceType
          },
          order: [['due_at', 'DESC']]
        });
      }
    }
  });
  
  return AdherenceRecord;
};