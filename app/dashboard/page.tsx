'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('DashboardRedirect')

/**
 * Generic /dashboard page that redirects to role-specific dashboards
 * This page should not be accessed directly - it's a fallback for when
 * users navigate to /dashboard without specifying their role
 */
export default function DashboardRedirectPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') {
      logger.debug('Session loading...')
      return
    }

    // If not authenticated, redirect to login
    if (status === 'unauthenticated' || !session?.user) {
      logger.warn('User not authenticated, redirecting to login')
      router.push('/auth/login')
      return
    }

    // Redirect based on user role
    const role = session.user.role
    logger.info('Redirecting user based on role:', role)

    switch (role) {
      case 'DOCTOR':
        router.push('/dashboard/doctor')
        break
      case 'PATIENT':
        router.push('/dashboard/patient')
        break
      case 'HOSPITAL_ADMIN':
        router.push('/dashboard/hospital')
        break
      case 'SYSTEM_ADMIN':
      case 'ADMIN':
        router.push('/dashboard/admin')
        break
      case 'HSP':
        // HSP dashboard not yet implemented, redirect to hospital dashboard temporarily
        logger.warn('HSP dashboard not implemented, redirecting to hospital dashboard')
        router.push('/dashboard/hospital')
        break
      default:
        logger.error('Unknown user role:', role)
        router.push('/auth/login?error=invalid_role')
        break
    }
  }, [session, status, router])

  // Loading state while determining redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  )
}
