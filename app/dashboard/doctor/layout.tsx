'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { withAuth } from '@/lib/auth-context'

interface DoctorLayoutProps {
  children: ReactNode
}

function DoctorLayout({ children }: DoctorLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="doctor" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default withAuth(DoctorLayout, ['DOCTOR'])