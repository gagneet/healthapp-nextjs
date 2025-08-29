// lib/enhancedAuth.ts - Enhanced Authentication Context with Refresh Tokens
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User, AuthState, LoginCredentials } from '@/types/auth'
import { apiRequest } from '@/lib/api'
import toast from 'react-hot-toast'
import { createLogger } from './logger'

interface EnhancedAuthState extends AuthState {
  refreshToken?: string
  sessionId?: string
  expiresAt?: Date
  refreshExpiresAt?: Date
  lastActivity?: Date
}

interface EnhancedAuthContextType extends EnhancedAuthState {
  login: (credentials: LoginCredentials & { rememberMe?: boolean }) => Promise<boolean>
  logout: (logoutAll?: boolean) => Promise<void>
  refreshAccessToken: () => Promise<boolean>
  validateToken: () => Promise<boolean>
  getActiveSessions: () => Promise<any[]>
  updateProfile: (data: Partial<User>) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string, logoutOtherSessions?: boolean) => Promise<boolean>
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined)

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider')
  }
  return context
}

interface EnhancedAuthProviderProps {
  children: ReactNode
}

const logger = createLogger('EnhancedAuth')

export const EnhancedAuthProvider: React.FC<EnhancedAuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<EnhancedAuthState>({
    user: null,
    token: null,
    refreshToken: undefined,
    sessionId: undefined,
    isLoading: true,
    isAuthenticated: false,
    expiresAt: undefined,
    refreshExpiresAt: undefined,
    lastActivity: new Date(),
  })

  // Token refresh queue to prevent multiple simultaneous requests
  const [refreshPromise, setRefreshPromise] = useState<Promise<boolean> | null>(null)

  // Store tokens securely
  const storeTokens = useCallback((tokenData: any, userData: User) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (tokenData.expiresIn * 1000))
    const refreshExpiresAt = new Date(now.getTime() + (tokenData.refreshExpiresIn * 1000))

    localStorage.setItem('accessToken', tokenData.accessToken)
    localStorage.setItem('refreshToken', tokenData.refreshToken)
    localStorage.setItem('sessionId', tokenData.sessionId)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('expiresAt', expiresAt.toISOString())
    localStorage.setItem('refreshExpiresAt', refreshExpiresAt.toISOString())

    setState({
      user: userData,
      token: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      sessionId: tokenData.sessionId,
      isLoading: false,
      isAuthenticated: true,
      expiresAt,
      refreshExpiresAt,
      lastActivity: now,
    })
  }, [])

  // Clear stored tokens
  const clearTokens = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('sessionId')
    localStorage.removeItem('user')
    localStorage.removeItem('expiresAt')
    localStorage.removeItem('refreshExpiresAt')

    setState({
      user: null,
      token: null,
      refreshToken: undefined,
      sessionId: undefined,
      isLoading: false,
      isAuthenticated: false,
      expiresAt: undefined,
      refreshExpiresAt: undefined,
      lastActivity: new Date(),
    })
  }, [])

  // Check if token is expired or will expire soon
  const isTokenExpired = useCallback((token: string | null, bufferMinutes = 2): boolean => {
    if (!token) return true
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expirationTime = payload.exp * 1000
      const bufferTime = bufferMinutes * 60 * 1000
      return Date.now() >= (expirationTime - bufferTime)
    } catch {
      return true
    }
  }, [])

  // Refresh access token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous refresh requests
    if (refreshPromise) {
      return refreshPromise
    }

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      clearTokens()
      return false
    }

    const promise = (async (): Promise<boolean> => {
      try {
        logger.debug('Refreshing access token...')
        
        const response = await apiRequest.post('/auth/enhanced/refresh-token', {
          refreshToken
        })

        if ((response as any).status && (response as any).payload?.data?.tokens) {
          const { tokens, user } = (response as any).payload.data
          storeTokens(tokens, user)
          logger.info('Token refreshed successfully')
          return true
        } else {
          logger.warn('Token refresh failed:', (response as any).payload?.message)
          clearTokens()
          return false
        }
      } catch (error) {
        logger.error('Token refresh error:', error)
        clearTokens()
        return false
      } finally {
        setRefreshPromise(null)
      }
    })()

    setRefreshPromise(promise)
    return promise
  }, [clearTokens, storeTokens, refreshPromise])

  // Get valid access token (refresh if needed)
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const token = localStorage.getItem('accessToken')
    
    if (!token || isTokenExpired(token)) {
      const refreshed = await refreshAccessToken()
      return refreshed ? localStorage.getItem('accessToken') : null
    }
    
    return token
  }, [isTokenExpired, refreshAccessToken])

  // Enhanced login
  const login = useCallback(async (credentials: LoginCredentials & { rememberMe?: boolean }): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      const deviceInfo = {
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        screen: `${screen.width}x${screen.height}`,
      }

      const response = await apiRequest.post('/auth/enhanced/enhanced-sign-in', {
        ...credentials,
        deviceInfo
      })
      
      if ((response as any).status && (response as any).payload?.data) {
        const { tokens, user } = (response as any).payload.data
        storeTokens(tokens, user)
        
        logger.info('Enhanced login successful')
        toast.success(`Welcome back, ${user.firstName || user.email}!`)
        return true
      } else {
        logger.warn('Login failed:', (response as any).payload?.message)
        setState(prev => ({ ...prev, isLoading: false }))
        toast.error((response as any).payload?.message || 'Login failed')
        return false
      }
    } catch (error) {
      logger.error('Login error:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      toast.error('Network error occurred')
      return false
    }
  }, [storeTokens])

  // Enhanced logout
  const logout = useCallback(async (logoutAll = false): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (refreshToken) {
        await apiRequest.post('/auth/enhanced/enhanced-logout', {
          refreshToken,
          logoutAll
        })
      }
      
      logger.info('Logout successful')
      toast.success(logoutAll ? 'Logged out from all devices' : 'Logged out successfully')
    } catch (error) {
      logger.error('Logout error:', error)
    } finally {
      clearTokens()
    }
  }, [clearTokens])

  // Validate current token
  const validateToken = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getValidToken()
      if (!token) return false

      const response = await apiRequest.get('/auth/enhanced/validate-token')
      
      if ((response as any).status && (response as any).payload?.data?.user) {
        const userData = (response as any).payload.data.user
        setState(prev => ({
          ...prev,
          user: userData,
          lastActivity: new Date()
        }))
        return true
      }
      
      return false
    } catch (error) {
      logger.error('Token validation error:', error)
      return false
    }
  }, [getValidToken])

  // Get active sessions
  const getActiveSessions = useCallback(async (): Promise<any[]> => {
    try {
      const response = await apiRequest.get('/auth/enhanced/active-sessions')
      
      if ((response as any).status && (response as any).payload?.data?.sessions) {
        return (response as any).payload.data.sessions
      }
      
      return []
    } catch (error) {
      logger.error('Get sessions error:', error)
      return []
    }
  }, [])

  // Update user profile
  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await apiRequest.put('/auth/enhanced/profile', data)
      
      if ((response as any).status && (response as any).payload?.data?.user) {
        setState(prev => ({
          ...prev,
          user: (response as any).payload.data.user
        }))
        
        // Update stored user data
        localStorage.setItem('user', JSON.stringify((response as any).payload.data.user))
        
        toast.success('Profile updated successfully')
        return true
      }
      
      toast.error((response as any).payload?.message || 'Profile update failed')
      return false
    } catch (error) {
      logger.error('Profile update error:', error)
      toast.error('Network error occurred')
      return false
    }
  }, [])

  // Change password
  const changePassword = useCallback(async (
    currentPassword: string, 
    newPassword: string, 
    logoutOtherSessions = false
  ): Promise<boolean> => {
    try {
      const response = await apiRequest.post('/auth/enhanced/change-password', {
        currentPassword,
        newPassword,
        logoutOtherSessions
      })
      
      if ((response as any).status) {
        toast.success('Password changed successfully')
        
        if (logoutOtherSessions) {
          (toast as any).info('Other sessions have been logged out')
        }
        
        return true
      }
      
      toast.error((response as any).payload?.message || 'Password change failed')
      return false
    } catch (error) {
      logger.error('Password change error:', error)
      toast.error('Network error occurred')
      return false
    }
  }, [])

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')
        const userString = localStorage.getItem('user')
        const expiresAtString = localStorage.getItem('expiresAt')
        const refreshExpiresAtString = localStorage.getItem('refreshExpiresAt')
        const sessionId = localStorage.getItem('sessionId')

        if (token && refreshToken && userString) {
          const user = JSON.parse(userString) as User
          const expiresAt = expiresAtString ? new Date(expiresAtString) : undefined
          const refreshExpiresAt = refreshExpiresAtString ? new Date(refreshExpiresAtString) : undefined

          // Check if refresh token is still valid
          if (refreshExpiresAt && refreshExpiresAt > new Date()) {
            setState({
              user,
              token,
              refreshToken: refreshToken || undefined,
              sessionId: sessionId || undefined,
              isLoading: false,
              isAuthenticated: true,
              expiresAt,
              refreshExpiresAt,
              lastActivity: new Date(),
            })

            // Validate token if needed
            if (isTokenExpired(token)) {
              await refreshAccessToken()
            }
            
            return
          }
        }
        
        // No valid tokens found
        clearTokens()
      } catch (error) {
        logger.error('Auth initialization error:', error)
        clearTokens()
      }
    }

    initializeAuth()
  }, [isTokenExpired, refreshAccessToken, clearTokens])

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!state.isAuthenticated || !state.expiresAt) return

    const timeUntilExpiry = state.expiresAt.getTime() - Date.now()
    const refreshBuffer = 2 * 60 * 1000 // 2 minutes

    if (timeUntilExpiry > refreshBuffer) {
      const timer = setTimeout(() => {
        refreshAccessToken()
      }, timeUntilExpiry - refreshBuffer)

      return () => clearTimeout(timer)
    }
  }, [state.isAuthenticated, state.expiresAt, refreshAccessToken])

  const value: EnhancedAuthContextType = {
    ...state,
    login,
    logout,
    refreshAccessToken,
    validateToken,
    getActiveSessions,
    updateProfile,
    changePassword,
  }

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  )
}

// Export enhanced auth hook for convenience
export { useEnhancedAuth as useAuth }

// Higher-order component for protected routes
export const withEnhancedAuth = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: string[]
) => {
  return function EnhancedAuthenticatedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useEnhancedAuth()

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