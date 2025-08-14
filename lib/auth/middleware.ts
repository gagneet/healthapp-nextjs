/**
 * Healthcare Authentication Middleware
 * Protects routes and provides user context
 */

import { NextRequest, NextResponse } from "next/server"
import { HealthcareAuth, type HealthcareSession } from "./healthcare-auth"

export interface AuthenticatedRequest extends NextRequest {
  user: HealthcareSession["user"]
  session: HealthcareSession
}

/**
 * Middleware to protect API routes
 */
export async function requireAuth(request: NextRequest): Promise<HealthcareSession | null> {
  const sessionToken = request.cookies.get("healthcare_session")?.value
  
  if (!sessionToken) {
    return null
  }

  const session = await HealthcareAuth.validateSession(sessionToken)
  return session
}

/**
 * Middleware to require specific healthcare roles
 */
export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const session = await requireAuth(request)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

/**
 * Middleware to require specific healthcare permissions
 */
export function requirePermission(permission: string) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const session = await requireAuth(request)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const permissions = HealthcareAuth.getHealthcarePermissions(session.user)
    
    if (!permissions[permission as keyof typeof permissions]) {
      return NextResponse.json(
        { success: false, error: `Permission required: ${permission}` },
        { status: 403 }
      )
    }

    return null // Allow request to continue
  }
}

/**
 * Get user from request (for use in API handlers)
 */
export async function getUser(request: NextRequest): Promise<HealthcareSession | null> {
  return await requireAuth(request)
}

/**
 * Wrapper for API routes that require authentication
 */
export function withAuth(
  handler: (request: NextRequest, session: HealthcareSession) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const session = await requireAuth(request)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    return await handler(request, session)
  }
}

/**
 * Wrapper for API routes that require specific roles
 */
export function withRole(
  allowedRoles: string[],
  handler: (request: NextRequest, session: HealthcareSession) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, session: HealthcareSession): Promise<NextResponse> => {
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    return await handler(request, session)
  })
}

/**
 * Healthcare-specific route protection
 */
export const HealthcareMiddleware = {
  // Doctor-only routes
  doctorOnly: (handler: (request: NextRequest, session: HealthcareSession) => Promise<NextResponse>) => 
    withRole(["DOCTOR"], handler),

  // HSP-only routes  
  hspOnly: (handler: (request: NextRequest, session: HealthcareSession) => Promise<NextResponse>) =>
    withRole(["HSP"], handler),

  // Patient-only routes
  patientOnly: (handler: (request: NextRequest, session: HealthcareSession) => Promise<NextResponse>) =>
    withRole(["PATIENT"], handler),

  // Admin-only routes
  adminOnly: (handler: (request: NextRequest, session: HealthcareSession) => Promise<NextResponse>) =>
    withRole(["SYSTEM_ADMIN", "HOSPITAL_ADMIN"], handler),

  // Healthcare provider routes (Doctor or HSP)
  providerOnly: (handler: (request: NextRequest, session: HealthcareSession) => Promise<NextResponse>) =>
    withRole(["DOCTOR", "HSP"], handler),

  // Medication management (Doctor only)
  medicationAccess: (handler: (request: NextRequest, session: HealthcareSession) => Promise<NextResponse>) =>
    withAuth(async (request: NextRequest, session: HealthcareSession): Promise<NextResponse> => {
      const permissions = HealthcareAuth.getHealthcarePermissions(session.user)
      if (!permissions.canPrescribeMedication) {
        return NextResponse.json(
          { success: false, error: "Only doctors can manage medications" },
          { status: 403 }
        )
      }
      return await handler(request, session)
    })
}