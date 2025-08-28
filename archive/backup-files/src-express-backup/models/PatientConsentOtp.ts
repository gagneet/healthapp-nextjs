// src/models/PatientConsentOtp.js - Patient Consent OTP Model
import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default (sequelize: any) => {
  const PatientConsentOtp = sequelize.define('PatientConsentOtp', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Core relationships - linking to secondary assignment
    secondary_assignment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'secondary_doctor_assignments',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Secondary doctor assignment this OTP is for'
    },
    
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Patient giving consent'
    },
    
    primary_doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Primary doctor who assigned secondary doctor'
    },
    
    secondary_doctor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Secondary doctor requesting access'
    },
    
    secondary_hsp_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hsps',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Secondary HSP requesting access'
    },
    
    // OTP details
    otp_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: '6-digit OTP code sent to patient'
    },
    
    otp_method: {
      type: DataTypes.ENUM('sms', 'email', 'both'),
      defaultValue: 'both',
      comment: 'Method used to send OTP'
    },
    
    // Patient contact info at time of OTP generation
    patient_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Patient phone number OTP was sent to'
    },
    
    patient_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Patient email OTP was sent to'
    },
    
    // OTP lifecycle
    generated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'When OTP was generated'
    },
    
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When OTP expires (default 30 minutes)'
    },
    
    attempts_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of verification attempts'
    },
    
    max_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: 'Maximum allowed verification attempts'
    },
    
    // Verification status
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether OTP has been successfully verified'
    },
    
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When OTP was successfully verified'
    },
    
    is_expired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether OTP has expired'
    },
    
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether OTP is blocked due to max attempts'
    },
    
    blocked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When OTP was blocked'
    },
    
    // Request context
    requested_by_userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'User who triggered the OTP request'
    },
    
    request_ip_address: {
      type: DataTypes.INET,
      allowNull: true,
      comment: 'IP address of the request'
    },
    
    request_user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent of the request'
    },
    
    // SMS/Email delivery tracking
    sms_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether SMS was successfully sent'
    },
    
    sms_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When SMS was sent'
    },
    
    sms_error: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'SMS sending error if any'
    },
    
    email_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether email was successfully sent'
    },
    
    email_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When email was sent'
    },
    
    email_error: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Email sending error if any'
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
    tableName: 'patient_consent_otp',
    underscored: true,
    
    indexes: [
      { fields: ['secondary_assignment_id'] },
      { fields: ['patient_id'] },
      { fields: ['otp_code'] },
      { fields: ['expires_at'] },
      { fields: ['is_verified'] },
      { fields: ['is_expired'] },
      { fields: ['is_blocked'] },
      { fields: ['generated_at'] },
      { fields: ['requested_by_userId'] }
    ],
    
    validate: {
      mustHaveSecondaryProvider() {
        if (!(this as any).secondary_doctor_id && !(this as any).secondary_hsp_id) {
          throw new Error('OTP must be for either secondary_doctor_id or secondary_hsp_id');
        }
      },
      
      validateOtpCode() {
        if (!/^[0-9]{6}$/.test((this as any).otp_code)) {
          throw new Error('OTP code must be exactly 6 digits');
        }
      },
      
      validateExpiry() {
        if ((this as any).expires_at <= (this as any).generated_at) {
          throw new Error('OTP expiry time must be after generation time');
        }
      },
      
      validateMaxAttempts() {
        if ((this as any).max_attempts < 1 || (this as any).max_attempts > 10) {
          throw new Error('Max attempts must be between 1 and 10');
        }
      }
    },
    
    hooks: {
      beforeCreate: (otp: any) => {
        // Generate 6-digit OTP if not provided
        if (!otp.otp_code) {
          otp.otp_code = Math.floor(100000 + Math.random() * 900000).toString();
        }
        
        // Set expiry to 30 minutes if not provided
        if (!otp.expires_at) {
          otp.expires_at = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
      },
      
      beforeUpdate: (otp: any) => {
        // Check if OTP should be expired
        if (!otp.is_expired && new Date() > otp.expires_at) {
          otp.is_expired = true;
        }
        
        // Check if OTP should be blocked
        if (otp.attempts_count >= otp.max_attempts && !otp.is_blocked) {
          otp.is_blocked = true;
          otp.blocked_at = new Date();
        }
      }
    }
  });
  
  // Static methods
  PatientConsentOtp.generateSecureOtp = function() {
    // Generate cryptographically secure 6-digit OTP
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt32BE(0);
    return String(num % 900000 + 100000).padStart(6, '0');
  };
  
  PatientConsentOtp.findActiveByAssignment = function(assignmentId: any) {
    return this.findOne({
      where: {
        secondary_assignment_id: assignmentId,
        is_verified: false,
        is_expired: false,
        is_blocked: false
      },
      order: [['generated_at', 'DESC']]
    });
  };
  
  // Instance methods
  PatientConsentOtp.prototype.isExpired = function() {
    return this.is_expired || (new Date() > this.expires_at);
  };
  
  PatientConsentOtp.prototype.isBlocked = function() {
    return this.is_blocked || (this.attempts_count >= this.max_attempts);
  };
  
  PatientConsentOtp.prototype.canVerify = function() {
    return !this.is_verified && !this.isExpired() && !this.isBlocked();
  };
  
  PatientConsentOtp.prototype.verify = function(providedOtp: any) {
    // Check if verification is possible
    if (!this.canVerify()) {
      return {
        success: false,
        error: this.isExpired() ? 'OTP_EXPIRED' : 
               this.isBlocked() ? 'OTP_BLOCKED' : 
               this.is_verified ? 'OTP_ALREADY_VERIFIED' : 'OTP_INVALID_STATE'
      };
    }
    
    // Increment attempt count
    this.attempts_count += 1;
    
    // Check OTP match
    if (this.otp_code === providedOtp) {
      this.is_verified = true;
      this.verified_at = new Date();
      
      return {
        success: true,
        verified_at: this.verified_at
      };
    } else {
      // Check if should be blocked after this attempt
      if (this.attempts_count >= this.max_attempts) {
        this.is_blocked = true;
        this.blocked_at = new Date();
      }
      
      return {
        success: false,
        error: 'OTP_INCORRECT',
        attempts_remaining: Math.max(0, this.max_attempts - this.attempts_count)
      };
    }
  };
  
  PatientConsentOtp.prototype.markAsSent = function(method: any, success: any, error = null) {
    const timestamp = new Date();
    
    if (method === 'sms' || method === 'both') {
      this.sms_sent = success;
      this.sms_sent_at = success ? timestamp : null;
      if (error) this.sms_error = error;
    }
    
    if (method === 'email' || method === 'both') {
      this.email_sent = success;
      this.email_sent_at = success ? timestamp : null;
      if (error) this.email_error = error;
    }
    
    return this.save();
  };
  
  PatientConsentOtp.prototype.getRemainingTime = function() {
    if (this.isExpired()) return 0;
    
    const now = new Date();
    const remaining = this.expires_at.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
  };
  
  return PatientConsentOtp;
};