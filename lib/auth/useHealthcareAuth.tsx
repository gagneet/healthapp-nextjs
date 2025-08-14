/**
 * Healthcare Authentication React Hook
 * Provides authentication state and methods for React components
 */

"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface HealthcareUser {
  id: string
  email: string
  name: string
  role: string
  accountStatus: string
  permissions: Record<string, boolean>
  lastLoginAt: string | null
  profileData?: any
}

interface HealthcareAuthState {
  user: HealthcareUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface HealthcareAuthContextType extends HealthcareAuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const HealthcareAuthContext = createContext<HealthcareAuthContextType | undefined>(undefined)

export function HealthcareAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HealthcareAuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  // Check session on mount and set up periodic refresh
  useEffect(() => {
    checkSession()
    
    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/healthcare/session", {
        credentials: "include"
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true
          })
          return
        }
      }
      
      // No valid session
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    } catch (error) {
      console.error("Session check failed:", error)
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/healthcare/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      
      if (data.success) {
        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true
        })
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("Login failed:", error)
      return { success: false, error: "Login failed. Please try again." }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/healthcare/logout", {
        method: "POST",
        credentials: "include"
      })
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }
  }

  const refreshSession = async () => {
    await checkSession()
  }

  return (
    <HealthcareAuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshSession
      }}
    >
      {children}
    </HealthcareAuthContext.Provider>
  )
}

export function useHealthcareAuth() {
  const context = useContext(HealthcareAuthContext)
  if (context === undefined) {
    throw new Error("useHealthcareAuth must be used within a HealthcareAuthProvider")
  }
  return context
}

/**
 * Hook to require authentication (redirects to login if not authenticated)
 */
export function useRequireAuth() {
  const auth = useHealthcareAuth()
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login page
      window.location.href = "/auth/signin"
    }
  }, [auth.isLoading, auth.isAuthenticated])

  return auth
}

/**
 * Hook to require specific role
 */
export function useRequireRole(allowedRoles: string[]) {
  const auth = useRequireAuth()
  
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && auth.user) {
      if (!allowedRoles.includes(auth.user.role)) {
        // Redirect to unauthorized page
        window.location.href = "/unauthorized"
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, allowedRoles])

  return auth
}

/**
 * Hook to check specific permission
 */
export function usePermission(permission: string) {
  const auth = useHealthcareAuth()
  
  return {
    ...auth,
    hasPermission: auth.user?.permissions[permission] ?? false
  }
}