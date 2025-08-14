'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  BellIcon,
  UserIcon,
  DocumentTextIcon,
  CogIcon,
  HeartIcon,
  Bars3Icon,
  XMarkIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userRole: 'doctor' | 'hsp' | 'hospital_admin' | 'patient' | 'system_admin'
}

const navigationItems = {
  doctor: [
    { name: 'Dashboard', href: '/dashboard/doctor', icon: HomeIcon },
    { name: 'Patients', href: '/dashboard/doctor/patients', icon: UsersIcon },
    { name: 'Calendar', href: '/dashboard/doctor/calendar', icon: CalendarIcon },
    { name: 'Notifications', href: '/dashboard/doctor/notifications', icon: BellIcon },
    { name: 'Care Plan Templates', href: '/dashboard/doctor/templates', icon: DocumentTextIcon },
    { name: 'Services & Billing', href: '/dashboard/doctor/services', icon: CreditCardIcon },
    { name: 'Profile', href: '/dashboard/doctor/profile', icon: UserIcon },
    { name: 'Settings', href: '/dashboard/doctor/settings', icon: CogIcon },
  ],
  hsp: [
    { name: 'Dashboard', href: '/dashboard/hsp', icon: HomeIcon },
    { name: 'Patients', href: '/dashboard/hsp/patients', icon: UsersIcon },
    { name: 'Calendar', href: '/dashboard/hsp/calendar', icon: CalendarIcon },
    { name: 'Notifications', href: '/dashboard/hsp/notifications', icon: BellIcon },
    { name: 'Profile', href: '/dashboard/hsp/profile', icon: UserIcon },
    { name: 'Settings', href: '/dashboard/hsp/settings', icon: CogIcon },
  ],
  hospital_admin: [
    { name: 'Dashboard', href: '/dashboard/hospital', icon: HomeIcon },
    { name: 'Doctors & Staff', href: '/dashboard/hospital/staff', icon: UsersIcon },
    { name: 'Patients', href: '/dashboard/hospital/patients', icon: UsersIcon },
    { name: 'Organizations', href: '/dashboard/hospital/organizations', icon: HomeIcon },
    { name: 'Notifications', href: '/dashboard/hospital/notifications', icon: BellIcon },
    { name: 'Settings', href: '/dashboard/hospital/settings', icon: CogIcon },
  ],
  patient: [
    { name: 'Dashboard', href: '/dashboard/patient', icon: HomeIcon },
    { name: 'Medications', href: '/dashboard/patient/medications', icon: HeartIcon },
    { name: 'Appointments', href: '/dashboard/patient/appointments', icon: CalendarIcon },
    { name: 'Vitals', href: '/dashboard/patient/vitals', icon: HeartIcon },
    { name: 'Symptoms', href: '/dashboard/patient/symptoms', icon: DocumentTextIcon },
    { name: 'Profile', href: '/dashboard/patient/profile', icon: UserIcon },
    { name: 'Settings', href: '/dashboard/patient/settings', icon: CogIcon },
  ],
  system_admin: [
    { name: 'Dashboard', href: '/dashboard/admin', icon: HomeIcon },
    { name: 'Users', href: '/dashboard/admin/users', icon: UsersIcon },
    { name: 'Organizations', href: '/dashboard/admin/organizations', icon: HomeIcon },
    { name: 'System Settings', href: '/dashboard/admin/settings', icon: CogIcon },
    { name: 'Security', href: '/dashboard/admin/security', icon: ShieldCheckIcon },
  ],
}

export function Sidebar({ userRole }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, getDisplayName, getProfileImage, getFirstName, getLastName } = useAuth()

  const navigation = navigationItems[userRole] || navigationItems.doctor

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="bg-white p-2 rounded-md shadow-lg"
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <SidebarContent
              navigation={navigation}
              pathname={pathname}
              user={user}
              onLogout={() => {
                logout()
                setIsMobileMenuOpen(false)
              }}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
          <SidebarContent
            navigation={navigation}
            pathname={pathname}
            user={user}
            onLogout={logout}
          />
        </div>
      </div>
    </>
  )
}

interface SidebarContentProps {
  navigation: Array<{ name: string; href: string; icon: any }>
  pathname: string
  user: any
  onLogout: () => void
  onClose?: () => void
}

function SidebarContent({ navigation, pathname, user, onLogout, onClose }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Link href="/" className="flex items-center">
          <HeartIcon className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Healthcare Application</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1" aria-label="Close navigation menu">
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {getProfileImage() ? (
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={getProfileImage()!}
                alt={getDisplayName()}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">
                  {getFirstName()?.[0]}{getLastName()?.[0]}
                </span>
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {getDisplayName()}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role?.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}