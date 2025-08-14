/**
 * Auth.js v5 Configuration for Healthcare Management Platform
 * Implements unified authentication with credentials + social providers
 * Uses JWT sessions with proper security for healthcare compliance
 */

import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Healthcare types
type HealthcareRole = "DOCTOR" | "HSP" | "PATIENT" | "SYSTEM_ADMIN" | "HOSPITAL_ADMIN" | "CAREGIVER"
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DEACTIVATED"

// Credentials validation schema with enhanced security
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  providers: [
    // Credentials Provider for Username/Password Authentication
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "Enter your email address"
        },
        password: { 
          label: "Password", 
          type: "password",
          placeholder: "Enter your password"
        }
      },
      
      async authorize(credentials) {
        // Validate input format
        const validatedFields = loginSchema.safeParse(credentials)
        if (!validatedFields.success) {
          throw new Error("Invalid input format")
        }

        const { email, password } = validatedFields.data

        try {
          // Find user by email with healthcare profile data
          const user = await prisma.user.findUnique({
            where: { 
              email: email.toLowerCase().trim()
            },
            select: {
              id: true,
              email: true,
              password_hash: true,
              role: true,
              first_name: true,
              last_name: true,
              full_name: true,
              profile_picture_url: true,
              account_status: true,
              email_verified: true,
              failed_login_attempts: true,
              locked_until: true,
              last_login: true,
              // Healthcare-specific profiles
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
              }
            }
          })

          // Check if user exists
          if (!user) {
            throw new Error("Invalid credentials")
          }

          // Check if user has password hash (credentials user)
          if (!user.password_hash) {
            throw new Error("Please sign in using your social account")
          }

          // Check account status - healthcare compliance requirement
          if (user.account_status !== 'ACTIVE') {
            throw new Error("Account is not active. Please contact support.")
          }

          // Check if account is temporarily locked
          if (user.locked_until && user.locked_until > new Date()) {
            const unlockTime = user.locked_until.toLocaleString()
            throw new Error(`Account is locked until ${unlockTime}`)
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password_hash)
          
          if (!isPasswordValid) {
            // Increment failed login attempts
            const newFailedAttempts = (user.failed_login_attempts || 0) + 1
            let lockedUntil = null
            
            // Lock account after 5 failed attempts for 15 minutes
            if (newFailedAttempts >= 5) {
              lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
            }

            await prisma.user.update({
              where: { id: user.id },
              data: {
                failed_login_attempts: newFailedAttempts,
                locked_until: lockedUntil
              }
            })

            throw new Error("Invalid credentials")
          }

          // Reset failed attempts and update last login on successful authentication
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failed_login_attempts: 0,
              locked_until: null,
              last_login: new Date()
            }
          })

          // Determine user profile data based on role
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
              businessId = user.id
              break
          }

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.email.split('@')[0],
            role: user.role,
            businessId: businessId,
            profileId: profileData?.id || null,
            accountStatus: user.account_status,
            organizationId: profileData?.organization_id || null,
            profileData: profileData,
            image: user.profile_picture_url,
            emailVerified: user.email_verified ? new Date(user.email_verified) : null,
            // Healthcare business logic flags
            canPrescribeMedication: user.role === "DOCTOR",
            canAccessPatientData: ["DOCTOR", "HSP", "SYSTEM_ADMIN", "HOSPITAL_ADMIN"].includes(user.role),
            canManageProviders: ["SYSTEM_ADMIN", "HOSPITAL_ADMIN"].includes(user.role),
            canViewAllPatients: ["SYSTEM_ADMIN"].includes(user.role)
          }

        } catch (error) {
          console.error("Authentication error:", error)
          throw new Error(error instanceof Error ? error.message : "Authentication failed")
        }
      }
    }),

    // Google Provider for Social Authentication
    ...(process.env.GOOGLE_CLIENT_ID ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            scope: "openid email profile"
          }
        }
      })
    ] : [])
  ],
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.id = user.id
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
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.id as string
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
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      // Allow credentials sign-in
      if (account?.provider === "credentials") {
        return true
      }
      
      // Handle social login account linking
      if (account?.provider && account.provider !== "credentials") {
        try {
          // Check if user already exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { 
              accounts: {
                where: {
                  provider: account.provider
                }
              }
            }
          })
          
          if (existingUser) {
            // If user exists but doesn't have this provider linked
            if (existingUser.accounts.length === 0) {
              console.log(`Linking ${account.provider} account to existing user: ${user.email}`)
            }
            return true
          }
          
          // For new social users, create with default role
          console.log(`Creating new user from ${account.provider}: ${user.email}`)
          return true
          
        } catch (error) {
          console.error("Social sign-in error:", error)
          return false
        }
      }
      
      return true
    },
    
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },
  
  session: {
    strategy: "jwt", // Using JWT for Auth.js v5 compatibility
    maxAge: 8 * 60 * 60, // 8 hours for healthcare security
    updateAge: 60 * 60, // 1 hour
  },
  
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`)
      
      // Update last login for database users
      if (account?.provider === "credentials") {
        try {
          await prisma.user.update({
            where: { email: user.email! },
            data: { last_login: new Date() }
          })
        } catch (error) {
          console.error("Failed to update last login:", error)
        }
      }
      
      // Log new user creation
      if (isNewUser) {
        console.log(`New user created: ${user.email} via ${account?.provider}`)
      }
    },
    
    async signOut({ session, token }) {
      console.log(`User signed out: ${session?.user?.email || token?.email}`)
    }
  },
  
  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
  
  // Security configuration
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})

// Export auth function for middleware and server components  
export { auth as getServerSession }