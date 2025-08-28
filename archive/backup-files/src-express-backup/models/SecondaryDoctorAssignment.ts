// src/models/SecondaryDoctorAssignment.js - Secondary Doctor Assignment Model
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const SecondaryDoctorAssignment = sequelize.define('SecondaryDoctorAssignment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Core assignment relationships
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Patient being assigned to secondary doctor'
    },
    
    primary_doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Primary doctor who made this assignment'
    },
    
    secondary_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Secondary doctor being assigned'
    },
    
    secondary_hsp_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hsps',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Secondary HSP being assigned'
    },
    
    // Assignment metadata
    assignment_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for assigning secondary doctor (specialist referral, etc.)'
    },
    
    specialty_focus: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Specific conditions or specialties this assignment covers'
    },
    
    care_plan_ids: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      comment: 'Specific care plans this secondary doctor manages'
    },
    
    // Provider context for access control
    primary_doctor_provider_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'Provider organization of primary doctor'
    },
    
    secondary_doctor_provider_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'Provider organization of secondary doctor'
    },
    
    // Consent and access status
    consent_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether patient consent is required (false for same provider)'
    },
    
    consent_status: {
      type: DataTypes.ENUM('pending', 'requested', 'granted', 'denied', 'expired'),
      defaultValue: 'pending',
      comment: 'Current consent status'
    },
    
    access_granted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether secondary doctor can access patient details'
    },
    
    first_access_attempt_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When secondary doctor first tried to access patient'
    },
    
    access_granted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When access was granted (consent given or automatic)'
    },
    
    // Consent expiry (configurable per assignment)
    consent_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When consent expires (default 6 months, configurable)'
    },
    
    consent_duration_months: {
      type: DataTypes.INTEGER,
      defaultValue: 6,
      comment: 'Consent validity duration in months (configurable per doctor)'
    },
    
    // Assignment status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this assignment is currently active'
    },
    
    assignment_start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'When assignment was created'
    },
    
    assignment_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Optional end date for temporary assignments'
    },
    
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
    
  }, {
    tableName: 'secondary_doctor_assignments',
    underscored: true,
    
    indexes: [
      { fields: ['patientId'] },
      { fields: ['primary_doctor_id'] },
      { fields: ['secondary_doctor_id'] },
      { fields: ['secondary_hsp_id'] },
      { fields: ['consent_status'] },
      { fields: ['access_granted'] },
      { fields: ['is_active'] },
      { fields: ['consent_expires_at'] }
    ],
    
    validate: {
      mustHaveSecondaryProvider() {
        if (!(this as any).secondary_doctor_id && !(this as any).secondary_hsp_id) {
          throw new Error('Assignment must have either secondary_doctor_id or secondary_hsp_id');
        }
      },
      
      validateConsentLogic() {
        // Same provider = no consent required
        if ((this as any).primary_doctor_provider_id && 
            (this as any).secondary_doctor_provider_id &&
            (this as any).primary_doctor_provider_id === (this as any).secondary_doctor_provider_id) {
          (this as any).consent_required = false;
          (this as any).consent_status = 'granted';
          (this as any).access_granted = true;
          
          if (!(this as any).access_granted_at) {
            (this as any).access_granted_at = new Date();
          }
        } else if (!(this as any).primary_doctor_provider_id || !(this as any).secondary_doctor_provider_id) {
          // Different or no provider = consent required
          (this as any).consent_required = true;
          if ((this as any).consent_status === 'pending' && (this as any).access_granted) {
            throw new Error('Cannot grant access without consent for different providers');
          }
        }
      }
    },
    
    hooks: {
      beforeValidate: (assignment: any) => {
        // Set consent expiry if not already set
        if (assignment.consent_status === 'granted' && !assignment.consent_expires_at) {
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + assignment.consent_duration_months);
          assignment.consent_expires_at = expiryDate;
        }
      },
      
      beforeCreate: (assignment: any) => {
        // Auto-determine provider context and consent requirements
        assignment.validateConsentLogic();
      },
      
      beforeUpdate: (assignment: any) => {
        // Re-validate consent logic on updates
        assignment.validateConsentLogic();
      }
    }
  });
  
  // Instance methods
  SecondaryDoctorAssignment.prototype.isSameProvider = function() {
    return this.primary_doctor_provider_id && 
           this.secondary_doctor_provider_id &&
           this.primary_doctor_provider_id === this.secondary_doctor_provider_id;
  };
  
  SecondaryDoctorAssignment.prototype.canAccess = function() {
    if (!this.is_active) return false;
    
    // Check if consent has expired
    if (this.consent_expires_at && new Date() > this.consent_expires_at) {
      this.consent_status = 'expired';
      this.access_granted = false;
      return false;
    }
    
    return this.access_granted;
  };
  
  SecondaryDoctorAssignment.prototype.requiresConsent = function() {
    return this.consent_required && this.consent_status !== 'granted';
  };
  
  SecondaryDoctorAssignment.prototype.grantAccess = function() {
    this.access_granted = true;
    this.access_granted_at = new Date();
    this.consent_status = 'granted';
    
    // Set expiry date
    if (!this.consent_expires_at) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + this.consent_duration_months);
      this.consent_expires_at = expiryDate;
    }
    
    return this.save();
  };
  
  SecondaryDoctorAssignment.prototype.recordAccessAttempt = function() {
    if (!this.first_access_attempt_at) {
      this.first_access_attempt_at = new Date();
      return this.save();
    }
  };
  
  return SecondaryDoctorAssignment;
};