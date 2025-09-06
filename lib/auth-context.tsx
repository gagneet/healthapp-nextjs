'use client'

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useSession, SessionProvider, signOut, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TransitionUser, userHelpers, HealthcareRole } from '@/types/auth'

interface AuthContextType {
  user: TransitionUser | null
  loading: boolean
  isAuthenticated: boolean
  
  // ✅ Authentication methods
  login: (credentials: { email: string; password: string }) => Promise<boolean>
  logout: () => Promise<void>
  
  // ✅ Convenience methods with fallbacks
  getDisplayName: () => string
  getProfileImage: () => string | null
  getFirstName: () => string
  getLastName: () => string
  isEmailVerified: () => boolean
  
  // ✅ Healthcare-specific methods
  hasRole: (role: HealthcareRole) => boolean
  canPrescribe: () => boolean
  canAccessPatients: () => boolean
  canManageProviders: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  )
}

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<TransitionUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      // ✅ Map session user to TransitionUser with backward compatibility
      const mappedUser: TransitionUser = {
        // Auth.js v5 standard fields
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        emailVerified: session.user.emailVerified,
        
        // Healthcare-specific fields
        role: session.user.role,
        businessId: session.user.businessId,
        profileId: session.user.profileId,
        accountStatus: session.user.accountStatus,
        organizationId: session.user.organizationId,
        profileData: session.user.profileData,
        
        // Healthcare permissions
        canPrescribeMedication: session.user.canPrescribeMedication,
        canAccessPatientData: session.user.canAccessPatientData,
        canManageProviders: session.user.canManageProviders,
        canViewAllPatients: session.user.canViewAllPatients,
        
        // ✅ Legacy fields for backward compatibility
        full_name: session.user.full_name || session.user.name,
        profilePictureUrl: session.user.profilePictureUrl || session.user.image,
        firstName: session.user.firstName || session.user.name?.split(' ')[0],
        lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' '),
        email_verified: session.user.emailVerified ? true : false
      }
      
      setUser(mappedUser)
    } else {
      setUser(null)
    }
  }, [session])

  const contextValue: AuthContextType = {
    user,
    loading: status === 'loading',
    isAuthenticated: !!user,
    
    // ✅ Authentication methods
    login: async (credentials: { email: string; password: string }) => {
      try {
        const result = await signIn('credentials', {
          email: credentials.email,
          password: credentials.password,
          redirect: false
        })
        
        if (result?.error) {
          console.error('Login error:', result.error)
          return false
        }
        
        return result?.ok || false
      } catch (error) {
        console.error('Login error:', error)
        return false
      }
    },
    
    logout: async () => {
      try {
        // ✅ Clear all auth-related local storage
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('authToken')
            localStorage.removeItem('user')
          }
        } catch (storageError) {
          console.error("Failed to clear local storage:", storageError)
        }

        await signOut({ redirect: false })
        router.push('/auth/signin')
      } catch (error) {
        console.error('Logout error:', error)
        // Force redirect to signin page even if signOut fails
        router.push('/auth/signin')
      }
    },
    
    // ✅ Convenience methods with fallbacks
    getDisplayName: () => user ? userHelpers.getDisplayName(user) : '',
    getProfileImage: () => user ? userHelpers.getProfileImage(user) : null,
    getFirstName: () => user ? userHelpers.getFirstName(user) : '',
    getLastName: () => user ? userHelpers.getLastName(user) : '',
    isEmailVerified: () => user ? userHelpers.isEmailVerified(user) : false,
    
    // ✅ Healthcare-specific methods
    hasRole: (role: HealthcareRole) => user?.role === role,
    canPrescribe: () => user?.canPrescribeMedication || false,
    canAccessPatients: () => user?.canAccessPatientData || false,
    canManageProviders: () => user?.canManageProviders || false
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ✅ Legacy hook for backward compatibility
export function useUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}