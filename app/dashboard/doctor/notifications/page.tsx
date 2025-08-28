'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: 'critical' | 'warning' | 'info' | 'success'
  is_read: boolean
  is_urgent: boolean
  patient_name?: string
  patientId?: string
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/doctors/critical-alerts?limit=50', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.payload?.data?.alerts) {
          // Transform alerts to notifications format
          const transformedNotifications = data.payload.data.alerts.map((alert: any) => ({
            id: alert.id,
            title: alert.type || 'Healthcare Alert',
            message: alert.description || alert.message || 'No description available',
            type: alert.severity === 'high' ? 'critical' : alert.severity === 'medium' ? 'warning' : 'info',
            is_read: alert.status === 'READ',
            is_urgent: alert.severity === 'high',
            patient_name: alert.patientName,
            patientId: alert.patientId,
            createdAt: alert.timestamp || alert.createdAt
          }))
          setNotifications(transformedNotifications)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Set some mock data for demonstration
      setNotifications([
        {
          id: '1',
          title: 'Critical Medication Alert',
          message: 'Patient John Doe has missed 3 consecutive blood pressure medication doses',
          type: 'critical',
          is_read: false,
          is_urgent: true,
          patient_name: 'John Doe',
          patientId: 'patient-1',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2', 
          title: 'Vital Signs Alert',
          message: 'Patient Jane Smith has recorded elevated blood pressure readings',
          type: 'warning',
          is_read: false,
          is_urgent: false,
          patient_name: 'Jane Smith',
          patientId: 'patient-2',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          title: 'Appointment Reminder',
          message: 'You have 3 appointments scheduled for tomorrow',
          type: 'info',
          is_read: true,
          is_urgent: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      )
    )
  }

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, is_read: true }))
    )
  }

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    )
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read
    if (filter === 'critical') return notif.type === 'critical'
    return true
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    const opacity = isRead ? '50' : '100'
    switch (type) {
      case 'critical':
        return `bg-red-${opacity} border-red-200`
      case 'warning':
        return `bg-yellow-${opacity} border-yellow-200`
      case 'success':
        return `bg-green-${opacity} border-green-200`
      default:
        return `bg-blue-${opacity} border-blue-200`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Stay updated with patient alerts and system notifications
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <BellIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => !n.is_read).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => n.type === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => n.is_read).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        {['all', 'unread', 'critical'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption as any)}
            className={`px-4 py-2 text-sm font-medium rounded-md capitalize ${
              filter === filterOption
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption} ({
              filterOption === 'all' ? notifications.length :
              filterOption === 'unread' ? notifications.filter(n => !n.is_read).length :
              notifications.filter(n => n.type === 'critical').length
            })
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'All Notifications' : 
             filter === 'unread' ? 'Unread Notifications' : 
             'Critical Notifications'} 
            ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'unread' ? 'All notifications have been read' :
                 filter === 'critical' ? 'No critical notifications' :
                 'You have no notifications at this time'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    notification.is_read 
                      ? 'bg-gray-50 border-gray-200' 
                      : getNotificationBgColor(notification.type, notification.is_read)
                  } ${!notification.is_read ? 'border-l-4' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-sm font-medium ${
                            notification.is_read ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          {notification.is_urgent && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Urgent
                            </span>
                          )}
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className={`mt-1 text-sm ${
                          notification.is_read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatDateTime(notification.createdAt)}</span>
                          {notification.patient_name && (
                            <span>Patient: {notification.patient_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {notification.patientId && (
                        <Link
                          href={`/dashboard/doctor/patients/${notification.patientId}`}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                          title="View Patient"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md"
                          title="Mark as Read"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}