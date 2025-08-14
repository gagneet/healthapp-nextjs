/**
 * Custom Healthcare Authentication System
 * Handles username/password authentication with full database sessions
 * Designed to work alongside NextAuth.js for future OAuth integration
 */

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { cookies } from "next/headers"
import type { User } from "@prisma/client"

// Healthcare session duration (8 hours for security)
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
const SESSION_COOKIE_NAME = "healthcare_session"

export interface HealthcareUser extends User {
  doctors_doctors_user_idTousers?: any
  patient?: any
  hsps_hsps_user_idTousers?: any
  healthcare_provider?: any
}

export interface HealthcareSession {
  id: string
  user_id: string
  session_token: string
  expires_at: Date
  ip_address: string | null
  user_agent: string | null
  user: HealthcareUser
}

export interface AuthResult {
  success: boolean
  user?: HealthcareUser
  session?: HealthcareSession
  error?: string
}

export class HealthcareAuth {
  /**
   * Authenticate user with email/password
   */
  static async authenticate(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    try {
      // Find user with healthcare profiles
      const user = await prisma.user.findUnique({
        where: { 
          email: email.toLowerCase(),
          account_status: "ACTIVE" // Only active users can authenticate
        },
        include: {
          doctors_doctors_user_idTousers: true,
          patient: true,
          hsps_hsps_user_idTousers: true,
          healthcare_provider: true
        }
      })

      if (!user) {
        // Log failed attempt for audit
        await this.logAuthEvent("FAILED_LOGIN", null, { 
          email, 
          reason: "User not found",
          ip_address: ipAddress 
        })
        return { success: false, error: "Invalid email or password" }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        // Log failed attempt
        await this.logAuthEvent("FAILED_LOGIN", user.id, { 
          reason: "Invalid password",
          ip_address: ipAddress 
        })
        return { success: false, error: "Invalid email or password" }
      }

      // Create session
      const session = await this.createSession(user.id, ipAddress, userAgent)
      
      // Log successful login
      await this.logAuthEvent("LOGIN", user.id, { 
        session_id: session.id,
        ip_address: ipAddress 
      })

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() }
      })

      return { 
        success: true, 
        user: user as HealthcareUser, 
        session: { ...session, user: user as HealthcareUser }
      }
    } catch (error) {
      console.error("Authentication error:", error)
      return { success: false, error: "Authentication failed" }
    }
  }

  /**
   * Create a new session
   */
  static async createSession(
    userId: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<HealthcareSession> {
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_DURATION)

    const session = await prisma.healthcareSession.create({
      data: {
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        created_at: new Date()
      },
      include: {
        users_users_idTousers: {
          include: {
            doctors_doctors_user_idTousers: true,
            patient: true,
            hsps_hsps_user_idTousers: true,
            healthcare_provider: true
          }
        }
      }
    })

    return {
      id: session.id,
      user_id: session.user_id,
      session_token: session.session_token,
      expires_at: session.expires_at,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      user: session.users_users_idTousers as HealthcareUser
    }
  }

  /**
   * Validate session token
   */
  static async validateSession(sessionToken: string): Promise<HealthcareSession | null> {
    try {
      const session = await prisma.healthcareSession.findUnique({
        where: { 
          session_token: sessionToken,
          expires_at: { gt: new Date() } // Not expired
        },
        include: {
          users_users_idTousers: {
            where: { account_status: "ACTIVE" }, // User still active
            include: {
              doctors_doctors_user_idTousers: {
                include: {
                  specialities_specialities_idTospecialities: true
                }
              },
              patient: true,
              hsps_hsps_user_idTousers: true,
              healthcare_provider: true
            }
          }
        }
      })

      if (!session || !session.users_users_idTousers) {
        return null
      }

      // Update session activity (extend if needed)
      const now = new Date()
      const timeUntilExpiry = session.expires_at.getTime() - now.getTime()
      const halfSessionDuration = SESSION_DURATION / 2

      // If less than half session time remaining, extend it
      if (timeUntilExpiry < halfSessionDuration) {
        await prisma.healthcareSession.update({
          where: { id: session.id },
          data: { 
            expires_at: new Date(now.getTime() + SESSION_DURATION),
            last_accessed_at: now
          }
        })
      }

      return {
        id: session.id,
        user_id: session.user_id,
        session_token: session.session_token,
        expires_at: session.expires_at,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        user: session.users_users_idTousers as HealthcareUser
      }
    } catch (error) {
      console.error("Session validation error:", error)
      return null
    }
  }

  /**
   * Get current session from request
   */
  static async getCurrentSession(): Promise<HealthcareSession | null> {
    try {
      const cookieStore = cookies()
      const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

      if (!sessionToken) {
        return null
      }

      return await this.validateSession(sessionToken)
    } catch (error) {
      console.error("Get current session error:", error)
      return null
    }
  }

  /**
   * Logout and invalidate session
   */
  static async logout(sessionToken: string): Promise<boolean> {
    try {
      const session = await prisma.healthcareSession.findUnique({
        where: { session_token: sessionToken }
      })

      if (session) {
        // Log logout event
        await this.logAuthEvent("LOGOUT", session.user_id, { 
          session_id: session.id 
        })

        // Delete session
        await prisma.healthcareSession.delete({
          where: { session_token: sessionToken }
        })
      }

      return true
    } catch (error) {
      console.error("Logout error:", error)
      return false
    }
  }

  /**
   * Get healthcare permissions for user
   */
  static getHealthcarePermissions(user: HealthcareUser) {
    const permissions = {
      canPrescribeMedication: false,
      canAccessPatientData: false,
      canManageProviders: false,
      canViewAllPatients: false,
      canManageServices: false,
      canManageSubscriptions: false,
      canRecordVitals: false,
      canViewReports: false
    }

    switch (user.role) {
      case "DOCTOR":
        permissions.canPrescribeMedication = true
        permissions.canAccessPatientData = true
        permissions.canManageServices = true
        permissions.canManageSubscriptions = true
        permissions.canRecordVitals = true
        permissions.canViewReports = true
        break
      
      case "HSP":
        permissions.canAccessPatientData = true
        permissions.canRecordVitals = true
        permissions.canViewReports = true
        break
      
      case "PATIENT":
        permissions.canRecordVitals = true // Own vitals only
        break
      
      case "SYSTEM_ADMIN":
        Object.keys(permissions).forEach(key => {
          permissions[key as keyof typeof permissions] = true
        })
        permissions.canViewAllPatients = true
        break
      
      case "HOSPITAL_ADMIN":
        permissions.canAccessPatientData = true
        permissions.canManageProviders = true
        permissions.canViewReports = true
        break
    }

    return permissions
  }

  /**
   * Log authentication events for audit compliance
   */
  static async logAuthEvent(
    action: string, 
    userId: string | null, 
    details: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action,
          resource: "AUTHENTICATION",
          patient_id: null,
          phi_accessed: false,
          access_granted: action === "LOGIN",
          ip_address: details.ip_address || null,
          user_agent: details.user_agent || null,
          data_changes: details,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error("Failed to log auth event:", error)
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanExpiredSessions(): Promise<void> {
    try {
      await prisma.healthcareSession.deleteMany({
        where: {
          expires_at: { lt: new Date() }
        }
      })
    } catch (error) {
      console.error("Failed to clean expired sessions:", error)
    }
  }
}