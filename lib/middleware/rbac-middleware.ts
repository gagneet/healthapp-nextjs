// lib/middleware/rbac-middleware.ts - RBAC Middleware for API Routes
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { HealthcareRBAC, HEALTHCARE_PERMISSIONS } from '@/lib/rbac';
import { Session } from 'next-auth';

// RBAC configuration for different API endpoints
export const API_PERMISSIONS_CONFIG = {
  // Patient Management
  'GET /api/patients': ['PATIENT_VIEW_ALL', 'PATIENT_VIEW_ASSIGNED'],
  'POST /api/patients': ['PATIENT_CREATE'],
  'PUT /api/patients/[id]': ['PATIENT_UPDATE'],
  'DELETE /api/patients/[id]': ['PATIENT_DELETE'],

  // Admin Management
  'GET /api/admin/users': ['ADMIN_USER_MANAGEMENT'],
  'POST /api/admin/users': ['ADMIN_USER_MANAGEMENT'],
  'PUT /api/admin/users/[id]': ['ADMIN_USER_MANAGEMENT'],
  'DELETE /api/admin/users/[id]': ['ADMIN_USER_MANAGEMENT'],

  'GET /api/admin/doctors': ['ADMIN_PROVIDER_MANAGEMENT'],
  'POST /api/admin/doctors': ['ADMIN_PROVIDER_MANAGEMENT'],
  
  'GET /api/admin/patients': ['PATIENT_VIEW_ALL'],
  'POST /api/admin/patients': ['PATIENT_CREATE'],

  'GET /api/admin/system/stats': ['ADMIN_ANALYTICS'],

  // Medical Records
  'GET /api/medical-records': ['MEDICAL_RECORDS_FULL_ACCESS', 'MEDICAL_RECORDS_LIMITED_ACCESS', 'MEDICAL_RECORDS_OWN_ACCESS'],
  'POST /api/medical-records': ['MEDICAL_RECORDS_CREATE'],
  'PUT /api/medical-records/[id]': ['MEDICAL_RECORDS_UPDATE'],

  // Medications
  'GET /api/medications': ['MEDICATION_VIEW'],
  'POST /api/medications': ['MEDICATION_PRESCRIBE'],
  'PUT /api/medications/[id]': ['MEDICATION_UPDATE'],

  // Care Plans
  'GET /api/care-plans': ['CARE_PLAN_VIEW'],
  'POST /api/care-plans': ['CARE_PLAN_CREATE'],
  'PUT /api/care-plans/[id]': ['CARE_PLAN_UPDATE'],

  // Appointments
  'GET /api/appointments': ['APPOINTMENT_VIEW_ALL', 'APPOINTMENT_CREATE'],
  'POST /api/appointments': ['APPOINTMENT_CREATE'],
  'PUT /api/appointments/[id]': ['APPOINTMENT_MANAGE'],
  'DELETE /api/appointments/[id]': ['APPOINTMENT_MANAGE'],

  // Vitals
  'GET /api/vitals': ['VITAL_VIEW'],
  'POST /api/vitals': ['VITAL_RECORD'],

  // Secondary Doctor Assignments
  'GET /api/assignments/secondary-doctors': ['SECONDARY_ASSIGNMENT_VIEW'],
  'POST /api/assignments/secondary-doctors': ['SECONDARY_ASSIGNMENT_CREATE'],
  'PUT /api/assignments/secondary-doctors/[id]': ['SECONDARY_ASSIGNMENT_MANAGE'],
  'DELETE /api/assignments/secondary-doctors/[id]': ['SECONDARY_ASSIGNMENT_MANAGE'],

  // Search
  'GET /api/search': ['SEARCH_MEDICAL_DATA'],
  'GET /api/search/patients': ['SEARCH_PATIENTS'],
  'POST /api/search/patients/phone': ['SEARCH_PATIENTS'],
  'GET /api/search/doctors': ['SEARCH_DOCTORS'],
  'GET /api/search/medicines': ['SEARCH_MEDICAL_DATA'],
  'GET /api/search/symptoms': ['SEARCH_MEDICAL_DATA'],
  'GET /api/search/diagnoses': ['SEARCH_MEDICAL_DATA'],
  'GET /api/search/treatments': ['SEARCH_MEDICAL_DATA'],
  'GET /api/search/specialities': ['SEARCH_MEDICAL_DATA'],

  // Subscriptions and Payments
  'GET /api/subscriptions': ['SUBSCRIPTION_MANAGE', 'BILLING_VIEW'],
  'POST /api/subscriptions': ['SUBSCRIPTION_CREATE'],
  'PUT /api/subscriptions': ['SUBSCRIPTION_MANAGE'],

  'GET /api/payments': ['BILLING_VIEW'],
  'POST /api/payments': ['BILLING_MANAGE'],
  'PUT /api/payments/[id]': ['BILLING_MANAGE'],
  'DELETE /api/payments/[id]': ['BILLING_MANAGE'],

  'GET /api/service-plans': ['BILLING_VIEW'],
  'POST /api/service-plans': ['BILLING_MANAGE'],

  // Consultation and Video
  'GET /api/consultations': ['APPOINTMENT_CREATE'],
  'POST /api/consultations': ['APPOINTMENT_CREATE'],
  'GET /api/video-consultations': ['APPOINTMENT_MANAGE'],
  'POST /api/video-consultations': ['APPOINTMENT_MANAGE'],

  // Lab and Diagnostics
  'GET /api/lab/orders': ['MEDICAL_RECORDS_FULL_ACCESS'],
  'POST /api/lab/orders': ['MEDICAL_RECORDS_CREATE'],
  'GET /api/lab/tests': ['MEDICAL_RECORDS_FULL_ACCESS'],

  // Drug Interactions
  'GET /api/drug-interactions': ['MEDICATION_VIEW'],
  'POST /api/drug-interactions/check': ['MEDICATION_PRESCRIBE'],

  // Emergency Alerts
  'GET /api/emergency-alerts': ['CRITICAL_ALERTS'],
  'POST /api/emergency-alerts': ['CRITICAL_ALERTS'],

  // Patient Allergies
  'GET /api/patient-allergies': ['MEDICAL_RECORDS_FULL_ACCESS', 'MEDICAL_RECORDS_OWN_ACCESS'],
  'POST /api/patient-allergies': ['MEDICAL_RECORDS_CREATE'],
  'PUT /api/patient-allergies/[id]': ['MEDICAL_RECORDS_UPDATE'],

  // Symptoms
  'GET /api/symptoms': ['MEDICAL_RECORDS_VIEW'],
  'POST /api/symptoms': ['MEDICAL_RECORDS_CREATE']
} as const;

// Special endpoints that require custom validation
export const CUSTOM_VALIDATION_ENDPOINTS = [
  '/api/patients/[id]',
  '/api/care-plans/[id]',
  '/api/medications/[id]',
  '/api/medical-records/[id]',
  '/api/assignments/secondary-doctors/[id]'
];

export interface RBACRequest extends NextRequest {
  user?: Session['user'];
  rbac?: {
    hasAccess: boolean;
    permissions: string[];
    auditInfo: any;
  };
}

/**
 * RBAC Middleware - Enforces role-based access control for healthcare API endpoints
 */
export async function rbacMiddleware(
  request: NextRequest,
  response: NextResponse,
  endpoint: string
): Promise<{ allowed: boolean; reason?: string; auditInfo?: any }> {
  
  try {
    // Get user session
    const session = await auth();
    if (!session?.user) {
      return { allowed: false, reason: 'Authentication required' };
    }

    const user = session.user;
    const method = request.method;
    const fullEndpoint = `${method} ${endpoint}`;
    
    // Check if endpoint requires RBAC validation
    const requiredPermissions = API_PERMISSIONS_CONFIG[fullEndpoint as keyof typeof API_PERMISSIONS_CONFIG];
    
    if (!requiredPermissions) {
      // If endpoint is not configured, allow by default but log
      console.warn(`RBAC: Unconfigured endpoint accessed: ${fullEndpoint}`);
      return { 
        allowed: true, 
        auditInfo: { 
          warning: 'Unconfigured endpoint',
          endpoint: fullEndpoint,
          userId: user.id,
          role: user.role 
        }
      };
    }

    // Check if user has any of the required permissions
    const hasPermission = HealthcareRBAC.hasAnyPermission(user.role, requiredPermissions);
    
    if (!hasPermission) {
      // Log unauthorized access attempt
      await HealthcareRBAC.createAuditLog(
        user.id,
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'API_ENDPOINT',
        endpoint,
        {
          method,
          requiredPermissions,
          userRole: user.role,
          userAgent: request.headers.get('user-agent')
        },
        request.ip || request.headers.get('x-forwarded-for') as string
      );

      return { 
        allowed: false, 
        reason: `Insufficient permissions. Required: ${requiredPermissions.join(' OR ')}`,
        auditInfo: { 
          requiredPermissions,
          userRole: user.role,
          action: 'DENIED'
        }
      };
    }

    // For endpoints with custom validation (patient-specific data, etc.)
    if (CUSTOM_VALIDATION_ENDPOINTS.some(pattern => {
      const regex = new RegExp(pattern.replace(/\[id\]/g, '[^/]+'));
      return regex.test(endpoint);
    })) {
      
      // Extract resource ID from endpoint
      const resourceId = extractResourceId(endpoint);
      if (resourceId) {
        const customValidation = await performCustomValidation(user, endpoint, resourceId, method);
        if (!customValidation.allowed) {
          return customValidation;
        }
      }
    }

    // Log successful access for sensitive operations
    const sensitiveOperations = ['POST', 'PUT', 'DELETE'];
    if (sensitiveOperations.includes(method)) {
      await HealthcareRBAC.createAuditLog(
        user.id,
        `${method}_${endpoint.split('/').pop()?.toUpperCase()}`,
        'API_ENDPOINT',
        endpoint,
        {
          permissions: requiredPermissions,
          userRole: user.role
        },
        request.ip || request.headers.get('x-forwarded-for') as string
      );
    }

    return { 
      allowed: true,
      auditInfo: {
        userId: user.id,
        role: user.role,
        permissions: requiredPermissions,
        endpoint: fullEndpoint
      }
    };

  } catch (error) {
    console.error('RBAC Middleware Error:', error);
    return { 
      allowed: false, 
      reason: 'RBAC validation failed',
      auditInfo: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Extract resource ID from endpoint path
 */
function extractResourceId(endpoint: string): string | null {
  const matches = endpoint.match(/\/([a-f\d-]{36}|\d+)(?:\/|$)/i);
  return matches ? matches[1] : null;
}

/**
 * Perform custom validation for patient-specific endpoints
 */
async function performCustomValidation(
  user: Session['user'],
  endpoint: string,
  resourceId: string,
  method: string
): Promise<{ allowed: boolean; reason?: string; auditInfo?: any }> {
  
  try {
    // Patient data endpoints
    if (endpoint.includes('/patients/')) {
      const validation = await HealthcareRBAC.validatePatientAccess(
        user.id,
        user.role,
        resourceId
      );
      
      if (!validation.hasAccess) {
        await HealthcareRBAC.createAuditLog(
          user.id,
          'UNAUTHORIZED_PATIENT_ACCESS',
          'PATIENT',
          resourceId,
          { endpoint, method, role: user.role }
        );
        
        return { 
          allowed: false, 
          reason: 'No relationship with this patient',
          auditInfo: { patientId: resourceId, relationship: 'none' }
        };
      }
      
      return { 
        allowed: true,
        auditInfo: { 
          patientId: resourceId, 
          relationship: validation.relationship 
        }
      };
    }

    // Care plan endpoints
    if (endpoint.includes('/care-plans/')) {
      // Validate care plan access through patient relationship
      const carePlan = await prisma.care_plans.findUnique({
        where: { id: resourceId },
        select: { patientId: true }
      });
      
      if (carePlan) {
        const patientValidation = await HealthcareRBAC.validatePatientAccess(
          user.id,
          user.role,
          carePlan.patientId
        );
        
        return { 
          allowed: patientValidation.hasAccess,
          reason: patientValidation.hasAccess ? undefined : 'No access to patient care plans',
          auditInfo: { carePlanId: resourceId, patientId: carePlan.patientId }
        };
      }
    }

    // Medication endpoints
    if (endpoint.includes('/medications/')) {
      const medication = await prisma.medications.findUnique({
        where: { id: resourceId },
        include: { care_plan: { select: { patientId: true } } }
      });
      
      if (medication?.care_plan) {
        const patientValidation = await HealthcareRBAC.validatePatientAccess(
          user.id,
          user.role,
          medication.care_plan.patientId
        );
        
        return { 
          allowed: patientValidation.hasAccess,
          reason: patientValidation.hasAccess ? undefined : 'No access to patient medications',
          auditInfo: { medicationId: resourceId, patientId: medication.care_plan.patientId }
        };
      }
    }

    // Default allow for other custom validations
    return { allowed: true };

  } catch (error) {
    console.error('Custom validation error:', error);
    return { 
      allowed: false, 
      reason: 'Validation error',
      auditInfo: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Utility function to create RBAC response
 */
export function createRBACResponse(allowed: boolean, reason?: string, statusCode: number = 403) {
  if (allowed) {
    return null; // No response needed, proceed with request
  }

  return NextResponse.json({
    status: false,
    statusCode,
    payload: {
      error: {
        status: statusCode === 401 ? 'unauthorized' : 'forbidden',
        message: reason || 'Access denied'
      }
    }
  }, { status: statusCode });
}

/**
 * Helper function to enforce RBAC in API routes
 */
export async function enforceRBAC(request: NextRequest, endpoint: string) {
  const rbacResult = await rbacMiddleware(request, NextResponse.next(), endpoint);
  
  if (!rbacResult.allowed) {
    return createRBACResponse(
      false, 
      rbacResult.reason,
      rbacResult.reason === 'Authentication required' ? 401 : 403
    );
  }
  
  return null; // Access allowed
}