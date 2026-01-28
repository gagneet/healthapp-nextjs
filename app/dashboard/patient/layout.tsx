'use client'

export const dynamic = 'force-dynamic'




import { ReactNode, useState } from 'react'
import PatientSidebar, { SidebarToggle } from '@/components/dashboard/patient-sidebar'

// Removed withAuth import - using RouteGuardLayout instead

interface PatientLayoutProps {
  children: ReactNode
}

function PatientLayout({ children }: PatientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <PatientSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <SidebarToggle isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
          <h1 className="text-lg font-semibold text-gray-900">Healthcare Patient</h1>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default PatientLayout
