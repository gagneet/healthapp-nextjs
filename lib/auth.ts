/**
 * NextAuth.js Configuration for Healthcare Management Platform
 * Implements role-based authentication with healthcare business logic compliance
 */

import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Import healthcare types (inline definition to avoid circular import)
type HealthcareRole = "DOCTOR" | "HSP" | "PATIENT" | "SYSTEM_ADMIN" | "HOSPITAL_ADMIN" | "CAREGIVER"
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DEACTIVATED"
import { z } from "zod"

// Healthcare role validation schema
const CredentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userRole: z.enum(["DOCTOR", "HSP", "PATIENT", "SYSTEM_ADMIN", "HOSPITAL_ADMIN"]).optional()
})

export const authOptions: AuthOptions = {
  // Use JWT strategy for credentials provider compatibility
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "doctor@healthapp.com"
        },
        password: { 
          label: "Password", 
          type: "password" 
        },
        userRole: { 
          label: "User Role", 
          type: "text",
          placeholder: "DOCTOR"
        }
      },
      async authorize(credentials) {
        try {
          // Validate input credentials
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required")
          }

          const validatedCredentials = CredentialsSchema.safeParse(credentials)
          if (!validatedCredentials.success) {
            throw new Error("Invalid credentials format")
          }

          // Find user with comprehensive healthcare profile data
          const user = await prisma.user.findUnique({
            where: { 
              email: validatedCredentials.data.email,
              account_status: "ACTIVE" // Only active users can authenticate
            },
            select: {
              id: true,
              email: true,
              password_hash: true,
              role: true,
              first_name: true,
              last_name: true,
              full_name: true,
              account_status: true,
              email_verified: true,
              profile_picture_url: true,
              last_login_at: true,
              // Include healthcare-specific profiles based on role
              doctors_doctors_user_idTousers: {
                select: {
                  id: true,
                  doctor_id: true,
                  medical_license_number: true,
                  speciality_id: true,
                  years_of_experience: true,
                  consultation_fee: true,
                  organization_id: true
                }
              },
              patient: {
                select: {
                  id: true,
                  patient_id: true,
                  medical_record_number: true,
                  primary_care_doctor_id: true,
                  height_cm: true,
                  weight_kg: true,
                  blood_type: true
                }
              },
              hsps_hsps_user_idTousers: {
                select: {
                  id: true,
                  hsp_id: true,
                  license_number: true,
                  years_of_experience: true,
                  certifications: true,
                  organization_id: true
                }
              },
              healthcare_provider: {
                select: {
                  id: true,
                  organization_id: true
                }
              }
            }
          })

          if (!user) {
            throw new Error("No user found with this email or account inactive")
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            validatedCredentials.data.password, 
            user.password_hash
          )

          if (!isValidPassword) {
            throw new Error("Invalid password")
          }

          // Determine user profile based on role
          let profileData: any = null
          let businessId: string | null = null

          switch (user.role) {
            case "DOCTOR":
              profileData = user.doctors_doctors_user_idTousers
              businessId = profileData?.doctor_id || null
              break
            case "PATIENT":
              profileData = user.patient
              businessId = profileData?.patient_id || null
              break
            case "HSP":
              profileData = user.hsps_hsps_user_idTousers
              businessId = profileData?.hsp_id || null
              break
            case "SYSTEM_ADMIN":
            case "HOSPITAL_ADMIN":
              profileData = user.healthcare_provider || { id: user.id }
              businessId = user.id
              break
          }

          // Healthcare-specific user object
          return {
            id: user.id,
            email: user.email,
            name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
            role: user.role,
            businessId: businessId,
            profileId: profileData?.id || null,
            accountStatus: user.account_status || 'PENDING_VERIFICATION',
            organizationId: profileData?.organization_id || null,
            profileData: profileData,
            image: user.profile_picture_url,
            emailVerified: user.email_verified,
            // Healthcare business logic flags
            canPrescribeMedication: user.role === "DOCTOR",
            canAccessPatientData: ["DOCTOR", "HSP", "SYSTEM_ADMIN", "HOSPITAL_ADMIN"].includes(user.role),
            canManageProviders: ["SYSTEM_ADMIN", "HOSPITAL_ADMIN"].includes(user.role),
            canViewAllPatients: ["SYSTEM_ADMIN"].includes(user.role),
            // Last login tracking for audit compliance
            lastLoginAt: user.last_login_at
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60, // 8 hours for healthcare security
  },

  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      // Include healthcare data in JWT token
      if (user) {
        token.role = user.role
        token.businessId = user.businessId
        token.profileId = user.profileId
        token.accountStatus = user.accountStatus
        token.organizationId = user.organizationId
        token.profileData = user.profileData
        token.canPrescribeMedication = user.canPrescribeMedication
        token.canAccessPatientData = user.canAccessPatientData
        token.canManageProviders = user.canManageProviders
        token.canViewAllPatients = user.canViewAllPatients
      }
      return token
    },

    async session({ session, token }) {
      // With JWT strategy, data comes from the token
      if (session.user && token) {
        // Add healthcare data to session from JWT token
        session.user.id = token.sub!
        session.user.role = token.role as HealthcareRole
        session.user.businessId = token.businessId as string | null
        session.user.profileId = token.profileId as string | null
        session.user.accountStatus = token.accountStatus as AccountStatus
        session.user.organizationId = token.organizationId as string | null
        session.user.profileData = token.profileData
        session.user.canPrescribeMedication = token.canPrescribeMedication as boolean
        session.user.canAccessPatientData = token.canAccessPatientData as boolean
        session.user.canManageProviders = token.canManageProviders as boolean
        session.user.canViewAllPatients = token.canViewAllPatients as boolean
        
        // Update last login for audit trail (optional - don't do on every session check)
        // Only update on actual login, not on every session refresh
        if (token.iat && Date.now() < (token.iat * 1000) + 60000) { // Within first minute of token creation
          await prisma.user.update({
            where: { id: token.sub! },
            data: { last_login_at: new Date() }
          }).catch(error => console.error('Failed to update last login:', error))
        }
      }

      return session
    },

    async redirect({ url, baseUrl }) {
      // Healthcare role-based redirect logic
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Audit logging for healthcare compliance
      console.log(`Healthcare system login: ${user.email} (${user.role}) at ${new Date().toISOString()}`)
      
      // TODO: Log to audit system once schema issues are resolved  
      if (user.id) {
        console.log('User logged in:', { id: user.id, role: user.role, email: user.email });
      }
    },

    async signOut({ session }) {
      // Audit logging for logout events
      if (session?.user?.id) {
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: "LOGOUT",
            resource: "AUTHENTICATION",
            patient_id: null,
            phi_accessed: false,
            access_granted: true,
            ip_address: null,
            user_agent: null,
            data_changes: {
              timestamp: new Date().toISOString()
            },
            timestamp: new Date()
          }
        }).catch(error => {
          console.error("Failed to log logout event:", error)
        })
      }
    }
  },

  debug: process.env.NODE_ENV === "development",
}

export default NextAuth(authOptions)