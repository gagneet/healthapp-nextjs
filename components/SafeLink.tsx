'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useRouteGuard } from '@/hooks/useRouteGuard'
import { createLogger } from '@/lib/logger'
import { ReactNode, MouseEvent } from 'react'
import toast from 'react-hot-toast'

const logger = createLogger('SafeLink')

interface SafeLinkProps {
  href: string
  children: ReactNode
  className?: string
  fallbackBehavior?: 'dashboard' | 'toast' | 'none'
  [key: string]: any
}

export default function SafeLink({ 
  href, 
  children, 
  className, 
  fallbackBehavior = 'dashboard',
  ...props 
}: SafeLinkProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { isRouteImplemented, getDashboardForRole } = useRouteGuard()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    logger.debug('SafeLink clicked:', href)

    // Check if route is implemented
    if (!isRouteImplemented(href)) {
      logger.warn(`Route ${href} not implemented for user role ${user?.role}`)
      
      switch (fallbackBehavior) {
        case 'dashboard':
          const dashboardRoute = user ? getDashboardForRole(user.role) : '/dashboard'
          toast.error('This feature is not yet available. Redirecting to dashboard.')
          router.push(dashboardRoute)
          break
        
        case 'toast':
          toast.error('This feature is not yet implemented.')
          break
        
        case 'none':
        default:
          // Do nothing
          break
      }
      return
    }

    // Route is implemented, navigate normally
    router.push(href)
  }

  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  )
}