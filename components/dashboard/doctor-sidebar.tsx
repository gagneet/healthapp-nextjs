'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import SafeLink from '@/components/SafeLink'
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  BellIcon,
  UserIcon,
  DocumentTextIcon,
  CogIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  PlusIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth-context'
import { userHelpers } from '@/lib/auth'
import NotificationDrawer from './notification-drawer'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard/doctor', icon: HomeIcon },
  { name: 'Patients', href: '/dashboard/doctor/patients', icon: UsersIcon },
  { name: 'Calendar', href: '/dashboard/doctor/calendar', icon: CalendarIcon },
  { name: 'Notifications', href: '/dashboard/doctor/notifications', icon: BellIcon },
  { name: 'Profile', href: '/dashboard/doctor/profile', icon: UserIcon },
  { name: 'Care Plan Templates', href: '/dashboard/doctor/templates', icon: DocumentTextIcon },
  { name: 'Subscriptions & Services', href: '/dashboard/doctor/services', icon: CreditCardIcon },
  { name: 'Settings', href: '/dashboard/doctor/settings', icon: CogIcon },
]

const quickActions = [
  { name: 'Add Patient', href: '/dashboard/doctor/patients/new', icon: PlusIcon },
  { name: 'Create Template', href: '/dashboard/doctor/templates/new', icon: DocumentTextIcon },
  { name: 'Schedule Appointment', href: '/dashboard/doctor/appointments/new', icon: CalendarIcon },
]

export default function DoctorSidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout, getDisplayName, getFirstName, getLastName } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard/doctor') {
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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
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
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {getFirstName()?.[0]}{getLastName()?.[0]}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Dr. {userHelpers.getLastName(user) || userHelpers.getFirstName(user)}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if (item.name === 'Notifications') {
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
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${isActive(item.href)
                          ? 'text-blue-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `}
                    />
                    {item.name}
                    <span className="ml-auto inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                )
              }
              
              return (
                <SafeLink
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive(item.href)
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                  fallbackBehavior="toast"
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive(item.href)
                        ? 'text-blue-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                      }
                    `}
                  />
                  {item.name}
                </SafeLink>
              )
            })}

            {/* Quick Actions */}
            <div className="pt-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </h3>
              <div className="mt-2 space-y-1">
                {quickActions.map((action) => (
                  <SafeLink
                    key={action.name}
                    href={action.href}
                    className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    onClick={() => setIsOpen(false)}
                    fallbackBehavior="toast"
                  >
                    <action.icon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                    {action.name}
                  </SafeLink>
                ))}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="space-y-2">
              <SafeLink
                href="/privacy-policy"
                className="block text-xs text-gray-500 hover:text-gray-700 transition-colors"
                fallbackBehavior="toast"
              >
                Privacy Policy
              </SafeLink>
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