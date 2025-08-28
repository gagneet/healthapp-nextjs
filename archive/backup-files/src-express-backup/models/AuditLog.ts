// src/models/AuditLog.js - HIPAA Audit Log Model
import { DataTypes } from 'sequelize';
import { createLogger } from '../middleware/logger.js';

const logger = createLogger(import.meta.url);

export default (sequelize: any) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // Who accessed the data
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who performed the action'
    },
    
    user_role: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Role of the user at time of access'
    },
    
    organization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    
    // What was accessed
    action: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'HTTP method (GET, POST, PUT, DELETE)'
    },
    
    resource: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'URL path of the accessed resource'
    },
    
    patientId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'patients',
        key: 'id'
      },
      comment: 'Patient whose data was accessed'
    },
    
    phi_accessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether PHI (Protected Health Information) was accessed'
    },
    
    // Access control
    access_granted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Whether access was granted or denied'
    },
    
    denial_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for access denial'
    },
    
    // Technical details
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
      comment: 'IP address of the request'
    },
    
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Browser/client user agent'
    },
    
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Session identifier'
    },
    
    request_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Unique request identifier'
    },
    
    // Data changes (for modification audits)
    data_changes: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'What data was changed (before/after values)'
    },
    
    // Security and compliance
    encrypted_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Encrypted sensitive audit information'
    },
    
    risk_level: {
      type: DataTypes.STRING(10),
      defaultValue: 'low',
      validate: {
        isIn: [['low', 'medium', 'high', 'critical']]
      }
    },
    
    security_alerts: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Any security alerts triggered by this access'
    },
    
    // Compliance tracking
    retention_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this audit entry can be archived (HIPAA: 6 years)'
    },
    
    // Timestamps (no soft delete for audit logs)
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the audited action occurred'
    },
    
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
    
  }, {
    tableName: 'audit_logs',
    underscored: true,
    paranoid: false, // Never soft delete audit logs
    timestamps: false, // We manage timestamps manually
    
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['patientId']
      },
      {
        fields: ['organization_id']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['action']
      },
      {
        fields: ['access_granted']
      },
      {
        fields: ['phi_accessed']
      },
      {
        fields: ['risk_level']
      },
      {
        fields: ['ip_address']
      },
      {
        fields: ['session_id']
      },
      {
        fields: ['retention_date']
      },
      {
        // Composite index for common queries
        fields: ['userId', 'timestamp']
      },
      {
        // Index for patient access audits
        fields: ['patientId', 'phi_accessed', 'timestamp']
      },
      {
        // Security monitoring index
        fields: ['risk_level', 'access_granted', 'timestamp']
      }
    ],
    
    hooks: {
      beforeCreate: (auditLog: any, options: any) => {
        // Set retention date (6 years from now for HIPAA compliance)
        const retentionDate = new Date();
        retentionDate.setFullYear(retentionDate.getFullYear() + 6);
        auditLog.retention_date = retentionDate;
        
        // Ensure timestamp is set
        if (!auditLog.timestamp) {
          auditLog.timestamp = new Date();
        }
      }
    }
  });
  
  // Class methods for audit reporting
  AuditLog.findPatientAccess = async function(patientId: any, startDate: any, endDate: any) {
    return await this.findAll({
      where: {
        patientId: patientId,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['timestamp', 'DESC']],
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'role']
        }
      ]
    });
  };
  
  AuditLog.findUserActivity = async function(userId: any, startDate: any, endDate: any) {
    return await this.findAll({
      where: {
        userId: userId,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['timestamp', 'DESC']]
    });
  };
  
  AuditLog.findSecurityAlerts = async function(riskLevel = 'medium') {
    const riskLevels = ['medium', 'high', 'critical'];
    const allowedLevels = riskLevels.slice(riskLevels.indexOf(riskLevel));
    
    return await this.findAll({
      where: {
        risk_level: {
          [sequelize.Sequelize.Op.in]: allowedLevels
        },
        timestamp: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      order: [['timestamp', 'DESC']]
    });
  };
  
  AuditLog.findFailedAccess = async function(organizationId = null) {
    const where = {
      access_granted: false,
      timestamp: {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    };
    
    if (organizationId) {
      (where as any).organization_id = organizationId;
    }
    
    return await this.findAll({
      where,
      order: [['timestamp', 'DESC']]
    });
  };
  
  AuditLog.generateComplianceReport = async function(organizationId: any, startDate: any, endDate: any) {
    const where = {
      timestamp: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    if (organizationId) {
      (where as any).organization_id = organizationId;
    }
    
    const [totalAccess, phiAccess, failedAccess, uniqueUsers, uniquePatients] = await Promise.all([
      this.count({ where }),
      this.count({ where: { ...where, phi_accessed: true } }),
      this.count({ where: { ...where, access_granted: false } }),
      this.count({
        where,
        distinct: true,
        col: 'userId'
      }),
      this.count({
        where: { ...where, patientId: { [sequelize.Sequelize.Op.ne]: null } },
        distinct: true,
        col: 'patientId'
      })
    ]);
    
    return {
      period: { start: startDate, end: endDate },
      organization_id: organizationId,
      metrics: {
        total_access_attempts: totalAccess,
        phi_access_count: phiAccess,
        failed_access_attempts: failedAccess,
        unique_users: uniqueUsers,
        unique_patients_accessed: uniquePatients,
        success_rate: ((totalAccess - failedAccess) / totalAccess * 100).toFixed(2) + '%'
      },
      generated_at: new Date()
    };
  };
  
  // Instance methods
  AuditLog.prototype.isRetentionExpired = function() {
    return this.retention_date && new Date() > this.retention_date;
  };
  
  AuditLog.prototype.getDecryptedData = async function() {
    if (!this.encrypted_data) return null;
    
    try {
      const { PHIEncryption } = await import('../middleware/hipaaCompliance.js');
      return PHIEncryption.decrypt(this.encrypted_data);
    } catch (error) {
      logger.error('Error decrypting audit data:', error);
      return null;
    }
  };
  
  return AuditLog;
};