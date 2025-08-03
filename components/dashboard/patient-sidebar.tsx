'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  PillIcon,
  CalendarIcon,
  HeartIcon,
  UserIcon,
  DocumentTextIcon,
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  CameraIcon,
  PlusIcon,
  XMarkIcon,
  Bars3Icon,
  DownloadIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth-context'
import NotificationDrawer from './notification-drawer'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard/patient', icon: HomeIcon },
  { name: 'Medications', href: '/dashboard/patient/medications', icon: PillIcon },
  { name: 'Appointments', href: '/dashboard/patient/appointments', icon: CalendarIcon },
  { name: 'Vital Readings', href: '/dashboard/patient/vitals', icon: HeartIcon },
  { name: 'Symptoms', href: '/dashboard/patient/symptoms', icon: UserIcon },
  { name: 'Prescriptions', href: '/dashboard/patient/prescriptions', icon: DocumentTextIcon },
  { name: 'Profile', href: '/dashboard/patient/profile', icon: UserIcon },
  { name: 'Settings', href: '/dashboard/patient/settings', icon: CogIcon },
]

const quickActions = [
  { name: 'Record Symptom', href: '/dashboard/patient/symptoms/new', icon: CameraIcon },
  { name: 'Add Vital Reading', href: '/dashboard/patient/vitals/new', icon: PlusIcon },
  { name: 'View Prescriptions', href: '/dashboard/patient/prescriptions', icon: DownloadIcon },
]

export default function PatientSidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard/patient') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Healthcare Application</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-green-600">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Health Summary */}
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Today's Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Medications</span>
                <span className="text-green-600 font-medium">2/4 taken</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Vitals</span>
                <span className="text-yellow-600 font-medium">1 pending</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Adherence</span>
                <span className="text-green-600 font-medium">87%</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if (item.name === 'Settings') {
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setShowNotifications(true)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive(item.href)
                        ? 'bg-green-100 text-green-700 border-r-2 border-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <BellIcon
                      className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${isActive(item.href)
                          ? 'text-green-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `}
                    />
                    Notifications
                    <span className="ml-auto inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                )
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive(item.href)
                      ? 'bg-green-100 text-green-700 border-r-2 border-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive(item.href)
                        ? 'text-green-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                      }
                    `}
                  />
                  {item.name}
                </Link>
              )
            })}

            {/* Quick Actions */}
            <div className="pt-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </h3>
              <div className="mt-2 space-y-1">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <action.icon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                    {action.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="pt-6">
              <div className="px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                <h4 className="text-sm font-medium text-red-800">Emergency?</h4>
                <p className="text-xs text-red-600 mt-1">
                  Call your doctor immediately or contact emergency services
                </p>
                <button className="mt-2 w-full px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700">
                  Emergency Contact
                </button>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="space-y-2">
              <Link
                href="/privacy-policy"
                className="block text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy Policy
              </Link>
              <button
                onClick={logout}
                className="block w-full text-left text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Notification Drawer */}
        <NotificationDrawer 
          isOpen={showNotifications} 
          setIsOpen={setShowNotifications}
        />
      </div>
    </>
  )
}

export function SidebarToggle({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
      aria-label="Toggle sidebar"
    >
      <Bars3Icon className="w-6 h-6" />
    </button>
  )
}