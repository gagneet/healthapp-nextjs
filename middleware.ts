/**
 * Next.js Middleware for Healthcare Management Platform
 * Implements hybrid authentication with role-based route protection
 * Supports both custom healthcare auth and NextAuth.js OAuth
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { HealthcareAuth } from "@/lib/auth/healthcare-auth"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Skip middleware for public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/public') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }

  // Try custom healthcare authentication first
  let user: any = null
  let authType = 'none'

  // Check healthcare session
  const healthcareSession = await HealthcareAuth.getCurrentSession()
  if (healthcareSession) {
    user = {
      id: healthcareSession.user.id,
      email: healthcareSession.user.email,
      role: healthcareSession.user.role,
      accountStatus: healthcareSession.user.account_status,
      canAccessPatientData: HealthcareAuth.getHealthcarePermissions(healthcareSession.user).canAccessPatientData,
      canPrescribeMedication: HealthcareAuth.getHealthcarePermissions(healthcareSession.user).canPrescribeMedication,
      canManageProviders: HealthcareAuth.getHealthcarePermissions(healthcareSession.user).canManageProviders
    }
    authType = 'healthcare'
  } else {
    // Fallback to NextAuth token (for future OAuth integration)
    const nextAuthToken = await getToken({ req })
    if (nextAuthToken) {
      user = nextAuthToken
      authType = 'nextauth'
    }
  }

  // Ensure user is authenticated for protected routes
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Check account status - healthcare compliance requirement
  if (user.accountStatus !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/auth/account-inactive', req.url))
  }

  // Route-based authorization following healthcare business logic

  // System Admin routes - highest privilege level
  if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/api/admin')) {
    if (user.role !== 'SYSTEM_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Provider Admin routes - manage doctors and providers
  if (pathname.startsWith('/dashboard/provider') || pathname.startsWith('/api/provider')) {
    if (!['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Doctor routes - medical practice management
  if (pathname.startsWith('/dashboard/doctor') || pathname.startsWith('/api/doctors')) {
    // Business Logic: Doctors can access doctor routes, admins can manage doctor accounts
    if (!['DOCTOR', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Patient routes - patient-specific data access
  if (pathname.startsWith('/dashboard/patient')) {
    // Business Logic: Patients can access their own data, healthcare providers can access patient data
    if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // HSP (Health Service Provider) routes
  if (pathname.startsWith('/dashboard/hospital') || pathname.startsWith('/api/hsp')) {
    // Business Logic: HSPs can access HSP routes, admins can manage HSP accounts
    if (!['HSP', 'SYSTEM_ADMIN', 'HOSPITAL_ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Patient API routes with enhanced security
  if (pathname.startsWith('/api/patients')) {
    // Business Logic: Only doctors, HSPs, and admins can access patient APIs
    if (!user.canAccessPatientData) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Medication API routes - prescription authority required
  if (pathname.startsWith('/api/medications') && req.method === 'POST') {
    // Business Logic: Only doctors can prescribe medications (create medication records)
    if (!user.canPrescribeMedication) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Care plan management - healthcare provider only
  if (pathname.startsWith('/api/care-plans') || pathname.startsWith('/api/careplan')) {
    // Business Logic: Only healthcare providers can manage care plans
    if (!['DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Provider management APIs - admin only
  if (pathname.startsWith('/api/providers') && ['POST', 'PUT', 'DELETE'].includes(req.method || '')) {
    if (!user.canManageProviders) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Symptoms and diagnosis APIs - healthcare provider access
  if (pathname.startsWith('/api/symptoms')) {
    // Business Logic: Patients can record symptoms, healthcare providers can manage symptoms
    if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Vitals API routes - patient self-recording and healthcare provider management
  if (pathname.startsWith('/api/vitals')) {
    // Business Logic: Patients can record their vitals, healthcare providers can manage vitals
    if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Appointments API - scheduling permissions
  if (pathname.startsWith('/api/appointments')) {
    // Business Logic: Patients, doctors, and HSPs can manage appointments
    if (!['PATIENT', 'DOCTOR', 'HSP', 'SYSTEM_ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
  }

  // Default dashboard redirect based on role
  if (pathname === '/dashboard') {
    switch (user.role) {
      case 'SYSTEM_ADMIN':
        return NextResponse.redirect(new URL('/dashboard/admin', req.url))
      case 'HOSPITAL_ADMIN':
        return NextResponse.redirect(new URL('/dashboard/provider', req.url))
      case 'DOCTOR':
        return NextResponse.redirect(new URL('/dashboard/doctor', req.url))
      case 'HSP':
        return NextResponse.redirect(new URL('/dashboard/hospital', req.url))
      case 'PATIENT':
        return NextResponse.redirect(new URL('/dashboard/patient', req.url))
      default:
        return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  return NextResponse.next()
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled by individual route files)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}