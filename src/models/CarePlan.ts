// src/models/CarePlan.ts - Long-term care plans for chronic conditions (PostgreSQL)
import crypto from 'crypto';
import { DataTypes } from 'sequelize';
import { PLAN_TYPES, CARE_PLAN_STATUS, PRIORITY_LEVEL } from '../config/enums.js';

export default (sequelize) => {
  const CarePlan = sequelize.define('CarePlan', {
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
    
    // Can be created by doctors or qualified HSPs (NPs, PAs)
    created_by_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      }
    },
    
    created_by_hsp_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hsps',
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
    
    // Basic Information
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Title of the long-term care plan'
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detailed description of the care plan'
    },
    
    plan_type: {
      type: DataTypes.STRING(20),
      defaultValue: PLAN_TYPES.CARE_PLAN,
      validate: {
        isIn: [[PLAN_TYPES.CARE_PLAN]]
      },
      comment: 'Always care_plan for this model'
    },
    
    // Chronic Condition Management
    chronic_conditions: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Chronic conditions being managed (diabetes, hypertension, etc.)'
    },
    
    condition_severity: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Severity levels for each chronic condition'
    },
    
    risk_factors: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Risk factors for condition progression'
    },
    
    // Long-term Goals and Management
    long_term_goals: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Long-term health objectives (6 months to years)'
    },
    
    short_term_milestones: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Short-term milestones toward long-term goals'
    },
    
    interventions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Ongoing interventions and treatments'
    },
    
    lifestyle_modifications: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Diet, exercise, lifestyle changes'
    },
    
    // Monitoring and Tracking
    monitoring_parameters: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Vital signs, lab values to monitor regularly'
    },
    
    monitoring_frequency: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'How often to monitor each parameter'
    },
    
    target_values: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Target values for monitored parameters'
    },
    
    // Medications (long-term)
    medications: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Long-term medications for chronic conditions'
    },
    
    medication_management: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Medication adherence strategies and monitoring'
    },
    
    // Timeline (long-term)
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'May be open-ended for chronic conditions'
    },
    
    review_frequency_months: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 12
      },
      comment: 'How often to review the care plan (in months)'
    },
    
    next_review_date: {
      type: DataTypes.DATE,
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
    
    // Care Team
    primary_care_manager_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Primary care coordinator (can be doctor or HSP)'
    },
    
    care_team_members: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'List of care team members and their roles'
    },
    
    specialist_referrals: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Specialist consultations and referrals'
    },
    
    // Patient Engagement
    patient_education_materials: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Educational resources provided to patient'
    },
    
    self_management_tasks: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Tasks patient needs to perform'
    },
    
    patient_goals: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Goals set by the patient themselves'
    },
    
    // Progress and Outcomes
    progress_notes: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Ongoing progress documentation'
    },
    
    outcome_measures: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Measurable outcomes and improvements'
    },
    
    quality_of_life_scores: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Quality of life assessments over time'
    },
    
    // Emergency Planning
    emergency_action_plan: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'What to do in case of emergency or exacerbation'
    },
    
    warning_signs: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Signs that indicate condition is worsening'
    },
    
    emergency_contacts: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Emergency contacts for this care plan'
    },
    
    // Legacy fields for backward compatibility
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Legacy field for existing data'
    },
    
    channel_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Legacy communication channel ID'
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
    tableName: 'care_plans',
    underscored: true,
    paranoid: true,
    
    indexes: [
      {
        fields: ['patient_id']
      },
      {
        fields: ['created_by_doctor_id']
      },
      {
        fields: ['created_by_hsp_id']
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
        fields: ['next_review_date']
      },
      {
        fields: ['chronic_conditions'],
        using: 'gin'
      },
      {
        fields: ['monitoring_parameters'],
        using: 'gin'
      }
    ],
    
    validate: {
      mustHaveCreator() {
        if (!this.created_by_doctor_id && !this.created_by_hsp_id) {
          throw new Error('Care plan must be created by either a doctor or HSP');
        }
      }
    },
    
    hooks: {
      beforeValidate: (plan, options) => {
        // Auto-generate title if not provided
        if (!plan.title && plan.chronic_conditions.length > 0) {
          plan.title = `Care Plan for ${plan.chronic_conditions.join(', ')}`;
        }
        
        // Set next review date
        if (plan.review_frequency_months && !plan.next_review_date) {
          const nextReview = new Date(plan.start_date);
          nextReview.setMonth(nextReview.getMonth() + plan.review_frequency_months);
          plan.next_review_date = nextReview;
        }
      },
      
      beforeCreate: (plan, options) => {
        // Validate creator has capability to create care plans
        // This would be checked in the service layer
      },
      
      afterUpdate: (plan, options) => {
        // Update next review date if review frequency changed
        if (plan.changed('review_frequency_months')) {
          const nextReview = new Date();
          nextReview.setMonth(nextReview.getMonth() + plan.review_frequency_months);
          plan.next_review_date = nextReview;
        }
      }
    }
  });
  
  // Instance methods
  CarePlan.prototype.isActive = function() {
    return this.status === 'ACTIVE';
  };
  
  CarePlan.prototype.isDueForReview = function() {
    return this.next_review_date && new Date() >= new Date(this.next_review_date);
  };
  
  CarePlan.prototype.getCreator = async function() {
    if (this.created_by_doctor_id) {
      return await sequelize.models.Doctor.findByPk(this.created_by_doctor_id);
    } else if (this.created_by_hsp_id) {
      return await sequelize.models.HSP.findByPk(this.created_by_hsp_id);
    }
    return null;
  };
  
  CarePlan.prototype.addProgressNote = function(note, authorId, authorType) {
    if (!this.progress_notes) this.progress_notes = [];
    this.progress_notes.push({
      id: crypto.randomUUID(),
      note,
      author_id: authorId,
      author_type: authorType, // 'doctor' or 'hsp'
      timestamp: new Date(),
      type: 'progress'
    });
    return this.save();
  };
  
  CarePlan.prototype.updateOutcomeMeasure = function(measure, value) {
    if (!this.outcome_measures) this.outcome_measures = {};
    if (!this.outcome_measures[measure]) this.outcome_measures[measure] = [];
    
    this.outcome_measures[measure].push({
      value,
      date: new Date(),
      id: crypto.randomUUID()
    });
    
    return this.save();
  };
  
  CarePlan.prototype.scheduleNextReview = function() {
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + this.review_frequency_months);
    this.next_review_date = nextReview;
    return this.save();
  };
  
  CarePlan.prototype.getCareTeamMembers = async function() {
    const members = [];
    
    for (const member of this.care_team_members) {
      if (member.type === 'doctor') {
        const doctor = await sequelize.models.Doctor.findByPk(member.id);
        if (doctor) members.push({ ...doctor.toJSON(), role: member.role });
      } else if (member.type === 'hsp') {
        const hsp = await sequelize.models.HSP.findByPk(member.id);
        if (hsp) members.push({ ...hsp.toJSON(), role: member.role });
      }
    }
    
    return members;
  };
  
  return CarePlan;
};
