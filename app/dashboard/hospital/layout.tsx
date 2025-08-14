'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
// Removed withAuth import - using RouteGuardLayout instead

interface HospitalLayoutProps {
  children: ReactNode
}

function HospitalLayout({ children }: HospitalLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="hospital_admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default HospitalLayout