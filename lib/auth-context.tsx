'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, AuthState, LoginCredentials, RegisterData } from '@/types/auth'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { createLogger } from './logger'

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

const logger = createLogger('AuthProvider')

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const userString = localStorage.getItem('user')

        if (token && userString) {
          const user = JSON.parse(userString) as User
          
          try {
            // Try to verify token is still valid
            const response = await authAPI.verifyToken()
            if (response.success && response.data) {
              setState({
                user: response.data.user,
                token,
                isLoading: false,
                isAuthenticated: true,
              })
              logger.info('Token verification successful')
              return
            } else {
              logger.warn('Token verification failed:', response.message)
            }
          } catch (verifyError) {
            logger.warn('Token verification error, but continuing with stored data:', verifyError)
            // If verification fails due to network issues, but we have stored data, use it
            setState({
              user,
              token,
              isLoading: false,
              isAuthenticated: true,
            })
            return
          }
          
          // Only clear storage if verification explicitly failed (not network error)
          logger.info('Clearing invalid auth data')
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
        }
        
        // No token or token verification failed
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        })
      } catch (error) {
        logger.error('Auth initialization error:', error)
        // Don't clear storage on initialization error - might be network issue
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      const response = await authAPI.login(credentials)
      logger.debug('Login response:', response)
      
      if (response.success && response.data) {
        const { user, token } = response.data
        logger.debug('Login successful, user:', user)
        logger.debug('Token:', token)
        
        // Store in localStorage
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        })
        
        logger.info('Auth state updated, isAuthenticated: true')
        toast.success(`Welcome back, ${user.first_name || user.email}!`)
        return true
      } else {
        logger.warn('Login failed:', response.message)
        setState(prev => ({ ...prev, isLoading: false }))
        toast.error(response.message || 'Login failed')
        return false
      }
    } catch (error) {
      logger.error('Login error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      toast.error('Network error occurred')
      return false
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      const response = await authAPI.register(data)
      
      if (response.success && response.data) {
        const { user, token } = response.data
        
        // Store in localStorage
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        })
        
        toast.success('Account created successfully!')
        return true
      } else {
        setState(prev => ({ ...prev, isLoading: false }))
        toast.error(response.message || 'Registration failed')
        return false
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      toast.error('Network error occurred')
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout()
    } catch (error) {
      logger.error('Logout error:', error)
    } finally {
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      })
      toast.success('Logged out successfully')
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authAPI.verifyToken()
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data!.user,
        }))
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
    } catch (error) {
      logger.error('User refresh error:', error)
    }
  }

  const value: AuthContextType = {
    ...state,
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
        window.location.href = '/auth/login'
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