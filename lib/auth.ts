/**
 * NextAuth.js Configuration for Healthcare Management Platform
 * Implements role-based authentication with healthcare business logic compliance
 */

import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
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
            include: { 
              // Include healthcare-specific profiles based on role
              doctors_doctors_user_idTousers: {
                select: {
                  id: true,
                  doctor_id: true,
                  medical_license_number: true,
                  speciality_id: true,
                  years_of_experience: true,
                  consultation_fee: true,
                  clinic_address: true,
                  organization_id: true
                }
              },
              patient: {
                select: {
                  id: true,
                  patient_id: true,
                  medical_record_number: true,
                  primary_doctor_id: true,
                  height: true,
                  weight: true,
                  blood_type: true
                }
              },
              hsps_hsps_user_idTousers: {
                select: {
                  id: true,
                  hsp_id: true,
                  hsp_type: true,
                  license_number: true,
                  years_of_experience: true,
                  certifications: true,
                  organization_id: true
                }
              },
              healthcare_provider: {
                select: {
                  id: true,
                  organization_id: true,
                  provider_type: true,
                  license_number: true
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
            accountStatus: user.account_status,
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
    updateAge: 2 * 60 * 60, // Update session every 2 hours
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Include healthcare-specific data in JWT
      if (user) {
        token.role = user.role
        token.businessId = user.businessId
        token.profileId = user.profileId
        token.accountStatus = user.accountStatus
        token.organizationId = user.organizationId
        token.profileData = user.profileData
        
        // Healthcare permissions
        token.canPrescribeMedication = user.canPrescribeMedication
        token.canAccessPatientData = user.canAccessPatientData
        token.canManageProviders = user.canManageProviders
        token.canViewAllPatients = user.canViewAllPatients

        // Update last login timestamp for audit trail
        await prisma.user.update({
          where: { id: user.id },
          data: { last_login_at: new Date() }
        })
      }

      // Handle session updates (e.g., profile changes)
      if (trigger === "update" && token.sub) {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            account_status: true,
            profile_picture_url: true,
            full_name: true,
            first_name: true,
            last_name: true
          }
        })

        if (updatedUser) {
          token.accountStatus = updatedUser.account_status
          token.picture = updatedUser.profile_picture_url
          token.name = updatedUser.full_name || `${updatedUser.first_name} ${updatedUser.last_name}`.trim()
        }
      }

      return token
    },

    async session({ session, token }) {
      // Pass healthcare-specific data to client session
      if (session.user && token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.businessId = token.businessId as string
        session.user.profileId = token.profileId as string
        session.user.accountStatus = token.accountStatus as string
        session.user.organizationId = token.organizationId as string
        session.user.profileData = token.profileData
        
        // Healthcare permissions
        session.user.canPrescribeMedication = token.canPrescribeMedication as boolean
        session.user.canAccessPatientData = token.canAccessPatientData as boolean
        session.user.canManageProviders = token.canManageProviders as boolean
        session.user.canViewAllPatients = token.canViewAllPatients as boolean
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
      
      // Log to audit system
      if (user.id) {
        await prisma.auditLog.create({
          data: {
            user_id: user.id,
            action: "USER_LOGIN",
            resource_type: "AUTHENTICATION",
            resource_id: user.id,
            details: {
              ip_address: "system", // Would come from request in real implementation
              user_agent: "healthcare_app",
              login_method: account?.provider || "credentials",
              timestamp: new Date().toISOString()
            },
            created_at: new Date()
          }
        }).catch(error => {
          console.error("Failed to log authentication event:", error)
        })
      }
    },

    async signOut({ session, token }) {
      // Audit logging for logout events
      if (token?.sub) {
        await prisma.auditLog.create({
          data: {
            user_id: token.sub,
            action: "USER_LOGOUT",
            resource_type: "AUTHENTICATION", 
            resource_id: token.sub,
            details: {
              timestamp: new Date().toISOString()
            },
            created_at: new Date()
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