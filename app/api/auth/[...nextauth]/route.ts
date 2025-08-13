import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              doctors: true,
              patients: true,
              hsps: true,
              providers: true
            }
          })

          if (!user) {
            console.log("User not found:", credentials.email)
            return null
          }

          if (user.account_status !== 'ACTIVE') {
            console.log("User account not active:", user.account_status)
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)
          
          if (!isValidPassword) {
            console.log("Invalid password for user:", credentials.email)
            return null
          }

          console.log("Authentication successful for user:", credentials.email)

          // Return user object that will be stored in the session
          return {
            id: user.id,
            email: user.email,
            name: user.full_name || `${user.first_name} ${user.last_name}`,
            role: user.role,
            image: user.profile_picture_url,
            emailVerified: user.email_verified,
            // Add profile data based on role
            profile: {
              firstName: user.first_name,
              lastName: user.last_name,
              phone: user.phone,
              dateOfBirth: user.date_of_birth,
              gender: user.gender,
              role: user.role,
              accountStatus: user.account_status,
              doctor: user.doctors?.[0] || null,
              patient: user.patients?.[0] || null,
              hsp: user.hsps?.[0] || null,
              provider: user.providers?.[0] || null
            }
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "database",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      // Include additional user data in session
      if (user && session.user) {
        session.user.id = user.id
        session.user.role = (user as any).role
        session.user.profile = (user as any).profile
      }
      return session
    },
    async jwt({ token, user }) {
      // Add user data to JWT token (only used for session strategy: "jwt")
      if (user) {
        token.role = (user as any).role
        token.profile = (user as any).profile
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard based on user role after login
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default redirect after successful login
      return `${baseUrl}/dashboard`
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }