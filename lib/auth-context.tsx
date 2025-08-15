'use client'

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useSession, SessionProvider } from 'next-auth/react'
import { TransitionUser, userHelpers, HealthcareRole } from '@/types/auth'

interface AuthContextType {
  user: TransitionUser | null
  loading: boolean
  isAuthenticated: boolean
  
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
        profile_picture_url: session.user.profile_picture_url || session.user.image,
        first_name: session.user.first_name || session.user.name?.split(' ')[0],
        last_name: session.user.last_name || session.user.name?.split(' ').slice(1).join(' '),
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