'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useEffect } from 'react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('RouteGuard')

// Define implemented routes for each user role
const IMPLEMENTED_ROUTES = {
  DOCTOR: [
    '/dashboard/doctor',
    '/dashboard/doctor/profile',
    '/dashboard/doctor/calendar',
    '/dashboard/doctor/patients',
    '/dashboard/doctor/patients/new',
    '/dashboard/doctor/patients/[id]',
    '/dashboard/doctor/patients/[id]/care-plan/new',
    '/dashboard/doctor/patients/[id]/care-plan/template',
    '/dashboard/doctor/templates',
    '/dashboard/doctor/services',
    '/dashboard/doctor/settings'
  ],
  PATIENT: [
    '/dashboard/patient'
  ],
  HOSPITAL_ADMIN: [
    '/dashboard/hospital',
    '/dashboard/hospital/staff',
    '/dashboard/hospital/patients',
    '/dashboard/hospital/organizations'
  ],
  SYSTEM_ADMIN: [
    '/dashboard/admin',
    '/dashboard/admin/medicines',
    '/dashboard/admin/conditions',
    '/dashboard/admin/treatments'
  ],
  ADMIN: [
    '/dashboard/admin',
    '/dashboard/admin/medicines',
    '/dashboard/admin/conditions',
    '/dashboard/admin/treatments',
    '/dashboard/admin/doctors'
  ]
}

// Common routes accessible to all authenticated users
const COMMON_ROUTES = [
  '/dashboard',
  '/auth/login',
  '/'
]

export function useRouteGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // Don't run guard while loading
    if (loading) return

    logger.debug('Route guard checking path:', pathname)

    // Allow access to common routes
    if (COMMON_ROUTES.includes(pathname)) {
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      logger.warn('Unauthenticated access attempt to:', pathname)
      router.push('/auth/login')
      return
    }

    // Check if route is implemented for user's role
    if (user) {
      const userRoutes = IMPLEMENTED_ROUTES[user.role as keyof typeof IMPLEMENTED_ROUTES] || []
      const allImplementedRoutes = [...COMMON_ROUTES, ...userRoutes]
      
      // Check exact match first
      if (allImplementedRoutes.includes(pathname)) {
        return
      }

      // Check dynamic routes (with [id] patterns)
      const isDynamicRouteImplemented = userRoutes.some(route => {
        if (route.includes('[id]')) {
          const pattern = route.replace(/\[id\]/g, '[^/]+')
          const regex = new RegExp(`^${pattern}$`)
          return regex.test(pathname)
        }
        return false
      })

      if (isDynamicRouteImplemented) {
        return
      }

      // Route not implemented for this user role
      logger.warn(`Route ${pathname} not implemented for role ${user.role}`)
      
      // Redirect to appropriate dashboard
      const defaultDashboard = getDashboardForRole(user.role)
      router.push(defaultDashboard)
    }
  }, [pathname, user, isAuthenticated, loading, router])

  return {
    isRouteImplemented: (path: string) => {
      if (!user) return false
      
      const userRoutes = IMPLEMENTED_ROUTES[user.role as keyof typeof IMPLEMENTED_ROUTES] || []
      const allImplementedRoutes = [...COMMON_ROUTES, ...userRoutes]
      
      return allImplementedRoutes.includes(path) || 
        userRoutes.some(route => {
          if (route.includes('[id]')) {
            const pattern = route.replace(/\[id\]/g, '[^/]+')
            const regex = new RegExp(`^${pattern}$`)
            return regex.test(path)
          }
          return false
        })
    },
    getDashboardForRole
  }
}

function getDashboardForRole(role: string): string {
  switch (role) {
    case 'DOCTOR':
      return '/dashboard/doctor'
    case 'PATIENT':
      return '/dashboard/patient'
    case 'HOSPITAL_ADMIN':
      return '/dashboard/hospital'
    case 'SYSTEM_ADMIN':
    case 'ADMIN':
      return '/dashboard/admin'
    default:
      return '/dashboard'
  }
}