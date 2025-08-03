'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { withAuth } from '@/lib/auth-context'

interface PatientLayoutProps {
  children: ReactNode
}

function PatientLayout({ children }: PatientLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="patient" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default withAuth(PatientLayout, ['PATIENT'])