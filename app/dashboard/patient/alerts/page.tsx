'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BellAlertIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  CalendarIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { BellAlertIcon as BellAlertSolidIcon } from '@heroicons/react/24/solid'

interface Alert {
  id: string
  type: string
  category: string
  title: string
  message: string
  isRead: boolean
  priority: string
  actionUrl?: string | null
  metadata?: any
  createdAt: string
  source: string
}

interface AlertSummary {
  total: number
  unread: number
  byCategory: Record<string, { total: number; unread: number }>
}

export default function PatientAlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [acknowledging, setAcknowledging] = useState<string | null>(null)

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.set('type', selectedCategory)
      }
      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus)
      }

      const response = await fetch(`/api/patient/alerts?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load alerts')
      }

      setAlerts(data.payload?.data?.alerts || [])
      setSummary(data.payload?.data?.summary || null)
    } catch (err) {
      console.error('Failed to load alerts:', err)
      setError('Unable to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [selectedCategory, selectedStatus])

  const handleAcknowledge = async (alertId: string, actionUrl?: string | null) => {
    setAcknowledging(alertId)
    try {
      const response = await fetch(`/api/patient/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert')
      }

      // Refresh alerts
      await fetchAlerts()

      // Navigate to action URL if provided
      if (actionUrl) {
        router.push(actionUrl)
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err)
      setError('Unable to acknowledge alert')
    } finally {
      setAcknowledging(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      medication: HeartIcon,
      appointment: CalendarIcon,
      vital: HeartIcon,
      lab_result: BeakerIcon,
      emergency: ExclamationTriangleIcon,
      care_plan: DocumentTextIcon,
      message: ChatBubbleLeftRightIcon,
      general: InformationCircleIcon
    }
    return iconMap[category] || InformationCircleIcon
  }

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      medication: 'text-blue-600 bg-blue-100',
      appointment: 'text-green-600 bg-green-100',
      vital: 'text-purple-600 bg-purple-100',
      lab_result: 'text-indigo-600 bg-indigo-100',
      emergency: 'text-red-600 bg-red-100',
      care_plan: 'text-yellow-600 bg-yellow-100',
      message: 'text-gray-600 bg-gray-100',
      general: 'text-gray-600 bg-gray-100'
    }
    return colorMap[category] || 'text-gray-600 bg-gray-100'
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high' || priority === 'critical') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          {priority === 'critical' ? 'URGENT' : 'High'}
        </span>
      )
    }
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchAlerts}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BellAlertIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert Center</h1>
            <p className="text-sm text-gray-500">
              {summary?.unread || 0} unread of {summary?.total || 0} total alerts
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { key: 'all', label: 'All', count: summary?.total || 0, unread: summary?.unread || 0 },
          { key: 'medication', label: 'Medication', count: summary?.byCategory?.medication?.total || 0, unread: summary?.byCategory?.medication?.unread || 0 },
          { key: 'appointment', label: 'Appointments', count: summary?.byCategory?.appointment?.total || 0, unread: summary?.byCategory?.appointment?.unread || 0 },
          { key: 'vital', label: 'Vitals', count: summary?.byCategory?.vital?.total || 0, unread: summary?.byCategory?.vital?.unread || 0 },
          { key: 'lab_result', label: 'Lab Results', count: summary?.byCategory?.lab_result?.total || 0, unread: summary?.byCategory?.lab_result?.unread || 0 },
          { key: 'emergency', label: 'Emergency', count: summary?.byCategory?.emergency?.total || 0, unread: summary?.byCategory?.emergency?.unread || 0 },
          { key: 'message', label: 'Messages', count: summary?.byCategory?.message?.total || 0, unread: summary?.byCategory?.message?.unread || 0 }
        ].map((cat) => {
          const Icon = getCategoryIcon(cat.key === 'all' ? 'general' : cat.key)
          const isSelected = selectedCategory === cat.key
          const colorClass = getCategoryColor(cat.key === 'all' ? 'general' : cat.key)

          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`inline-flex p-2 rounded-full mb-2 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-900">{cat.label}</p>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <span className="text-lg font-bold text-gray-900">{cat.count}</span>
                {cat.unread > 0 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {cat.unread}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-3">
        <FunnelIcon className="h-5 w-5 text-gray-400" />
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <BellAlertSolidIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No alerts to display</p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try changing your filters'
                : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = getCategoryIcon(alert.category)
            const colorClass = getCategoryColor(alert.category)
            const isAcknowledging = acknowledging === alert.id

            return (
              <div
                key={alert.id}
                className={`bg-white border rounded-lg p-4 transition-all ${
                  alert.isRead ? 'border-gray-200' : 'border-blue-300 bg-blue-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {alert.title}
                          </h3>
                          {getPriorityBadge(alert.priority)}
                          {!alert.isRead && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          <span className="inline-flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatDate(alert.createdAt)}
                          </span>
                          <span className="capitalize">{alert.category.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {!alert.isRead && (
                      <div className="flex items-center space-x-2 mt-3">
                        <button
                          onClick={() => handleAcknowledge(alert.id, alert.actionUrl)}
                          disabled={isAcknowledging}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isAcknowledging ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                              {alert.actionUrl ? 'View & Acknowledge' : 'Acknowledge'}
                            </>
                          )}
                        </button>
                        {alert.actionUrl && (
                          <button
                            onClick={() => router.push(alert.actionUrl!)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
