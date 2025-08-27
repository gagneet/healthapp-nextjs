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
import { UserRole, UserAccountStatus } from "@prisma/client"

// Extended user interface for healthcare platform
interface ExtendedUser {
  id: string
  role: UserRole
  businessId?: string
  profileId?: string
  accountStatus: UserAccountStatus
  organizationId?: string
  profileData?: any
  canPrescribeMedication?: boolean
  canAccessPatientData?: boolean
  canManageProviders?: boolean
  [key: string]: any // For additional dynamic properties
}

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
              passwordHash: true,
              name: true,
              image: true,
              emailVerifiedAt: true,
              role: true,
              firstName: true,
              lastName: true,
              fullName: true,
              profilePictureUrl: true,
              accountStatus: true,
              failedLoginAttempts: true,
              lockedUntil: true,
              lastLoginAt: true,
              twoFactorEnabled: true,
              twoFactorSecret: true,
              // Corrected relations
              doctorProfile: {
                select: {
                  id: true,
                  doctorId: true,
                  medicalLicenseNumber: true,
                  specialtyId: true,
                  yearsOfExperience: true,
                  consultationFee: true,
                  organizationId: true
                }
              },
              patientProfile: {
                select: {
                  id: true,
                  patientId: true,
                  medicalRecordNumber: true,
                  primaryCareDoctorId: true
                }
              },
              hspProfile: {
                select: {
                  id: true,
                  hspId: true,
                  licenseNumber: true,
                  organizationId: true
                }
              }
            }
          })

          // Check if user exists
          if (!user) {
            throw new Error("Invalid credentials")
          }

          // Check if user has password hash (credentials user)
          if (!user.passwordHash) {
            throw new Error("Please sign in using your social account")
          }

          // Check account status - healthcare compliance requirement
          if (user.accountStatus !== 'ACTIVE') {
            throw new Error(`Account is not active (${user.accountStatus}). Please contact support.`)
          }

          // Check if account is temporarily locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            const unlockTime = user.lockedUntil.toLocaleString()
            throw new Error(`Account is locked until ${unlockTime}`)
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
          
          if (!isPasswordValid) {
            // Increment failed login attempts
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1
            let lockedUntil = null
            
            // Lock account after 5 failed attempts for 15 minutes
            if (newFailedAttempts >= 5) {
              lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
            }

            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newFailedAttempts,
                lockedUntil: lockedUntil
              }
            })

            throw new Error("Invalid credentials")
          }

          // 2FA Verification for Healthcare Security
          if (user.twoFactorEnabled && user.twoFactorSecret) {
            const { totpCode } = validatedFields.data
            
            if (!totpCode) {
              throw new Error("2FA code is required for this account")
            }
            
            // Verify TOTP code
            const isValidTOTP = authenticator.verify({
              token: totpCode,
              secret: user.twoFactorSecret,
              window: 1 // Allow 1 time step tolerance (30 seconds before/after)
            })
            
            if (!isValidTOTP) {
              // Increment failed attempts for invalid 2FA
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: { increment: 1 }
                }
              })
              throw new Error("Invalid 2FA code")
            }
          }

          // Reset failed attempts and update last login on successful authentication
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date()
            }
          })

          // Determine user profile data based on role
          let profileData: any = null
          let businessId: string | null = null

          switch (user.role) {
            case "DOCTOR":
              profileData = user.doctorProfile
              businessId = profileData?.doctorId || null
              break
            case "PATIENT":
              profileData = user.patientProfile
              businessId = profileData?.patientId || null
              break
            case "HSP":
              profileData = user.hspProfile
              businessId = profileData?.hspId || null
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
            name: user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
            image: user.image || user.profilePictureUrl,
            emailVerified: user.emailVerifiedAt,
            // Healthcare-specific fields (custom)
            role: user.role,
            businessId: businessId,
            profileId: profileData?.id || null,
            accountStatus: user.accountStatus,
            organizationId: profileData?.organizationId || null,
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
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        const extendedUser = user as ExtendedUser
        token.role = extendedUser.role
        token.id = user.id
        token.businessId = extendedUser.businessId
        token.profileId = extendedUser.profileId
        token.accountStatus = extendedUser.accountStatus
        token.organizationId = extendedUser.organizationId
        token.profileData = extendedUser.profileData ? JSON.parse(JSON.stringify(extendedUser.profileData)) : null
        token.canPrescribeMedication = extendedUser.canPrescribeMedication
        token.canAccessPatientData = extendedUser.canAccessPatientData
        token.canManageProviders = extendedUser.canManageProviders
        token.canViewAllPatients = extendedUser.canViewAllPatients
      }
      return token
    },
    
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        const extendedUser = session.user as any
        extendedUser.id = token.id as string
        extendedUser.role = token.role as UserRole
        extendedUser.businessId = token.businessId as string | null
        extendedUser.profileId = token.profileId as string | null
        extendedUser.accountStatus = token.accountStatus as UserAccountStatus
        extendedUser.organizationId = token.organizationId as string | null
        extendedUser.profileData = token.profileData ? JSON.parse(JSON.stringify(token.profileData)) : null
        extendedUser.canPrescribeMedication = token.canPrescribeMedication as boolean
        extendedUser.canAccessPatientData = token.canAccessPatientData as boolean
        extendedUser.canManageProviders = token.canManageProviders as boolean
        extendedUser.canViewAllPatients = token.canViewAllPatients as boolean
      }
      return session
    },
    
    async signIn({ user, account }) {
      // Allow credentials sign-in
      if (account?.provider === "credentials") {
        return true
      }
      
      // Handle social login account linking
      if (account?.provider && account.provider !== "credentials") {
        try {
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
            if (existingUser.accounts.length === 0) {
              console.log(`Linking ${account.provider} account to existing user: ${user.email}`)
            }
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: existingUser.name || user.name,
                image: existingUser.image || user.image,
                emailVerifiedAt: existingUser.emailVerifiedAt || new Date()
              }
            })
            return true
          }
          
          console.log(`Creating new user from ${account.provider}: ${user.email}`)
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || user.email!.split('@')[0],
              image: user.image,
              emailVerifiedAt: new Date(),
              role: "PATIENT",
              accountStatus: "ACTIVE",
              firstName: user.name?.split(' ')[0] || user.email!.split('@')[0],
              lastName: user.name?.split(' ').slice(1).join(' '),
              fullName: user.name || user.email!.split('@')[0]
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
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 60,
    updateAge: 5 * 60,
  },
  
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`)
      
      try {
        if (user.id) {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "SIGN_IN",
              resource: "authentication",
              accessGranted: true,
              userRole: (user as any).role || "UNKNOWN",
              dataChanges: {
                provider: account?.provider || "unknown",
                isNewUser: isNewUser || false,
                userAgent: "unknown",
                ipAddress: "0.0.0.0"
              },
              timestamp: new Date(),
              createdAt: new Date()
            }
          }).catch(error => {
            console.error("Failed to create audit log:", error)
          })
        }
        
        await prisma.user.update({
          where: { email: user.email! },
          data: { lastLoginAt: new Date() }
        })
        
        if (account?.provider !== "credentials" && account?.provider) {
          await prisma.account.updateMany({
            where: {
              userId: user.id!,
              provider: account.provider
            },
            data: {
              lastUsedAt: new Date(),
              providerEmail: user.email,
              providerName: user.name
            }
          }).catch(error => {
            console.error("Failed to update OAuth account:", error)
          })
        }
        
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
        const userId = (token as any)?.id
        if (userId) {
          await prisma.auditLog.create({
            data: {
              userId: userId,
              action: "SIGN_OUT",
              resource: "authentication",
              accessGranted: true,
              userRole: (token as any)?.role || "UNKNOWN",
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
  
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})