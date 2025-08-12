/**
 * Next.js API Response Utilities for Healthcare Management Platform
 * Standardized response formatting and error handling following healthcare compliance standards
 */

import { NextResponse } from "next/server"
import { z } from "zod"

// Healthcare API Response Types
export interface HealthcareApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
    field?: string // For validation errors
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  meta: {
    timestamp: string
    version: string
    requestId: string
    processingTime?: number
  }
}

// Healthcare-specific error codes
export enum HealthcareErrorCodes {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN", 
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",
  
  // Healthcare Business Logic
  PATIENT_NOT_FOUND = "PATIENT_NOT_FOUND",
  DOCTOR_NOT_FOUND = "DOCTOR_NOT_FOUND",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  CARE_TEAM_ACCESS_DENIED = "CARE_TEAM_ACCESS_DENIED",
  
  // Medical Safety
  MEDICATION_INTERACTION = "MEDICATION_INTERACTION",
  ALLERGY_CONFLICT = "ALLERGY_CONFLICT",
  PRESCRIPTION_AUTHORITY_REQUIRED = "PRESCRIPTION_AUTHORITY_REQUIRED",
  VITAL_SIGNS_CRITICAL = "VITAL_SIGNS_CRITICAL",
  
  // Data Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",
  INVALID_DATA_FORMAT = "INVALID_DATA_FORMAT",
  
  // System Errors
  SERVER_ERROR = "SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  
  // Healthcare Compliance
  HIPAA_VIOLATION = "HIPAA_VIOLATION",
  AUDIT_LOG_REQUIRED = "AUDIT_LOG_REQUIRED",
  CONSENT_REQUIRED = "CONSENT_REQUIRED"
}

// Custom Error Classes
export class HealthcareApiError extends Error {
  code: HealthcareErrorCodes
  statusCode: number
  details?: any
  field?: string

  constructor(
    code: HealthcareErrorCodes,
    message: string,
    statusCode: number = 500,
    details?: any,
    field?: string
  ) {
    super(message)
    this.name = "HealthcareApiError"
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.field = field
  }
}

export class ValidationError extends HealthcareApiError {
  constructor(message: string, details?: any, field?: string) {
    super(HealthcareErrorCodes.VALIDATION_ERROR, message, 400, details, field)
    this.name = "ValidationError"
  }
}

export class AuthorizationError extends HealthcareApiError {
  constructor(message: string = "Access denied") {
    super(HealthcareErrorCodes.FORBIDDEN, message, 403)
    this.name = "AuthorizationError"
  }
}

export class MedicalSafetyError extends HealthcareApiError {
  constructor(code: HealthcareErrorCodes, message: string, details?: any) {
    super(code, message, 422, details) // 422 Unprocessable Entity for medical safety
    this.name = "MedicalSafetyError"
  }
}

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  data?: T,
  error?: {
    code: HealthcareErrorCodes | string
    message: string
    details?: any
    field?: string
  },
  pagination?: {
    page: number
    limit: number
    total: number
  },
  processingStartTime?: number
): HealthcareApiResponse<T> {
  const timestamp = new Date().toISOString()
  const requestId = crypto.randomUUID()
  const processingTime = processingStartTime 
    ? Date.now() - processingStartTime 
    : undefined

  const response: HealthcareApiResponse<T> = {
    success: !error,
    data,
    error,
    meta: {
      timestamp,
      version: process.env.API_VERSION || "1.0.0",
      requestId,
      processingTime
    }
  }

  // Add pagination if provided
  if (pagination) {
    const totalPages = Math.ceil(pagination.total / pagination.limit)
    response.pagination = {
      ...pagination,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1
    }
  }

  return response
}

/**
 * Create success response with data
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  pagination?: { page: number; limit: number; total: number },
  processingStartTime?: number
): NextResponse<HealthcareApiResponse<T>> {
  return NextResponse.json(
    createApiResponse(data, undefined, pagination, processingStartTime),
    { status: statusCode }
  )
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: HealthcareApiError | Error,
  processingStartTime?: number
): NextResponse<HealthcareApiResponse> {
  let errorResponse: HealthcareApiResponse

  if (error instanceof HealthcareApiError) {
    errorResponse = createApiResponse(
      undefined,
      {
        code: error.code,
        message: error.message,
        details: error.details,
        field: error.field
      },
      undefined,
      processingStartTime
    )
    
    return NextResponse.json(errorResponse, { status: error.statusCode })
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      received: (err as any).received || undefined
    }))
    
    errorResponse = createApiResponse(
      undefined,
      {
        code: HealthcareErrorCodes.VALIDATION_ERROR,
        message: "Input validation failed",
        details
      },
      undefined,
      processingStartTime
    )
    
    return NextResponse.json(errorResponse, { status: 400 })
  }

  // Handle generic errors
  errorResponse = createApiResponse(
    undefined,
    {
      code: HealthcareErrorCodes.SERVER_ERROR,
      message: process.env.NODE_ENV === "development" 
        ? error.message 
        : "Internal server error"
    },
    undefined,
    processingStartTime
  )
  
  return NextResponse.json(errorResponse, { status: 500 })
}

/**
 * Healthcare-specific error responses
 */

export function createUnauthorizedResponse(message: string = "Authentication required") {
  return createErrorResponse(
    new HealthcareApiError(HealthcareErrorCodes.UNAUTHORIZED, message, 401)
  )
}

export function createForbiddenResponse(message: string = "Access denied") {
  return createErrorResponse(
    new AuthorizationError(message)
  )
}

export function createNotFoundResponse(resource: string = "Resource") {
  return createErrorResponse(
    new HealthcareApiError(
      HealthcareErrorCodes.PATIENT_NOT_FOUND, // Generic, can be specialized
      `${resource} not found`,
      404
    )
  )
}

export function createValidationErrorResponse(
  message: string,
  details?: any,
  field?: string
) {
  return createErrorResponse(
    new ValidationError(message, details, field)
  )
}

export function createMedicalSafetyResponse(
  code: HealthcareErrorCodes,
  message: string,
  details?: any
) {
  return createErrorResponse(
    new MedicalSafetyError(code, message, details)
  )
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    const startTime = Date.now()
    
    try {
      return await handler(...args)
    } catch (error) {
      console.error("API Error:", error)
      
      // Log to audit system for healthcare compliance
      const request = args[0] as Request
      const pathname = new URL(request.url).pathname
      
      console.error(`Healthcare API Error: ${pathname}`, {
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      })
      
      return createErrorResponse(error as Error, startTime)
    }
  }
}

/**
 * Validate healthcare business logic permissions
 */
export function validateHealthcarePermissions(
  userRole: string,
  requiredPermissions: string[],
  customPermissions?: Record<string, boolean>
): boolean {
  // Role-based permission checking
  const rolePermissions: Record<string, string[]> = {
    SYSTEM_ADMIN: ["*"], // All permissions
    HOSPITAL_ADMIN: ["manage_providers", "view_doctors", "view_patients"],
    DOCTOR: ["prescribe_medications", "manage_patients", "view_vitals", "manage_care_plans"],
    HSP: ["view_patients", "record_vitals", "view_appointments"],
    PATIENT: ["view_own_data", "record_vitals", "view_appointments"]
  }

  const userPermissions = rolePermissions[userRole] || []
  
  // Admin has all permissions
  if (userPermissions.includes("*")) {
    return true
  }

  // Check if user has all required permissions
  const hasPermissions = requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  )

  // Apply custom permission overrides
  if (customPermissions) {
    return hasPermissions && Object.values(customPermissions).every(Boolean)
  }

  return hasPermissions
}

/**
 * Healthcare audit logging helper
 */
export async function logHealthcareAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: any
) {
  // This would integrate with your audit logging system
  console.log("Healthcare Audit Log:", {
    userId,
    action,
    resourceType,
    resourceId,
    details,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID()
  })
  
  // TODO: Integrate with actual audit logging system
  // await auditService.log({ userId, action, resourceType, resourceId, details })
}