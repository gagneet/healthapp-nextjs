'use client'

import { ReactNode, useState } from 'react'
import DoctorSidebar, { SidebarToggle } from '@/components/dashboard/doctor-sidebar'
import { withAuth } from '@/lib/auth-context'
import RouteGuardLayout from '@/components/RouteGuardLayout'

interface DoctorLayoutProps {
  children: ReactNode
}

function DoctorLayout({ children }: DoctorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <RouteGuardLayout>
      <div className="flex h-screen bg-gray-50">
        <DoctorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Top bar for mobile */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <SidebarToggle isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <h1 className="text-lg font-semibold text-gray-900">Healthcare Application</h1>
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </RouteGuardLayout>
  )
}

export default withAuth(DoctorLayout, ['DOCTOR'])