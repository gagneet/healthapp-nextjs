'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  BellIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { formatDateTime } from '@/lib/utils'

interface NotificationDrawerProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

interface Notification {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  patient_name?: string
  patient_id?: string
  created_at: string
  read: boolean
  action_required?: boolean
  category: 'medication' | 'vital' | 'appointment' | 'system' | 'alert'
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Critical Medication Alert',
    message: 'Patient Jane Smith has missed 3 consecutive blood pressure medications',
    patient_name: 'Jane Smith',
    patient_id: '2',
    created_at: '2025-01-22T10:30:00Z',
    read: false,
    action_required: true,
    category: 'medication'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Vital Reading Alert',
    message: 'Blood pressure reading 165/95 mmHg exceeds normal range',
    patient_name: 'Michael Johnson',
    patient_id: '3',
    created_at: '2025-01-22T09:15:00Z',
    read: false,
    action_required: true,
    category: 'vital'
  },
  {
    id: '3',
    type: 'info',
    title: 'Appointment Reminder',
    message: 'Upcoming appointment with John Doe tomorrow at 10:00 AM',
    patient_name: 'John Doe',
    patient_id: '1',
    created_at: '2025-01-22T08:00:00Z',
    read: true,
    action_required: false,
    category: 'appointment'
  },
  {
    id: '4',
    type: 'success',
    title: 'Care Plan Completed',
    message: 'Sarah Wilson has successfully completed her 30-day medication adherence plan',
    patient_name: 'Sarah Wilson',
    patient_id: '4',
    created_at: '2025-01-21T16:45:00Z',
    read: true,
    action_required: false,
    category: 'medication'
  },
  {
    id: '5',
    type: 'warning',
    title: 'Missed Appointment',
    message: 'Patient Robert Brown missed scheduled appointment today',
    patient_name: 'Robert Brown',
    patient_id: '5',
    created_at: '2025-01-21T14:30:00Z',
    read: false,
    action_required: true,
    category: 'appointment'
  },
  {
    id: '6',
    type: 'info',
    title: 'System Update',
    message: 'New features available in your Healthcare Application dashboard',
    created_at: '2025-01-21T09:00:00Z',
    read: true,
    action_required: false,
    category: 'system'
  },
  {
    id: '7',
    type: 'critical',
    title: 'Emergency Alert',
    message: 'Patient Lisa Davis reported severe chest pain symptoms',
    patient_name: 'Lisa Davis',
    patient_id: '6',
    created_at: '2025-01-20T22:15:00Z',
    read: false,
    action_required: true,
    category: 'alert'
  }
]

function getTypeIcon(type: string) {
  switch (type) {
    case 'critical':
      return ExclamationTriangleIcon
    case 'warning':
      return ExclamationTriangleIcon
    case 'info':
      return InformationCircleIcon
    case 'success':
      return CheckCircleIcon
    default:
      return BellIcon
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'critical':
      return 'text-red-600 bg-red-100'
    case 'warning':
      return 'text-yellow-600 bg-yellow-100'
    case 'info':
      return 'text-blue-600 bg-blue-100'
    case 'success':
      return 'text-green-600 bg-green-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'medication':
      return 'bg-purple-100 text-purple-800'
    case 'vital':
      return 'bg-red-100 text-red-800'
    case 'appointment':
      return 'bg-blue-100 text-blue-800'
    case 'system':
      return 'bg-gray-100 text-gray-800'
    case 'alert':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function NotificationDrawer({ isOpen, setIsOpen }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read
      case 'critical':
        return notification.type === 'critical' || notification.action_required
      default:
        return true
    }
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const criticalCount = notifications.filter(n => n.type === 'critical').length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-gray-50 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center">
                            <BellIcon className="h-6 w-6 mr-2" />
                            Notifications
                            {unreadCount > 0 && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {unreadCount} new
                              </span>
                            )}
                          </Dialog.Title>
                          <p className="mt-1 text-sm text-gray-500">
                            Stay updated with patient alerts and system notifications
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-md bg-gray-50 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => setIsOpen(false)}
                          aria-label="Close notifications"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>

                      {/* Filter Tabs */}
                      <div className="mt-4">
                        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
                          {[
                            { key: 'all', label: 'All', count: notifications.length },
                            { key: 'unread', label: 'Unread', count: unreadCount },
                            { key: 'critical', label: 'Critical', count: criticalCount },
                          ].map((tab) => (
                            <button
                              key={tab.key}
                              onClick={() => setFilter(tab.key as any)}
                              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                filter === tab.key
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              {tab.label}
                              {tab.count > 0 && (
                                <span className="ml-1 text-xs">({tab.count})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      {unreadCount > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="flex-1 px-4 py-6 sm:px-6">
                      {filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {filter === 'all' 
                              ? "You're all caught up!" 
                              : `No ${filter} notifications at this time.`
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredNotifications.map((notification) => {
                            const Icon = getTypeIcon(notification.type)
                            return (
                              <div
                                key={notification.id}
                                className={`relative rounded-lg border p-4 transition-colors ${
                                  notification.read
                                    ? 'border-gray-200 bg-white'
                                    : 'border-blue-200 bg-blue-50'
                                }`}
                              >
                                {/* Priority indicator */}
                                {!notification.read && (
                                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}

                                <div className="flex items-start space-x-3">
                                  <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                                    <Icon className="h-5 w-5" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <p className={`text-sm font-medium ${
                                          notification.read ? 'text-gray-900' : 'text-gray-900'
                                        }`}>
                                          {notification.title}
                                        </p>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getCategoryColor(notification.category)}`}>
                                          {notification.category}
                                        </span>
                                      </div>
                                    </div>

                                    <p className={`mt-1 text-sm ${
                                      notification.read ? 'text-gray-600' : 'text-gray-700'
                                    }`}>
                                      {notification.message}
                                    </p>

                                    {notification.patient_name && (
                                      <p className="mt-1 text-xs text-gray-500">
                                        Patient: {notification.patient_name}
                                      </p>
                                    )}

                                    <div className="mt-2 flex items-center justify-between">
                                      <p className="text-xs text-gray-500">
                                        {formatDateTime(notification.created_at)}
                                      </p>

                                      <div className="flex items-center space-x-2">
                                        {notification.action_required && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            Action Required
                                          </span>
                                        )}

                                        <div className="flex items-center space-x-1">
                                          {!notification.read && (
                                            <button
                                              onClick={() => markAsRead(notification.id)}
                                              className="p-1 rounded text-gray-400 hover:text-blue-600"
                                              title="Mark as read"
                                              aria-label="Mark as read"
                                            >
                                              <EyeIcon className="h-4 w-4" />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => deleteNotification(notification.id)}
                                            className="p-1 rounded text-gray-400 hover:text-red-600"
                                            title="Delete notification"
                                            aria-label="Delete notification"
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Quick Actions */}
                                    {notification.patient_id && notification.action_required && (
                                      <div className="mt-3 flex space-x-2">
                                        <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200">
                                          View Patient
                                        </button>
                                        <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                                          Send Reminder
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          Showing {filteredNotifications.length} of {notifications.length} notifications
                        </p>
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          View All Notifications
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}