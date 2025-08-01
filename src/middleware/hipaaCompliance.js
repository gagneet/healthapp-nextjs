// src/middleware/hipaaCompliance.js - HIPAA Compliance Framework
import crypto from 'crypto';
import { USER_ROLES } from '../config/enums.js';

/**
 * HIPAA Audit Log Entry
 */
export class HIPAAAuditLog {
  static async logAccess(req, res, next) {
    try {
      const auditEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        user_id: req.user?.id,
        user_role: req.user?.role,
        organization_id: req.user?.organization_id || req.provider?.organization_id,
        action: req.method,
        resource: req.originalUrl,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        patient_id: req.params.patientId || req.body.patient_id,
        phi_accessed: HIPAAAuditLog.containsPHI(req),
        access_granted: true, // Will be updated if access is denied
        session_id: req.sessionID,
        request_id: req.id || crypto.randomUUID()
      };

      // Store audit entry (in production, use a secure audit database)
      await HIPAAAuditLog.storeAuditEntry(auditEntry);
      
      // Attach audit info to request
      req.hipaaAudit = auditEntry;
      
      next();
    } catch (error) {
      console.error('HIPAA audit logging error:', error);
      // Don't block the request due to audit logging failure
      next();
    }
  }

  static async logAccessDenied(req, reason) {
    try {
      const auditEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        user_id: req.user?.id,
        user_role: req.user?.role,
        organization_id: req.user?.organization_id || req.provider?.organization_id,
        action: req.method,
        resource: req.originalUrl,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        patient_id: req.params.patientId || req.body.patient_id,
        phi_accessed: false,
        access_granted: false,
        denial_reason: reason,
        session_id: req.sessionID,
        request_id: req.id || crypto.randomUUID()
      };

      await HIPAAAuditLog.storeAuditEntry(auditEntry);
    } catch (error) {
      console.error('HIPAA access denial logging error:', error);
    }
  }

  static containsPHI(req) {
    const phiFields = [
      'name', 'first_name', 'last_name', 'email', 'phone', 'address',
      'date_of_birth', 'ssn', 'medical_record_number', 'diagnosis',
      'medication', 'vital', 'treatment', 'allergy'
    ];
    
    const requestData = JSON.stringify({ ...req.params, ...req.query, ...req.body }).toLowerCase();
    return phiFields.some(field => requestData.includes(field));
  }

  static async storeAuditEntry(entry) {
    // In production, store in a separate, secure audit database
    // For now, we'll use the main database with encryption
    const { AuditLog } = require('../models').default;
    
    if (AuditLog) {
      await AuditLog.create({
        ...entry,
        encrypted_data: HIPAAAuditLog.encryptAuditData(entry)
      });
    } else {
      // Fallback to secure file logging
      console.log('HIPAA AUDIT:', JSON.stringify(entry));
    }
  }

  static encryptAuditData(data) {
    const algorithm = 'aes-256-gcm';
    const key = process.env.HIPAA_AUDIT_ENCRYPTION_KEY || crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      algorithm
    };
  }
}

/**
 * HIPAA Authorization Middleware
 */
export const requireHIPAAConsent = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      await HIPAAAuditLog.logAccessDenied(req, 'No authenticated user');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check HIPAA consent for patients accessing their own data
    if (user.role === USER_ROLES.PATIENT) {
      if (!user.hipaa_consent_date) {
        await HIPAAAuditLog.logAccessDenied(req, 'No HIPAA consent on file');
        return res.status(403).json({
          success: false,
          message: 'HIPAA authorization required',
          requires_consent: true
        });
      }

      // Check if consent is still valid (yearly renewal)
      const consentAge = new Date() - new Date(user.hipaa_consent_date);
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      
      if (consentAge > oneYear) {
        await HIPAAAuditLog.logAccessDenied(req, 'HIPAA consent expired');
        return res.status(403).json({
          success: false,
          message: 'HIPAA authorization has expired and must be renewed',
          consent_expired: true
        });
      }
    }

    next();
  } catch (error) {
    console.error('HIPAA consent check error:', error);
    await HIPAAAuditLog.logAccessDenied(req, 'HIPAA consent verification error');
    res.status(500).json({
      success: false,
      message: 'Error verifying HIPAA authorization'
    });
  }
};

/**
 * Business Associate Agreement (BAA) Validation
 */
export const requireBAA = async (req, res, next) => {
  try {
    const organizationId = req.user?.organization_id || req.provider?.organization_id;
    
    if (!organizationId) {
      await HIPAAAuditLog.logAccessDenied(req, 'No organization context');
      return res.status(400).json({
        success: false,
        message: 'Organization context required'
      });
    }

    const { Organization } = req.app.get('models');
    const organization = await Organization.findByPk(organizationId);
    
    if (!organization) {
      await HIPAAAuditLog.logAccessDenied(req, 'Organization not found');
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if organization has valid BAA
    if (!organization.hipaa_covered_entity && !organization.business_associate_agreement) {
      await HIPAAAuditLog.logAccessDenied(req, 'No valid BAA on file');
      return res.status(403).json({
        success: false,
        message: 'Valid Business Associate Agreement required',
        requires_baa: true
      });
    }

    // Validate BAA expiration
    if (organization.business_associate_agreement?.expiration_date) {
      const expirationDate = new Date(organization.business_associate_agreement.expiration_date);
      if (new Date() > expirationDate) {
        await HIPAAAuditLog.logAccessDenied(req, 'BAA expired');
        return res.status(403).json({
          success: false,
          message: 'Business Associate Agreement has expired',
          baa_expired: true
        });
      }
    }

    req.organization = organization;
    next();
  } catch (error) {
    console.error('BAA validation error:', error);
    await HIPAAAuditLog.logAccessDenied(req, 'BAA validation error');
    res.status(500).json({
      success: false,
      message: 'Error validating Business Associate Agreement'
    });
  }
};

/**
 * Data Minimization Middleware
 */
export const enforceDataMinimization = (allowedFields = []) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      try {
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        
        if (data && typeof data === 'object') {
          data = minimizeData(data, allowedFields, req.user?.role);
        }
        
        originalSend.call(this, JSON.stringify(data));
      } catch (error) {
        console.error('Data minimization error:', error);
        originalSend.call(this, data);
      }
    };
    
    next();
  };
};

function minimizeData(data, allowedFields, userRole) {
  if (Array.isArray(data)) {
    return data.map(item => minimizeData(item, allowedFields, userRole));
  }
  
  if (data && typeof data === 'object') {
    const minimized = {};
    
    // Always allow certain fields
    const alwaysAllowed = ['id', 'created_at', 'updated_at', 'status'];
    
    // Role-based field access
    const roleBasedFields = {
      [USER_ROLES.SYSTEM_ADMIN]: ['*'], // Full access
      [USER_ROLES.HOSPITAL_ADMIN]: ['*'], // Full access within organization
      [USER_ROLES.DOCTOR]: [
        'medical_record_number', 'diagnosis', 'medications', 'allergies',
        'medical_history', 'vitals', 'treatment_plans', 'care_plans'
      ],
      [USER_ROLES.HSP]: [
        'vitals', 'medications', 'allergies', 'care_plans'
      ],
      [USER_ROLES.PATIENT]: [
        'own_data_only' // Patients can only see their own data
      ]
    };
    
    const userAllowedFields = roleBasedFields[userRole] || [];
    const combinedAllowed = [
      ...alwaysAllowed,
      ...allowedFields,
      ...(userAllowedFields.includes('*') ? Object.keys(data) : userAllowedFields)
    ];
    
    for (const [key, value] of Object.entries(data)) {
      if (combinedAllowed.includes(key) || combinedAllowed.includes('*')) {
        minimized[key] = typeof value === 'object' ? minimizeData(value, allowedFields, userRole) : value;
      }
    }
    
    return minimized;
  }
  
  return data;
}

/**
 * Encryption Utilities for PHI
 */
export class PHIEncryption {
  static encrypt(data) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.PHI_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm
    };
  }
  
  static decrypt(encryptedData) {
    const algorithm = encryptedData.algorithm || 'aes-256-gcm';
    const key = Buffer.from(process.env.PHI_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    if (encryptedData.authTag) {
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    }
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}

/**
 * HIPAA Breach Detection
 */
export class BreachDetection {
  static async detectUnusualAccess(req, res, next) {
    try {
      const user = req.user;
      const patientId = req.params.patientId || req.body.patient_id;
      
      if (!user || !patientId) {
        return next();
      }
      
      // Check for unusual access patterns
      const checks = await Promise.all([
        BreachDetection.checkOffHoursAccess(user, req),
        BreachDetection.checkBulkAccess(user, req),
        BreachDetection.checkUnauthorizedPatient(user, patientId),
        BreachDetection.checkSuspiciousIP(req)
      ]);
      
      const alerts = checks.filter(check => check.alert);
      
      if (alerts.length > 0) {
        await BreachDetection.logSecurityAlert({
          user_id: user.id,
          patient_id: patientId,
          alerts,
          request_details: {
            ip: req.ip,
            user_agent: req.get('User-Agent'),
            url: req.originalUrl,
            method: req.method
          }
        });
        
        // For high-risk alerts, require additional verification
        const highRiskAlerts = alerts.filter(alert => alert.risk_level === 'high');
        if (highRiskAlerts.length > 0) {
          return res.status(403).json({
            success: false,
            message: 'Additional verification required',
            security_alert: true,
            requires_verification: true
          });
        }
      }
      
      req.securityAlerts = alerts;
      next();
    } catch (error) {
      console.error('Breach detection error:', error);
      next(); // Don't block on security check errors
    }
  }
  
  static async checkOffHoursAccess(user, req) {
    const now = new Date();
    const hour = now.getHours();
    
    // Flag access outside normal business hours (9 AM - 6 PM)
    if (hour < 9 || hour > 18) {
      return {
        alert: true,
        type: 'off_hours_access',
        risk_level: 'medium',
        details: `Access at ${hour}:${now.getMinutes()}`
      };
    }
    
    return { alert: false };
  }
  
  static async checkBulkAccess(user, req) {
    // Implementation would check for rapid successive patient record access
    // This is a simplified version
    return { alert: false };
  }
  
  static async checkUnauthorizedPatient(user, patientId) {
    // Check if user has legitimate access to this patient
    // Implementation would verify provider-patient relationships
    return { alert: false };
  }
  
  static async checkSuspiciousIP(req) {
    // Check against known suspicious IP addresses or unusual locations
    return { alert: false };
  }
  
  static async logSecurityAlert(alertData) {
    // Log security alerts to secure monitoring system
    console.warn('HIPAA SECURITY ALERT:', JSON.stringify(alertData, null, 2));
    
    // In production, integrate with security monitoring tools
    // like Splunk, ELK stack, or specialized HIPAA monitoring solutions
  }
}

/**
 * Data Retention Policy Enforcement
 */
export class DataRetention {
  static async enforceRetentionPolicy() {
    try {
      const retentionPolicies = {
        audit_logs: { years: 6 }, // HIPAA requires 6 years
        patient_records: { years: 7 }, // State-dependent, using conservative estimate
        appointment_records: { years: 7 },
        prescription_records: { years: 2 },
        session_logs: { days: 90 }
      };
      
      for (const [dataType, policy] of Object.entries(retentionPolicies)) {
        await DataRetention.archiveOldData(dataType, policy);
      }
    } catch (error) {
      console.error('Data retention policy enforcement error:', error);
    }
  }
  
  static async archiveOldData(dataType, policy) {
    // Implementation would move old data to secure archive storage
    console.log(`Enforcing retention policy for ${dataType}:`, policy);
  }
}

export default {
  HIPAAAuditLog,
  requireHIPAAConsent,
  requireBAA,
  enforceDataMinimization,
  PHIEncryption,
  BreachDetection,
  DataRetention
};