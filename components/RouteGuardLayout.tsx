'use client'

import { useRouteGuard } from '@/hooks/useRouteGuard'
import { ReactNode } from 'react'

interface RouteGuardLayoutProps {
  children: ReactNode
}

export default function RouteGuardLayout({ children }: RouteGuardLayoutProps) {
  // The route guard hook will automatically handle redirects
  useRouteGuard()
  
  return <>{children}</>
}