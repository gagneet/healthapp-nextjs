// src/models/AdherenceLog.js - Track medication adherence and care plan compliance
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const AdherenceLog = sequelize.define('AdherenceLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Patient and Organization
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
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
    
    // Type of adherence being tracked
    adherence_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [[
          'medication',
          'appointment',
          'vital_check',
          'care_plan_task',
          'treatment_plan_task',
          'lab_test',
          'symptom_log',
          'diet_log',
          'exercise',
          'education_module'
        ]]
      }
    },
    
    // Related Records
    related_medication_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'medications',
        key: 'id'
      }
    },
    
    related_appointment_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id'
      }
    },
    
    related_care_plan_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'care_plans',
        key: 'id'
      }
    },
    
    related_treatment_plan_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'treatment_plans',
        key: 'id'
      }
    },
    
    // Timing Information
    scheduled_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When the task/medication was scheduled'
    },
    
    actual_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the task was actually completed (null if missed)'
    },
    
    // Adherence Status
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['completed', 'missed', 'partial', 'delayed', 'rescheduled', 'cancelled']]
      }
    },
    
    completion_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Percentage of task completed (for partial completions)'
    },
    
    // Delay Analysis
    delay_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Minutes late/early (negative for early, positive for late)'
    },
    
    // Medication-Specific Fields
    prescribed_dose: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: 'Prescribed medication dose'
    },
    
    actual_dose: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: 'Actual dose taken'
    },
    
    dose_unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Unit of measurement (mg, ml, tablets, etc.)'
    },
    
    // Patient-Reported Information
    patient_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Patient notes about this adherence event'
    },
    
    side_effects_reported: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Any side effects reported by patient'
    },
    
    symptoms_before: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Symptoms before taking medication/completing task'
    },
    
    symptoms_after: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Symptoms after taking medication/completing task'
    },
    
    // Reason for Non-Adherence
    missed_reason: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [[
          'forgot',
          'side_effects',
          'cost_concerns',
          'feeling_better',
          'feeling_worse',
          'inconvenient_timing',
          'lack_of_understanding',
          'medication_unavailable',
          'travel',
          'emergency',
          'other'
        ]]
      }
    },
    
    missed_reason_details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional details about why missed'
    },
    
    // Data Source
    recorded_by: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'patient',
      validate: {
        isIn: [['patient', 'caregiver', 'provider', 'system', 'device']]
      }
    },
    
    recorded_by_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Device/Technology Integration
    device_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Medical device that recorded this data'
    },
    
    verification_method: {
      type: DataTypes.STRING(30),
      allowNull: true,
      validate: {
        isIn: [['self_report', 'caregiver_report', 'pill_count', 'smart_bottle', 'pharmacy_refill', 'blood_level', 'device_sync']]
      }
    },
    
    // Mood and Context
    mood_before: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10
      },
      comment: 'Patient mood before (1-10 scale)'
    },
    
    mood_after: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10
      },
      comment: 'Patient mood after (1-10 scale)'
    },
    
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Where the adherence event occurred'
    },
    
    // Reminders and Interventions
    reminder_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether a reminder was sent for this event'
    },
    
    reminder_acknowledged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    intervention_triggered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this event triggered an intervention'
    },
    
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional context-specific data'
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
    tableName: 'adherence_logs',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['patient_id']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['adherence_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['scheduled_datetime']
      },
      {
        fields: ['actual_datetime']
      },
      {
        fields: ['related_medication_id']
      },
      {
        fields: ['related_care_plan_id']
      },
      {
        // Composite index for patient adherence analysis
        fields: ['patient_id', 'adherence_type', 'scheduled_datetime']
      },
      {
        // Composite index for medication adherence
        fields: ['related_medication_id', 'status', 'scheduled_datetime']
      },
      {
        // Index for adherence rate calculations
        fields: ['patient_id', 'status', 'created_at']
      }
    ],
    
    hooks: {
      beforeCreate: (log: any, options: any) => {
        // Calculate delay if both scheduled and actual times are present
        if (log.scheduled_datetime && log.actual_datetime) {
          const scheduledTime = new Date(log.scheduled_datetime);
          const actualTime = new Date(log.actual_datetime);
          log.delay_minutes = Math.round((actualTime - scheduledTime) / (1000 * 60));
        }
        
        // Set completion percentage based on status
        if (log.status === 'completed') {
          log.completion_percentage = log.completion_percentage || 100;
        } else if (log.status === 'missed') {
          log.completion_percentage = 0;
        }
      },
      
      beforeUpdate: (log: any, options: any) => {
        // Recalculate delay if times changed
        if (log.changed('scheduled_datetime') || log.changed('actual_datetime')) {
          if (log.scheduled_datetime && log.actual_datetime) {
            const scheduledTime = new Date(log.scheduled_datetime);
            const actualTime = new Date(log.actual_datetime);
            log.delay_minutes = Math.round((actualTime - scheduledTime) / (1000 * 60));
          }
        }
      }
    }
  });
  
  // Class methods
  AdherenceLog.calculateMedicationAdherence = async function(patientId: any, medicationId: any, startDate: any, endDate: any) {
    const logs = await this.findAll({
      where: {
        patient_id: patientId,
        related_medication_id: medicationId,
        adherence_type: 'medication',
        scheduled_datetime: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });
    
    const totalScheduled = logs.length;
    const completed = logs.filter((log: any) => log.status === 'completed').length;
    const partial = logs.filter((log: any) => log.status === 'partial');
    
    let adherencePercentage = 0;
    if (totalScheduled > 0) {
      const partialCompliance = partial.reduce((sum: any, log: any) => sum + (log.completion_percentage / 100), 0);
      adherencePercentage = ((completed + partialCompliance) / totalScheduled) * 100;
    }
    
    return {
      total_scheduled: totalScheduled,
      completed: completed,
      missed: logs.filter((log: any) => log.status === 'missed').length,
      partial: partial.length,
      adherence_percentage: Math.round(adherencePercentage * 100) / 100,
      period: { start: startDate, end: endDate }
    };
  };
  
  AdherenceLog.getPatientAdherenceProfile = async function(patientId: any, days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const logs = await this.findAll({
      where: {
        patient_id: patientId,
        scheduled_datetime: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['scheduled_datetime', 'DESC']]
    });
    
    const profile = {
      total_events: logs.length,
      by_type: {},
      by_status: {},
      average_delay: 0,
      common_missed_reasons: {},
      adherence_trend: []
    };
    
    // Group by type and status
    logs.forEach((log: any) => {
      (profile as any).by_type[log.adherence_type] = ((profile as any).by_type[log.adherence_type] || 0) + 1;
      (profile as any).by_status[log.status] = ((profile as any).by_status[log.status] || 0) + 1;
      
      if (log.missed_reason) {
        (profile as any).common_missed_reasons[log.missed_reason] = ((profile as any).common_missed_reasons[log.missed_reason] || 0) + 1;
      }
    });
    
    // Calculate average delay
    const delayLogs = logs.filter((log: any) => log.delay_minutes !== null);
    if (delayLogs.length > 0) {
      profile.average_delay = delayLogs.reduce((sum: any, log: any) => sum + log.delay_minutes, 0) / delayLogs.length;
    }
    
    return profile;
  };
  
  AdherenceLog.findPatternsOfNonAdherence = async function(patientId: any, medicationId = null) {
    const where = {
      patient_id: patientId,
      status: 'missed',
      scheduled_datetime: {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      }
    };
    
    if (medicationId) {
      (where as any).related_medication_id = medicationId;
    }
    
    const missedLogs = await this.findAll({
      where,
      order: [['scheduled_datetime', 'ASC']]
    });
    
    // Analyze patterns
    const patterns = {
      time_of_day: {},
      day_of_week: {},
      reasons: {},
      consecutive_misses: 0,
      longest_streak: 0
    };
    
    let currentStreak = 0;
    let maxStreak = 0;
    
    missedLogs.forEach((log: any, index: any) => {
      const scheduledTime = new Date(log.scheduled_datetime);
      const hour = scheduledTime.getHours();
      const dayOfWeek = scheduledTime.getDay();
      
      (patterns as any).time_of_day[hour] = ((patterns as any).time_of_day[hour] || 0) + 1;
      (patterns as any).day_of_week[dayOfWeek] = ((patterns as any).day_of_week[dayOfWeek] || 0) + 1;
      
      if (log.missed_reason) {
        (patterns as any).reasons[log.missed_reason] = ((patterns as any).reasons[log.missed_reason] || 0) + 1;
      }
      
      // Check for consecutive misses
      if (index > 0) {
        const prevTime = new Date(missedLogs[index - 1].scheduled_datetime);
        const timeDiff = scheduledTime - prevTime;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff <= 48) { // Within 48 hours = consecutive
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
    });
    
    patterns.longest_streak = Math.max(maxStreak, currentStreak);
    patterns.consecutive_misses = currentStreak;
    
    return patterns;
  };
  
  // Instance methods
  AdherenceLog.prototype.isOnTime = function(toleranceMinutes = 30) {
    return this.delay_minutes !== null && Math.abs(this.delay_minutes) <= toleranceMinutes;
  };
  
  AdherenceLog.prototype.isLate = function() {
    return this.delay_minutes !== null && this.delay_minutes > 0;
  };
  
  AdherenceLog.prototype.isEarly = function() {
    return this.delay_minutes !== null && this.delay_minutes < 0;
  };
  
  AdherenceLog.prototype.getAdherenceScore = function() {
    switch (this.status) {
      case 'completed':
        return this.isOnTime() ? 100 : 80;
      case 'partial':
        return this.completion_percentage * 0.8; // Reduce score for partial completion
      case 'delayed':
        return 60;
      case 'missed':
        return 0;
      default:
        return 0;
    }
  };
  
  return AdherenceLog;
};