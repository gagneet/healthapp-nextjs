// lib/rbac.ts - Role-Based Access Control for Healthcare Platform
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Healthcare role definitions with hierarchical permissions
export const HEALTHCARE_ROLES = {
  SYSTEM_ADMIN: {
    level: 100,
    description: 'Full system access',
    capabilities: [
      'SYSTEM_MANAGEMENT',
      'USER_MANAGEMENT',
      'PROVIDER_MANAGEMENT',
      'AUDIT_ACCESS',
      'BILLING_MANAGEMENT',
      'GLOBAL_ANALYTICS',
      'SECURITY_MANAGEMENT'
    ]
  },
  HOSPITAL_ADMIN: {
    level: 80,
    description: 'Hospital/Organization administration',
    capabilities: [
      'ORG_USER_MANAGEMENT',
      'DOCTOR_MANAGEMENT',
      'PATIENT_MANAGEMENT',
      'HSP_MANAGEMENT',
      'ORG_ANALYTICS',
      'BILLING_VIEW',
      'COMPLIANCE_MANAGEMENT'
    ]
  },
  DOCTOR: {
    level: 60,
    description: 'Medical doctor with patient care privileges',
    capabilities: [
      'PATIENT_CARE',
      'PRESCRIPTION_MANAGEMENT',
      'CARE_PLAN_MANAGEMENT',
      'APPOINTMENT_MANAGEMENT',
      'MEDICAL_RECORDS_FULL',
      'SECONDARY_DOCTOR_ASSIGNMENT',
      'VITAL_MONITORING',
      'DIAGNOSTIC_ACCESS',
      'TREATMENT_PLANNING',
      'PATIENT_REGISTRATION',
      'SERVICE_MANAGEMENT',
      'SUBSCRIPTION_MANAGEMENT'
    ]
  },
  HSP: {
    level: 40,
    description: 'Health Service Provider with limited medical privileges',
    capabilities: [
      'PATIENT_CARE_LIMITED',
      'APPOINTMENT_MANAGEMENT',
      'VITAL_RECORDING',
      'CARE_PLAN_VIEW',
      'MEDICAL_RECORDS_LIMITED',
      'PATIENT_EDUCATION',
      'WELLNESS_PROGRAMS'
    ]
  },
  PATIENT: {
    level: 20,
    description: 'Patient with access to own health data',
    capabilities: [
      'OWN_HEALTH_DATA',
      'APPOINTMENT_BOOKING',
      'VITAL_SELF_RECORDING',
      'MEDICATION_ADHERENCE',
      'CARE_PLAN_VIEW',
      'PROVIDER_COMMUNICATION',
      'CONSENT_MANAGEMENT'
    ]
  }
} as const;

// Healthcare-specific permissions matrix
export const HEALTHCARE_PERMISSIONS = {
  // Patient Management
  PATIENT_CREATE: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
  PATIENT_VIEW_ALL: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],
  PATIENT_VIEW_ASSIGNED: ['DOCTOR', 'HSP'],
  PATIENT_VIEW_OWN: ['PATIENT'],
  PATIENT_UPDATE: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
  PATIENT_DELETE: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],

  // Medical Records
  MEDICAL_RECORDS_FULL_ACCESS: ['DOCTOR'],
  MEDICAL_RECORDS_LIMITED_ACCESS: ['HSP'],
  MEDICAL_RECORDS_OWN_ACCESS: ['PATIENT'],
  MEDICAL_RECORDS_CREATE: ['DOCTOR', 'HSP'],
  MEDICAL_RECORDS_UPDATE: ['DOCTOR'],

  // Medication Management
  MEDICATION_PRESCRIBE: ['DOCTOR'],
  MEDICATION_VIEW: ['DOCTOR', 'HSP', 'PATIENT'],
  MEDICATION_UPDATE: ['DOCTOR'],
  MEDICATION_ADHERENCE: ['DOCTOR', 'HSP', 'PATIENT'],

  // Care Plans
  CARE_PLAN_CREATE: ['DOCTOR'],
  CARE_PLAN_UPDATE: ['DOCTOR'],
  CARE_PLAN_VIEW: ['DOCTOR', 'HSP', 'PATIENT'],

  // Appointments
  APPOINTMENT_CREATE: ['DOCTOR', 'HSP', 'PATIENT'],
  APPOINTMENT_MANAGE: ['DOCTOR', 'HSP'],
  APPOINTMENT_VIEW_ALL: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],

  // Vitals
  VITAL_RECORD: ['DOCTOR', 'HSP', 'PATIENT'],
  VITAL_VIEW: ['DOCTOR', 'HSP', 'PATIENT'],
  VITAL_ANALYZE: ['DOCTOR', 'HSP'],

  // Secondary Doctor Assignments
  SECONDARY_ASSIGNMENT_CREATE: ['DOCTOR', 'SYSTEM_ADMIN'],
  SECONDARY_ASSIGNMENT_VIEW: ['DOCTOR', 'PATIENT', 'SYSTEM_ADMIN'],
  SECONDARY_ASSIGNMENT_MANAGE: ['DOCTOR', 'SYSTEM_ADMIN'],

  // Administrative Functions
  ADMIN_USER_MANAGEMENT: ['SYSTEM_ADMIN'],
  ADMIN_PROVIDER_MANAGEMENT: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],
  ADMIN_BILLING: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],
  ADMIN_ANALYTICS: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],

  // Search and Discovery
  SEARCH_PATIENTS: ['DOCTOR', 'HSP', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],
  SEARCH_DOCTORS: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'PATIENT'],
  SEARCH_MEDICAL_DATA: ['DOCTOR', 'HSP'],

  // Billing and Subscriptions
  BILLING_VIEW: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
  BILLING_MANAGE: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],
  SUBSCRIPTION_CREATE: ['DOCTOR'],
  SUBSCRIPTION_MANAGE: ['DOCTOR', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],

  // Compliance and Audit
  AUDIT_LOG_ACCESS: ['SYSTEM_ADMIN'],
  COMPLIANCE_VIEW: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],
  HIPAA_ADMIN: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'],

  // Emergency Access
  EMERGENCY_OVERRIDE: ['DOCTOR'],
  CRITICAL_ALERTS: ['DOCTOR', 'HSP', 'SYSTEM_ADMIN']
} as const;

// Patient-Doctor relationship types
export const RELATIONSHIP_TYPES = {
  PRIMARY_CARE: 'primary',
  SPECIALIST_CONSULT: 'specialist',
  SECOND_OPINION: 'second_opinion',
  EMERGENCY_ACCESS: 'emergency',
  TEMPORARY_COVERAGE: 'temporary'
} as const;

// RBAC utility functions
export class HealthcareRBAC {
  
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(userRole: string, permission: keyof typeof HEALTHCARE_PERMISSIONS): boolean {
    const allowedRoles = HEALTHCARE_PERMISSIONS[permission];
    return allowedRoles.includes(userRole as any);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(userRole: string, permissions: (keyof typeof HEALTHCARE_PERMISSIONS)[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(userRole: string, permissions: (keyof typeof HEALTHCARE_PERMISSIONS)[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Get all capabilities for a role
   */
  static getRoleCapabilities(role: keyof typeof HEALTHCARE_ROLES): string[] {
    return HEALTHCARE_ROLES[role]?.capabilities || [];
  }

  /**
   * Check role hierarchy - if user role has higher or equal level
   */
  static hasRoleLevel(userRole: string, requiredLevel: number): boolean {
    const userRoleData = HEALTHCARE_ROLES[userRole as keyof typeof HEALTHCARE_ROLES];
    return userRoleData ? userRoleData.level >= requiredLevel : false;
  }

  /**
   * Validate patient-doctor relationship for data access
   */
  static async validatePatientAccess(
    userId: string, 
    userRole: string, 
    patientId: string,
    relationshipType?: string
  ): Promise<{ hasAccess: boolean; relationship?: any }> {
    
    // System and Hospital admins have full access
    if (['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(userRole)) {
      return { hasAccess: true };
    }

    // Patient accessing own data
    if (userRole === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, userId: userId }
      });
      return { hasAccess: !!patient, relationship: 'self' };
    }

    // Doctor accessing patient data
    if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { userId: userId }
      });

      if (!doctor) return { hasAccess: false };

      // Check primary care relationship
      const primaryRelationship = await prisma.patient.findFirst({
        where: { 
          id: patientId, 
          primary_care_doctor_id: doctor.id 
        }
      });

      if (primaryRelationship) {
        return { hasAccess: true, relationship: 'primary_care' };
      }

      // Check secondary doctor assignments
      const secondaryAssignment = await prisma.secondary_doctor_assignments.findFirst({
        where: {
          patient_id: patientId,
          secondary_doctor_id: doctor.id,
          is_active: true,
          access_granted: true
        }
      });

      if (secondaryAssignment) {
        return { hasAccess: true, relationship: 'secondary_assignment' };
      }

      return { hasAccess: false };
    }

    // HSP accessing patient data
    if (userRole === 'HSP') {
      const hsp = await prisma.hsps.findFirst({
        where: { userId: userId }
      });

      if (!hsp) return { hasAccess: false };

      // Check if HSP has secondary assignment
      const hspAssignment = await prisma.secondary_doctor_assignments.findFirst({
        where: {
          patient_id: patientId,
          secondary_hsp_id: hsp.id,
          is_active: true,
          access_granted: true
        }
      });

      return { hasAccess: !!hspAssignment, relationship: hspAssignment ? 'hsp_assignment' : undefined };
    }

    return { hasAccess: false };
  }

  /**
   * Validate provider access for organizational data
   */
  static async validateProviderAccess(
    userId: string,
    userRole: string,
    providerId: string
  ): Promise<boolean> {
    
    // System admin has access to all providers
    if (userRole === 'SYSTEM_ADMIN') {
      return true;
    }

    // Check if user belongs to the provider organization
    if (userRole === 'HOSPITAL_ADMIN') {
      // Hospital admins should be linked to specific providers
      // This would need provider-admin relationship table
      return true; // Placeholder logic
    }

    if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { 
          userId: userId,
          organization_id: providerId
        }
      });
      return !!doctor;
    }

    if (userRole === 'HSP') {
      const hsp = await prisma.hsps.findFirst({
        where: {
          userId: userId,
          organization_id: providerId
        }
      });
      return !!hsp;
    }

    return false;
  }

  /**
   * Get filtered patient list based on user role and relationships
   */
  static async getAuthorizedPatients(userId: string, userRole: string, additionalFilters: any = {}) {
    let whereClause = { ...additionalFilters };

    if (userRole === 'PATIENT') {
      whereClause.userId = userId;
    } else if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctors.findFirst({
        where: { userId: userId }
      });
      
      if (doctor) {
        // Get patients where user is primary doctor or has secondary assignment
        const secondaryPatients = await prisma.secondary_doctor_assignments.findMany({
          where: {
            secondary_doctor_id: doctor.id,
            is_active: true,
            access_granted: true
          },
          select: { patient_id: true }
        });

        whereClause.OR = [
          { primary_care_doctor_id: doctor.id },
          { id: { in: secondaryPatients.map(sp => sp.patient_id) } }
        ];
      }
    } else if (userRole === 'HSP') {
      const hsp = await prisma.hsps.findFirst({
        where: { userId: userId }
      });
      
      if (hsp) {
        const hspPatients = await prisma.secondary_doctor_assignments.findMany({
          where: {
            secondary_hsp_id: hsp.id,
            is_active: true,
            access_granted: true
          },
          select: { patient_id: true }
        });

        whereClause.id = { in: hspPatients.map(hp => hp.patient_id) };
      }
    }
    // SYSTEM_ADMIN and HOSPITAL_ADMIN can access all patients (no additional filtering)

    return whereClause;
  }

  /**
   * Audit log entry for sensitive operations
   */
  static async createAuditLog(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: any = {},
    ipAddress?: string
  ) {
    try {
      await prisma.audit_logs.create({
        data: {
          userId: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Emergency access override (with mandatory logging)
   */
  static async requestEmergencyAccess(
    userId: string,
    patientId: string,
    reason: string,
    ipAddress?: string
  ): Promise<{ granted: boolean; sessionId?: string }> {
    
    // Only doctors can request emergency access
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'DOCTOR') {
      return { granted: false };
    }

    // Create emergency access record
    const emergencySession = await prisma.emergency_access_logs.create({
      data: {
        requesting_doctor_id: userId,
        patient_id: patientId,
        reason,
        granted_at: new Date(),
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        ip_address: ipAddress,
        is_active: true
      }
    });

    // Create audit log
    await this.createAuditLog(
      userId,
      'EMERGENCY_ACCESS_REQUESTED',
      'PATIENT',
      patientId,
      { reason, emergency_session_id: emergencySession.id },
      ipAddress
    );

    return { granted: true, sessionId: emergencySession.id };
  }
}