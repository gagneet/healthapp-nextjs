// src/models/ScheduledEvent.js
import { DataTypes } from 'sequelize';
import { EVENT_TYPES, EVENT_STATUS, PRIORITY_LEVELS } from '../config/enums.js';

export default (sequelize) => {
  const ScheduledEvent = sequelize.define('ScheduledEvent', {
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
    
    // Event details
    event_type: {
      type: DataTypes.ENUM,
      values: Object.values(EVENT_TYPES),
      allowNull: false,
    },
    
    event_id: {
      type: DataTypes.UUID, // Reference to specific medication, vital requirement, etc.
      allowNull: true,
    },
    
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    // Scheduling
    scheduled_for: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC',
    },
    
    // Status and priority
    status: {
      type: DataTypes.ENUM,
      values: Object.values(EVENT_STATUS),
      defaultValue: EVENT_STATUS.SCHEDULED,
    },
    
    priority: {
      type: DataTypes.ENUM,
      values: Object.values(PRIORITY_LEVELS),
      defaultValue: PRIORITY_LEVELS.MEDIUM,
    },
    
    // Event data
    event_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    
    // Completion tracking
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    completed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
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
    },
    
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
    
  }, {
    tableName: 'scheduled_events',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['patient_id'],
        where: { deleted_at: null }
      },
      {
        fields: ['care_plan_id']
      },
      {
        fields: ['scheduled_for'],
        where: { deleted_at: null }
      },
      {
        fields: ['status'],
        where: { deleted_at: null }
      },
      {
        fields: ['event_type'],
        where: { deleted_at: null }
      },
      {
        fields: ['priority'],
        where: { deleted_at: null }
      },
      {
        fields: ['patient_id', 'scheduled_for'],
        where: { deleted_at: null }
      }
    ],
    
    // Instance methods
    instanceMethods: {
      // Check if event is due
      isDue() {
        return new Date() >= new Date(this.scheduled_for);
      },
      
      // Check if event is overdue
      isOverdue() {
        return new Date() > new Date(this.scheduled_for) && 
               ![EVENT_STATUS.COMPLETED, EVENT_STATUS.CANCELLED].includes(this.status);
      },
      
      // Mark as completed
      async markCompleted(completedBy = null) {
        this.status = EVENT_STATUS.COMPLETED;
        this.completed_at = new Date();
        if (completedBy) {
          this.completed_by = completedBy;
        }
        await this.save();
      },
      
      // Mark as missed
      async markMissed() {
        this.status = EVENT_STATUS.MISSED;
        await this.save();
      },
      
      // Cancel event
      async cancel() {
        this.status = EVENT_STATUS.CANCELLED;
        await this.save();
      },
      
      // Check if high priority
      isHighPriority() {
        return [PRIORITY_LEVELS.HIGH, PRIORITY_LEVELS.CRITICAL].includes(this.priority);
      }
    },
    
    // Class methods
    classMethods: {
      // Find upcoming events for patient
      findUpcomingForPatient(patientId, hours = 24) {
        const now = new Date();
        const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
        
        return this.findAll({
          where: {
            patient_id: patientId,
            scheduled_for: {
              [sequelize.Sequelize.Op.between]: [now, endTime]
            },
            status: {
              [sequelize.Sequelize.Op.in]: [EVENT_STATUS.SCHEDULED, EVENT_STATUS.PENDING]
            },
            deleted_at: null
          },
          order: [['scheduled_for', 'ASC']]
        });
      },
      
      // Find overdue events
      findOverdue() {
        return this.findAll({
          where: {
            scheduled_for: {
              [sequelize.Sequelize.Op.lt]: new Date()
            },
            status: {
              [sequelize.Sequelize.Op.notIn]: [EVENT_STATUS.COMPLETED, EVENT_STATUS.CANCELLED, EVENT_STATUS.MISSED]
            },
            deleted_at: null
          }
        });
      },
      
      // Find events by type
      findByType(eventType) {
        return this.findAll({
          where: {
            event_type: eventType,
            deleted_at: null
          }
        });
      },
      
      // Find high priority events
      findHighPriority() {
        return this.findAll({
          where: {
            priority: {
              [sequelize.Sequelize.Op.in]: [PRIORITY_LEVELS.HIGH, PRIORITY_LEVELS.CRITICAL]
            },
            status: {
              [sequelize.Sequelize.Op.in]: [EVENT_STATUS.SCHEDULED, EVENT_STATUS.PENDING]
            },
            deleted_at: null
          }
        });
      }
    }
  });
  
  return ScheduledEvent;
};