/**
 * Auth.js v5 Configuration for Healthcare Management Platform
 * Implements unified authentication with credentials + social providers + 2FA
 * Uses database sessions with healthcare-specific security features
 */

import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { authenticator } from "otplib"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Healthcare types
type HealthcareRole = "DOCTOR" | "HSP" | "PATIENT" | "SYSTEM_ADMIN" | "HOSPITAL_ADMIN" | "CAREGIVER"
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DEACTIVATED"

// Credentials validation schema with enhanced security and 2FA
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  totpCode: z.string().optional()
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
        },
        totpCode: {
          label: "2FA Code",
          type: "text",
          placeholder: "Enter 6-digit 2FA code (if enabled)"
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
              // Auth.js v5 compatible fields
              name: true,
              image: true,
              emailVerified: true,
              // Healthcare fields
              role: true,
              first_name: true,
              last_name: true,
              full_name: true,
              profile_picture_url: true,
              account_status: true,
              email_verified: true, // Legacy field
              failed_login_attempts: true,
              locked_until: true,
              last_login_at: true,
              // 2FA fields (CRITICAL - was missing!)
              two_factor_enabled: true,
              two_factor_secret: true,
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

          // 2FA Verification for Healthcare Security
          if (user.two_factor_enabled) {
            const { totpCode } = validatedFields.data
            
            if (!totpCode) {
              throw new Error("2FA code is required for this account")
            }
            
            // Verify TOTP code
            const isValidTOTP = authenticator.verify({
              token: totpCode,
              secret: user.two_factor_secret!,
              window: 1 // Allow 1 time step tolerance (30 seconds before/after)
            })
            
            if (!isValidTOTP) {
              // Increment failed attempts for invalid 2FA
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failed_login_attempts: { increment: 1 }
                }
              })
              throw new Error("Invalid 2FA code")
            }
          }

          // Reset failed attempts and update last login on successful authentication
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failed_login_attempts: 0,
              locked_until: null,
              last_login_at: new Date()
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

          // Return user object for session (Auth.js v5 compatible)
          return {
            id: user.id,
            email: user.email,
            // Auth.js v5 expects these exact field names - use the actual schema fields
            name: user.name || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email.split('@')[0],
            image: user.image || user.profile_picture_url,
            emailVerified: user.emailVerified, // Correct Prisma field name
            // Healthcare-specific fields (custom)
            role: user.role,
            businessId: businessId,
            profileId: profileData?.id || null,
            accountStatus: user.account_status,
            organizationId: profileData?.organization_id || null,
            profileData: profileData,
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
        // Serialize profileData to avoid DataCloneError (remove complex objects)
        token.profileData = user.profileData ? JSON.parse(JSON.stringify(user.profileData)) : null
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
        // Only send serializable data to avoid DataCloneError
        session.user.profileData = token.profileData ? JSON.parse(JSON.stringify(token.profileData)) : null
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
            // Update user info with OAuth data if available
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: existingUser.name || user.name,
                image: existingUser.image || user.image,
                emailVerified: existingUser.emailVerified || new Date()
              }
            })
            return true
          }
          
          // For new OAuth users, create with Auth.js v5 compatible fields
          console.log(`Creating new user from ${account.provider}: ${user.email}`)
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || user.email!.split('@')[0],
              image: user.image,
              emailVerified: new Date(), // OAuth users are auto-verified
              role: "PATIENT", // Default role for OAuth users
              account_status: "ACTIVE", // OAuth users start active
              first_name: user.name?.split(' ')[0] || user.email!.split('@')[0],
              last_name: user.name?.split(' ').slice(1).join(' '),
              full_name: user.name || user.email!.split('@')[0]
            }
          })
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
    strategy: "jwt", // Using JWT strategy for credentials provider compatibility
    maxAge: 30 * 60, // 30 minutes for healthcare security compliance
    updateAge: 5 * 60, // Update every 5 minutes for activity tracking
  },
  
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`)
      
      try {
        // Create healthcare audit log entry
        if (user.id) {
          await prisma.auditLog.create({
            data: {
              user_id: user.id,
              action: "SIGN_IN",
              resource: "authentication",
              access_granted: true,
              user_role: (user as any).role || "UNKNOWN",
              details: {
                provider: account?.provider || "unknown",
                isNewUser: isNewUser || false,
                userAgent: "unknown", // Will be captured in middleware
                ipAddress: "0.0.0.0" // Will be captured in middleware
              },
              timestamp: new Date()
            }
          }).catch(error => {
            console.error("Failed to create audit log:", error)
          })
        }
        
        // Update last login for all users
        await prisma.user.update({
          where: { email: user.email! },
          data: { last_login_at: new Date() }
        })
        
        // Update OAuth account last used time
        if (account?.provider !== "credentials" && account?.provider) {
          await prisma.account.updateMany({
            where: {
              userId: user.id!,
              provider: account.provider
            },
            data: {
              last_used_at: new Date(),
              provider_email: user.email,
              provider_name: user.name
            }
          }).catch(error => {
            console.error("Failed to update OAuth account:", error)
          })
        }
        
        // Log new user creation
        if (isNewUser) {
          console.log(`New user created: ${user.email} via ${account?.provider}`)
        }
      } catch (error) {
        console.error("Sign-in event error:", error)
      }
    },
    
    async signOut({ session, token }) {
      console.log(`User signed out: ${session?.user?.email || token?.email}`)
      
      try {
        // Create healthcare audit log entry for sign out
        const userId = session?.user?.id || (token as any)?.id
        if (userId) {
          await prisma.auditLog.create({
            data: {
              user_id: userId,
              action: "SIGN_OUT",
              resource: "authentication",
              access_granted: true,
              user_role: (session?.user as any)?.role || (token as any)?.role || "UNKNOWN",
              timestamp: new Date()
            }
          }).catch(error => {
            console.error("Failed to create sign-out audit log:", error)
          })
        }
      } catch (error) {
        console.error("Sign-out event error:", error)
      }
    }
  },
  
  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
  
  // Trust host configuration for deployment
  trustHost: true, // Allow all hosts for deployment flexibility
  
  // Security configuration
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})

// Export auth function for middleware and server components  
export { auth as getServerSession }