'use client'

export const dynamic = 'force-dynamic'




import { BellIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/utils'

interface ReminderItem {
  id: string
  title: string
  description?: string
  scheduledFor: string
  status?: string
  priority?: string
}

export default function PatientRemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReminders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/reminders')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to load reminders')
      }
      setReminders(result.payload.data || [])
    } catch (err) {
      console.error('Failed to load reminders:', err)
      setError('Unable to load reminders')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchReminders}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <p className="text-sm text-gray-600 mt-1">Review your upcoming reminders</p>
      </div>

      {reminders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No reminders scheduled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map(reminder => (
            <div key={reminder.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900">{reminder.title}</h3>
                  {reminder.description && (
                    <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDateTime(reminder.scheduledFor)}
                  </p>
                </div>
                {reminder.status && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                    {reminder.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
