// src/models/PatientDoctorAssignment.js - Managing Doctor-Patient Relationships
import { DataTypes } from 'sequelize';

export default (sequelize: any) => {
  const PatientDoctorAssignment = sequelize.define('PatientDoctorAssignment', {
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
      },
      onDelete: 'CASCADE'
    },
    
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    
    // Assignment type determines permissions and responsibilities
    assignment_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['primary', 'specialist', 'substitute', 'transferred']]
      },
      comment: 'Primary: Original doctor, Specialist: For specific care plans, Substitute: Same provider coverage, Transferred: Full transfer with consent'
    },
    
    // Permissions based on assignment type
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {
        can_view_patient: true,
        can_create_care_plans: false,
        can_modify_care_plans: false,
        can_prescribe: false,
        can_order_tests: false,
        can_access_full_history: false
      },
      comment: 'Granular permissions for this doctor-patient relationship'
    },
    
    // For specialist assignments - specific to care plans or conditions
    specialty_focus: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Specific specialties/conditions this assignment covers'
    },
    
    care_plan_ids: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      comment: 'Specific care plans this doctor is responsible for'
    },
    
    // Assignment metadata
    assigned_by_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      },
      comment: 'Doctor who made this assignment'
    },
    
    assigned_by_admin_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Provider admin who made this assignment'
    },
    
    // For transfers - consent tracking
    patient_consent_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether patient consent is required for this assignment'
    },
    
    patient_consent_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'not_required',
      validate: {
        isIn: [['not_required', 'pending', 'granted', 'denied', 'expired']]
      }
    },
    
    consent_method: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['sms_otp', 'email_otp', 'in_person', 'phone_call']]
      }
    },
    
    consent_otp: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'OTP for consent verification'
    },
    
    consent_otp_expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    consent_granted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Assignment validity
    assignment_start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    assignment_end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Optional end date for temporary assignments'
    },
    
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // Notes and reason for assignment
    assignment_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for this doctor assignment'
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Provider/Organization context
    requires_same_organization: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this assignment requires doctors to be in same organization'
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
    tableName: 'patientDoctorAssignments',
    underscored: true,
    
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['doctorId']
      },
      {
        fields: ['assignment_type']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['patient_consent_status']
      },
      {
        unique: true,
        fields: ['patientId', 'assignment_type'],
        where: {
          assignment_type: 'primary',
          isActive: true
        },
        name: 'unique_primary_doctor_per_patient'
      }
    ],
    
    validate: {
      validateConsentRequirements() {
        if ((this as any).assignment_type === 'transferred' && !(this as any).patient_consent_required) {
          throw new Error('Transferred assignments must require patient consent');
        }
        
        if ((this as any).patient_consent_required && (this as any).patient_consent_status === 'pending' && !(this as any).consent_otp) {
          throw new Error('Pending consent assignments must have OTP');
        }
      },
      
      validatePermissions() {
        const type = (this as any).assignment_type;
        const perms = (this as any).permissions;
        
        // Set default permissions based on assignment type
        if (type === 'primary') {
          // Primary doctors have full access
          Object.assign(perms, {
            can_view_patient: true,
            can_create_care_plans: true,
            can_modify_care_plans: true,
            can_prescribe: true,
            can_order_tests: true,
            can_access_full_history: true
          });
        } else if (type === 'specialist') {
          // Specialists can create care plans for their specialty
          Object.assign(perms, {
            can_view_patient: true,
            can_create_care_plans: true,
            can_modify_care_plans: true,
            can_prescribe: true,
            can_order_tests: true,
            can_access_full_history: true
          });
        } else if (type === 'substitute') {
          // Substitutes can view but not create new care plans
          Object.assign(perms, {
            can_view_patient: true,
            can_create_care_plans: false,
            can_modify_care_plans: true,
            can_prescribe: true,
            can_order_tests: true,
            can_access_full_history: true
          });
        } else if (type === 'transferred') {
          // Transferred doctors have full access after consent
          if ((this as any).patient_consent_status === 'granted') {
            Object.assign(perms, {
              can_view_patient: true,
              can_create_care_plans: true,
              can_modify_care_plans: true,
              can_prescribe: true,
              can_order_tests: true,
              can_access_full_history: true
            });
          } else {
            Object.assign(perms, {
              can_view_patient: false,
              can_create_care_plans: false,
              can_modify_care_plans: false,
              can_prescribe: false,
              can_order_tests: false,
              can_access_full_history: false
            });
          }
        }
      }
    },
    
    hooks: {
      beforeValidate: (assignment: any) => {
        assignment.validatePermissions();
      },
      
      beforeCreate: (assignment: any) => {
        // Generate OTP if consent is required
        if (assignment.patient_consent_required && assignment.patient_consent_status === 'pending') {
          assignment.consent_otp = Math.floor(100000 + Math.random() * 900000).toString();
          assignment.consent_otp_expires_at = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
      }
    }
  });
  
  // Instance methods
  PatientDoctorAssignment.prototype.isPrimaryDoctor = function() {
    return this.assignment_type === 'primary';
  };
  
  PatientDoctorAssignment.prototype.canCreateCarePlans = function() {
    return this.isActive && this.permissions.can_create_care_plans;
  };
  
  PatientDoctorAssignment.prototype.canAccessPatient = function() {
    if (!this.isActive) return false;
    
    if (this.assignment_type === 'transferred') {
      return this.patient_consent_status === 'granted';
    }
    
    return this.permissions.can_view_patient;
  };
  
  PatientDoctorAssignment.prototype.generateConsentOTP = function() {
    this.consent_otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.consent_otp_expires_at = new Date(Date.now() + 30 * 60 * 1000);
    this.patient_consent_status = 'pending';
    return this.save();
  };
  
  PatientDoctorAssignment.prototype.verifyConsentOTP = function(providedOTP: any) {
    if (!this.consent_otp || !this.consent_otp_expires_at) {
      return false;
    }
    
    if (new Date() > this.consent_otp_expires_at) {
      this.patient_consent_status = 'expired';
      return false;
    }
    
    if (this.consent_otp === providedOTP) {
      this.patient_consent_status = 'granted';
      this.consent_granted_at = new Date();
      this.consent_otp = null;
      this.consent_otp_expires_at = null;
      this.save();
      return true;
    }
    
    return false;
  };
  
  return PatientDoctorAssignment;
};