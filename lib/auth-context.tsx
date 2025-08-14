'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { User, AuthState, LoginCredentials, RegisterData } from '@/types/auth'
import toast from 'react-hot-toast'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status } = useSession()

  // Convert NextAuth session to our auth state format
  const authState: AuthState = {
    user: session?.user ? {
      id: session.user.id!,
      email: session.user.email!,
      first_name: session.user.name?.split(' ')[0] || '',
      last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
      full_name: session.user.name || '',
      role: session.user.role || 'PATIENT',
      account_status: session.user.accountStatus || 'ACTIVE',
      profile_picture_url: session.user.image,
      businessId: session.user.businessId,
      profileId: session.user.profileId,
      organizationId: session.user.organizationId,
      profileData: session.user.profileData,
      // Healthcare permissions
      canPrescribeMedication: session.user.canPrescribeMedication || false,
      canAccessPatientData: session.user.canAccessPatientData || false,
      canManageProviders: session.user.canManageProviders || false,
      canViewAllPatients: session.user.canViewAllPatients || false,
    } as User : null,
    token: null, // NextAuth uses httpOnly cookies, no client-side token
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error)
        return false
      }

      if (result?.ok) {
        toast.success('Login successful!')
        return true
      }

      toast.error('Login failed')
      return false
    } catch (error) {
      toast.error('Network error occurred')
      return false
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      // For now, redirect to custom healthcare auth for registration
      // since NextAuth credentials provider doesn't handle registration
      toast.info('Registration not implemented with NextAuth yet')
      return false
    } catch (error) {
      toast.error('Network error occurred')
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/auth/signin'
      })
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const refreshUser = async (): Promise<void> => {
    // NextAuth handles session refresh automatically
    // No manual refresh needed
  }

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: string[]
) => {
  return function AuthenticatedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin'
      }
      return null
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}