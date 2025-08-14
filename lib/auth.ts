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
  adapter: PrismaAdapter(prisma),
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
    strategy: "database" as const,
    maxAge: 8 * 60 * 60, // 8 hours for healthcare security
    updateAge: 2 * 60 * 60, // Update session every 2 hours
  },

  callbacks: {
    async session({ session, user }) {
      // With database strategy, user comes from the database via PrismaAdapter
      if (session.user && user) {
        // Get fresh user data with healthcare profiles
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            role: true,
            first_name: true,
            last_name: true,
            full_name: true,
            account_status: true,
            profile_picture_url: true,
            // Include healthcare profiles
            doctors_doctors_user_idTousers: {
              select: {
                id: true,
                doctor_id: true,
                medical_license_number: true,
                speciality_id: true,
                organization_id: true
              }
            },
            patient: {
              select: {
                id: true,
                patient_id: true,
                medical_record_number: true,
                primary_care_doctor_id: true
              }
            },
            hsps_hsps_user_idTousers: {
              select: {
                id: true,
                hsp_id: true,
                license_number: true,
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

        if (fullUser) {
          // Determine profile data based on role
          let profileData: any = null
          let businessId: string | null = null

          switch (fullUser.role) {
            case "DOCTOR":
              profileData = fullUser.doctors_doctors_user_idTousers
              businessId = profileData?.doctor_id || null
              break
            case "PATIENT":
              profileData = fullUser.patient
              businessId = profileData?.patient_id || null
              break
            case "HSP":
              profileData = fullUser.hsps_hsps_user_idTousers
              businessId = profileData?.hsp_id || null
              break
            case "SYSTEM_ADMIN":
            case "HOSPITAL_ADMIN":
              profileData = fullUser.healthcare_provider || { id: fullUser.id }
              businessId = fullUser.id
              break
          }

          // Update session with healthcare data
          session.user.id = fullUser.id
          session.user.role = fullUser.role as HealthcareRole
          session.user.businessId = businessId
          session.user.profileId = profileData?.id || null
          session.user.accountStatus = fullUser.account_status as AccountStatus || 'PENDING_VERIFICATION'
          session.user.organizationId = profileData?.organization_id || null
          session.user.profileData = profileData
          session.user.name = fullUser.full_name || `${fullUser.first_name} ${fullUser.last_name}`.trim()
          session.user.image = fullUser.profile_picture_url

          // Healthcare permissions
          session.user.canPrescribeMedication = fullUser.role === "DOCTOR"
          session.user.canAccessPatientData = ["DOCTOR", "HSP", "SYSTEM_ADMIN", "HOSPITAL_ADMIN"].includes(fullUser.role)
          session.user.canManageProviders = ["SYSTEM_ADMIN", "HOSPITAL_ADMIN"].includes(fullUser.role)
          session.user.canViewAllPatients = ["SYSTEM_ADMIN"].includes(fullUser.role)

          // Update last login for audit trail
          await prisma.user.update({
            where: { id: fullUser.id },
            data: { last_login_at: new Date() }
          })
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