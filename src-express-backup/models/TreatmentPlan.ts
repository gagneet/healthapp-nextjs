// src/models/TreatmentPlan.ts - Short-term, acute treatment plans for outpatient visits
import crypto from 'crypto';
import { DataTypes } from 'sequelize';
import { PLAN_TYPES, CARE_PLAN_STATUS, PRIORITY_LEVEL } from '../config/enums.js';

export default (sequelize: any) => {
  const TreatmentPlan = sequelize.define('TreatmentPlan', {
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
      },
      onDelete: 'CASCADE'
    },
    
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      },
      comment: 'Only doctors can create treatment plans'
    },
    
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    
    // Basic Information
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Brief title of the treatment plan'
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the treatment plan'
    },
    
    plan_type: {
      type: DataTypes.STRING(20),
      defaultValue: PLAN_TYPES.TREATMENT_PLAN,
      validate: {
        isIn: [[PLAN_TYPES.TREATMENT_PLAN]]
      },
      comment: 'Always treatment_plan for this model'
    },
    
    // Medical Context
    primary_diagnosis: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Primary diagnosis being treated'
    },
    
    secondary_diagnoses: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Additional diagnoses'
    },
    
    chief_complaint: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Patient\'s primary complaint'
    },
    
    symptoms: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'List of symptoms being addressed'
    },
    
    // Treatment Details
    treatment_goals: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Short-term treatment objectives'
    },
    
    interventions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Medical interventions and procedures'
    },
    
    medications: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Prescribed medications for this treatment'
    },
    
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Patient instructions and care guidance'
    },
    
    // Timeline
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    expected_duration_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 365
      },
      comment: 'Expected treatment duration in days'
    },
    
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Planned or actual end date'
    },
    
    // Follow-up
    follow_up_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    follow_up_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Scheduled follow-up appointment'
    },
    
    follow_up_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Status and Priority
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [Object.values(CARE_PLAN_STATUS)]
      }
    },
    
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: 'MEDIUM',
      validate: {
        isIn: [Object.values(PRIORITY_LEVEL)]
      }
    },
    
    // Progress Tracking
    progress_notes: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Progress updates and notes'
    },
    
    completion_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    
    outcome: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Treatment outcome and results'
    },
    
    // Emergency Information
    emergency_contacts: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Emergency contacts specific to this treatment'
    },
    
    warning_signs: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Warning signs to watch for'
    },
    
    // Collaboration
    assigned_hsps: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      comment: 'HSPs assigned to assist with this treatment'
    },
    
    care_team_notes: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Notes from care team members'
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
    tableName: 'treatment_plans',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['patient_id']
      },
      {
        fields: ['doctor_id']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['start_date']
      },
      {
        fields: ['end_date']
      },
      {
        fields: ['follow_up_date']
      },
      {
        fields: ['primary_diagnosis']
      },
      {
        fields: ['symptoms'],
        using: 'gin'
      },
      {
        fields: ['secondary_diagnoses'],
        using: 'gin'
      }
    ],
    
    hooks: {
      beforeValidate: (plan: any, options: any) => {
        // Auto-generate title if not provided
        if (!plan.title && plan.primary_diagnosis) {
          plan.title = `Treatment for ${plan.primary_diagnosis}`;
        }
        
        // Calculate end date if duration is provided
        if (plan.expected_duration_days && plan.start_date && !plan.end_date) {
          const endDate = new Date(plan.start_date);
          endDate.setDate(endDate.getDate() + plan.expected_duration_days);
          plan.end_date = endDate;
        }
      },
      
      beforeCreate: (plan: any, options: any) => {
        // Set default follow-up date (1 week from start)
        if (plan.follow_up_required && !plan.follow_up_date) {
          const followUpDate = new Date(plan.start_date);
          followUpDate.setDate(followUpDate.getDate() + 7);
          plan.follow_up_date = followUpDate;
        }
      },
      
      afterUpdate: (plan: any, options: any) => {
        // Auto-complete if end date passed
        if (plan.end_date && new Date() > plan.end_date && plan.status === 'ACTIVE') {
          plan.status = 'COMPLETED';
          plan.completion_percentage = 100;
        }
      }
    }
  });
  
  // Instance methods
  TreatmentPlan.prototype.isActive = function() {
    return this.status === 'ACTIVE';
  };
  
  TreatmentPlan.prototype.isCompleted = function() {
    return this.status === 'COMPLETED';
  };
  
  TreatmentPlan.prototype.isOverdue = function() {
    return this.end_date && new Date() > this.end_date && this.status === 'ACTIVE';
  };
  
  TreatmentPlan.prototype.getDaysRemaining = function() {
    if (!this.end_date) return null;
    const now = new Date();
    const end = new Date(this.end_date);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  TreatmentPlan.prototype.addProgressNote = function(note: any, authorId: any) {
    if (!this.progress_notes) this.progress_notes = [];
    this.progress_notes.push({
      id: crypto.randomUUID(),
      note,
      author_id: authorId,
      timestamp: new Date(),
      type: 'progress'
    });
    return this.save();
  };
  
  TreatmentPlan.prototype.updateProgress = function(percentage: any) {
    this.completion_percentage = Math.min(100, Math.max(0, percentage));
    if (this.completion_percentage === 100) {
      this.status = 'COMPLETED';
    }
    return this.save();
  };
  
  TreatmentPlan.prototype.requiresFollowUp = function() {
    return this.follow_up_required && 
           this.follow_up_date && 
           new Date() >= new Date(this.follow_up_date);
  };
  
  TreatmentPlan.prototype.getAssignedHSPs = async function() {
    if (!this.assigned_hsps.length) return [];
    
    const HSP = sequelize.models.HSP;
    return await HSP.findAll({
      where: {
        id: this.assigned_hsps
      }
    });
  };
  
  return TreatmentPlan;
};