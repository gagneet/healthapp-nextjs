// lib/healthcare-audit.ts - Comprehensive Healthcare Audit System
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// HIPAA-compliant audit event types
export const AUDIT_EVENTS = {
  // Data Access Events
  PATIENT_VIEWED: 'PATIENT_VIEWED',
  MEDICAL_RECORD_ACCESSED: 'MEDICAL_RECORD_ACCESSED',
  MEDICATION_VIEWED: 'MEDICATION_VIEWED',
  VITAL_SIGNS_ACCESSED: 'VITAL_SIGNS_ACCESSED',
  CARE_PLAN_VIEWED: 'CARE_PLAN_VIEWED',
  
  // Data Modification Events
  PATIENT_CREATED: 'PATIENT_CREATED',
  PATIENT_UPDATED: 'PATIENT_UPDATED',
  MEDICAL_RECORD_CREATED: 'MEDICAL_RECORD_CREATED',
  MEDICAL_RECORD_UPDATED: 'MEDICAL_RECORD_UPDATED',
  MEDICATION_PRESCRIBED: 'MEDICATION_PRESCRIBED',
  MEDICATION_MODIFIED: 'MEDICATION_MODIFIED',
  CARE_PLAN_CREATED: 'CARE_PLAN_CREATED',
  CARE_PLAN_UPDATED: 'CARE_PLAN_UPDATED',
  
  // Security Events
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
  EMERGENCY_ACCESS_GRANTED: 'EMERGENCY_ACCESS_GRANTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Administrative Events
  USER_CREATED: 'USER_CREATED',
  USER_MODIFIED: 'USER_MODIFIED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PROVIDER_RELATIONSHIP_CHANGED: 'PROVIDER_RELATIONSHIP_CHANGED',
  
  // Clinical Workflow Events
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  SECONDARY_DOCTOR_ASSIGNED: 'SECONDARY_DOCTOR_ASSIGNED',
  CONSENT_GRANTED: 'CONSENT_GRANTED',
  CONSENT_REVOKED: 'CONSENT_REVOKED',
  
  // Data Export/Sharing Events
  DATA_EXPORTED: 'DATA_EXPORTED',
  REPORT_GENERATED: 'REPORT_GENERATED',
  PHI_SHARED: 'PHI_SHARED',
  
  // System Events
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_BACKUP: 'DATABASE_BACKUP',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE'
} as const;

// Risk levels for audit events
export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;

// Outcome types
export const AUDIT_OUTCOMES = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  WARNING: 'WARNING',
  ERROR: 'ERROR'
} as const;

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  patientId?: string;
  event_type: keyof typeof AUDIT_EVENTS;
  outcome: keyof typeof AUDIT_OUTCOMES;
  risk_level: keyof typeof RISK_LEVELS;
  description: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  resource_type?: string;
  resource_id?: string;
  before_values?: Record<string, any>;
  after_values?: Record<string, any>;
  timestamp?: Date;
}

export class HealthcareAuditLogger {
  
  /**
   * Create a comprehensive audit log entry
   */
  static async createAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          id: entry.id || randomUUID(),
          userId: entry.userId || null,
          patientId: entry.patientId || null,
          event_type: entry.event_type,
          outcome: entry.outcome,
          risk_level: entry.risk_level,
          description: entry.description,
          details: entry.details || {},
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          session_id: entry.session_id,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          before_values: entry.before_values,
          after_values: entry.after_values,
          timestamp: entry.timestamp || new Date(),
          created_at: new Date()
        }
      });

      // For critical events, trigger immediate alerts
      if (entry.risk_level === RISK_LEVELS.CRITICAL) {
        await this.triggerSecurityAlert(entry);
      }

    } catch (error) {
      // Audit logging should never fail silently
      console.error('Failed to create audit log:', error);
      
      // Try to log the failure itself
      try {
        await prisma.audit_logs.create({
          data: {
            id: randomUUID(),
            event_type: AUDIT_EVENTS.SYSTEM_ERROR,
            outcome: AUDIT_OUTCOMES.ERROR,
            risk_level: RISK_LEVELS.HIGH,
            description: 'Failed to create audit log',
            details: {
              originalEntry: entry,
              error: error instanceof Error ? error.message : 'Unknown error'
            },
            timestamp: new Date(),
            created_at: new Date()
          }
        });
      } catch (secondaryError) {
        console.error('Critical: Unable to log audit failure:', secondaryError);
      }
    }
  }

  /**
   * Log patient data access (HIPAA required)
   */
  static async logPatientAccess(
    userId: string,
    patientId: string,
    accessType: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    
    const eventTypeMap = {
      VIEW: AUDIT_EVENTS.PATIENT_VIEWED,
      CREATE: AUDIT_EVENTS.PATIENT_CREATED,
      UPDATE: AUDIT_EVENTS.PATIENT_UPDATED,
      DELETE: AUDIT_EVENTS.PATIENT_UPDATED // Soft delete
    };

    await this.createAuditLog({
      userId: userId,
      patientId: patientId,
      event_type: eventTypeMap[accessType],
      outcome: AUDIT_OUTCOMES.SUCCESS,
      risk_level: accessType === 'VIEW' ? RISK_LEVELS.LOW : RISK_LEVELS.MEDIUM,
      description: `Patient ${accessType.toLowerCase()} operation`,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      resource_type: 'PATIENT',
      resource_id: patientId
    });
  }

  /**
   * Log medical record access
   */
  static async logMedicalRecordAccess(
    userId: string,
    patientId: string,
    recordId: string,
    recordType: string,
    operation: 'READ' | 'WRITE' | 'UPDATE' | 'DELETE',
    beforeValues?: Record<string, any>,
    afterValues?: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    
    await this.createAuditLog({
      userId: userId,
      patientId: patientId,
      event_type: operation === 'READ' ? AUDIT_EVENTS.MEDICAL_RECORD_ACCESSED : AUDIT_EVENTS.MEDICAL_RECORD_UPDATED,
      outcome: AUDIT_OUTCOMES.SUCCESS,
      risk_level: RISK_LEVELS.MEDIUM,
      description: `Medical record ${operation.toLowerCase()}: ${recordType}`,
      details: {
        recordType,
        operation
      },
      ip_address: ipAddress,
      resource_type: 'MEDICAL_RECORD',
      resource_id: recordId,
      before_values: beforeValues,
      after_values: afterValues
    });
  }

  /**
   * Log medication-related events
   */
  static async logMedicationEvent(
    userId: string,
    patientId: string,
    medicationId: string,
    event: 'PRESCRIBED' | 'MODIFIED' | 'DISCONTINUED' | 'VIEWED',
    medicationDetails: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    
    const eventTypeMap = {
      PRESCRIBED: AUDIT_EVENTS.MEDICATION_PRESCRIBED,
      MODIFIED: AUDIT_EVENTS.MEDICATION_MODIFIED,
      DISCONTINUED: AUDIT_EVENTS.MEDICATION_MODIFIED,
      VIEWED: AUDIT_EVENTS.MEDICATION_VIEWED
    };

    await this.createAuditLog({
      userId: userId,
      patientId: patientId,
      event_type: eventTypeMap[event],
      outcome: AUDIT_OUTCOMES.SUCCESS,
      risk_level: event === 'VIEWED' ? RISK_LEVELS.LOW : RISK_LEVELS.MEDIUM,
      description: `Medication ${event.toLowerCase()}`,
      details: {
        medication: medicationDetails,
        event
      },
      ip_address: ipAddress,
      resource_type: 'MEDICATION',
      resource_id: medicationId
    });
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    userId: string | null,
    event: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    
    const riskLevel = event === 'LOGIN_FAILED' ? RISK_LEVELS.MEDIUM : RISK_LEVELS.LOW;
    const outcome = event === 'LOGIN_FAILED' ? AUDIT_OUTCOMES.FAILURE : AUDIT_OUTCOMES.SUCCESS;

    await this.createAuditLog({
      userId: userId,
      event_type: AUDIT_EVENTS[event],
      outcome,
      risk_level: riskLevel,
      description: `Authentication event: ${event.replace('_', ' ')}`,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      resource_type: 'AUTHENTICATION'
    });
  }

  /**
   * Log unauthorized access attempts
   */
  static async logUnauthorizedAccess(
    userId: string | null,
    attemptedAction: string,
    resourceType: string,
    resourceId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    
    await this.createAuditLog({
      userId: userId,
      event_type: AUDIT_EVENTS.UNAUTHORIZED_ACCESS_ATTEMPT,
      outcome: AUDIT_OUTCOMES.FAILURE,
      risk_level: RISK_LEVELS.HIGH,
      description: `Unauthorized access attempt: ${attemptedAction}`,
      details: {
        attemptedAction,
        resourceType,
        resourceId
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      resource_type: resourceType,
      resource_id: resourceId
    });
  }

  /**
   * Log emergency access events
   */
  static async logEmergencyAccess(
    doctorId: string,
    patientId: string,
    reason: string,
    granted: boolean,
    ipAddress?: string
  ): Promise<void> {
    
    await this.createAuditLog({
      userId: doctorId,
      patientId: patientId,
      event_type: AUDIT_EVENTS.EMERGENCY_ACCESS_GRANTED,
      outcome: granted ? AUDIT_OUTCOMES.SUCCESS : AUDIT_OUTCOMES.FAILURE,
      risk_level: RISK_LEVELS.CRITICAL,
      description: `Emergency access ${granted ? 'granted' : 'denied'}`,
      details: {
        reason,
        granted
      },
      ip_address: ipAddress,
      resource_type: 'EMERGENCY_ACCESS',
      resource_id: patientId
    });
  }

  /**
   * Log data export/sharing events
   */
  static async logDataExport(
    userId: string,
    exportType: string,
    patientIds: string[],
    exportFormat: string,
    reason: string,
    ipAddress?: string
  ): Promise<void> {
    
    await this.createAuditLog({
      userId: userId,
      event_type: AUDIT_EVENTS.DATA_EXPORTED,
      outcome: AUDIT_OUTCOMES.SUCCESS,
      risk_level: RISK_LEVELS.HIGH,
      description: `Data export: ${exportType}`,
      details: {
        exportType,
        exportFormat,
        patientCount: patientIds.length,
        patientIds: patientIds.slice(0, 10), // Log first 10 patient IDs
        reason
      },
      ip_address: ipAddress,
      resource_type: 'DATA_EXPORT'
    });
  }

  /**
   * Log system administrative events
   */
  static async logAdminEvent(
    adminUserId: string,
    event: 'USER_CREATED' | 'USER_MODIFIED' | 'ROLE_CHANGED' | 'USER_DEACTIVATED',
    targetUserId: string,
    changes: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    
    await this.createAuditLog({
      userId: adminUserId,
      event_type: AUDIT_EVENTS[event],
      outcome: AUDIT_OUTCOMES.SUCCESS,
      risk_level: RISK_LEVELS.HIGH,
      description: `Administrative action: ${event.replace('_', ' ')}`,
      details: {
        targetUserId,
        changes
      },
      ip_address: ipAddress,
      resource_type: 'USER_ADMINISTRATION',
      resource_id: targetUserId,
      after_values: changes
    });
  }

  /**
   * Generate compliance reports
   */
  static async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    filters: {
      userId?: string;
      patientId?: string;
      eventTypes?: string[];
      riskLevels?: string[];
    } = {}
  ) {
    const whereClause: any = {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    };

    if (filters.userId) whereClause.userId = filters.userId;
    if (filters.patientId) whereClause.patientId = filters.patientId;
    if (filters.eventTypes?.length) whereClause.event_type = { in: filters.eventTypes };
    if (filters.riskLevels?.length) whereClause.risk_level = { in: filters.riskLevels };

    const [auditLogs, summary] = await Promise.all([
      prisma.audit_logs.findMany({
        where: whereClause,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              first_name: true,
              last_name: true,
              role: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 10000 // Limit for performance
      }),
      prisma.audit_logs.groupBy({
        by: ['event_type', 'outcome', 'risk_level'],
        where: whereClause,
        _count: { id: true }
      })
    ]);

    return {
      period: { startDate, endDate },
      totalEvents: auditLogs.length,
      events: auditLogs,
      summary: summary.reduce((acc, item) => {
        const key = `${item.event_type}_${item.outcome}_${item.risk_level}`;
        acc[key] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      filters
    };
  }

  /**
   * Trigger security alert for critical events
   */
  private static async triggerSecurityAlert(entry: AuditLogEntry): Promise<void> {
    // Implementation would depend on alerting system (email, Slack, PagerDuty, etc.)
    console.warn('CRITICAL SECURITY EVENT:', {
      eventType: entry.event_type,
      userId: entry.userId,
      patientId: entry.patientId,
      description: entry.description,
      timestamp: entry.timestamp
    });

    // Could also create alert records in database
    try {
      await prisma.security_alerts.create({
        data: {
          id: randomUUID(),
          audit_log_id: entry.id,
          alert_type: 'CRITICAL_AUDIT_EVENT',
          severity: 'HIGH',
          title: `Critical audit event: ${entry.event_type}`,
          description: entry.description,
          details: entry.details,
          status: 'OPEN',
          created_at: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }
}