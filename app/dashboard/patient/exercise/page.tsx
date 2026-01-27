'use client'

import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/utils'

interface ExerciseLogEntry {
  id: string
  title: string
  description?: string
  loggedAt: string
  durationMinutes?: number | null
}

export default function PatientExercisePage() {
  const [entries, setEntries] = useState<ExerciseLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes, setNotes] = useState('')

  const fetchEntries = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/exercise')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to load exercise entries')
      }
      setEntries(result.payload.data || [])
    } catch (err) {
      console.error('Failed to load exercise entries:', err)
      setError('Unable to load exercise entries')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !durationMinutes) return
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/patient/exercise/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          durationMinutes: parseInt(durationMinutes),
          notes: notes.trim() || undefined
        })
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to log exercise entry')
      }
      setTitle('')
      setDurationMinutes('')
      setNotes('')
      fetchEntries()
    } catch (err) {
      console.error('Exercise log error:', err)
      setError('Unable to log exercise entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchEntries}
          className="mt-3 text-sm text-purple-600 hover:text-purple-700"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exercise Tracking</h1>
        <p className="text-sm text-gray-600 mt-1">Log workouts and review recent activity</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workout</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., 30 min brisk walk"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            type="number"
            min="1"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !durationMinutes}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Logging...' : 'Log workout'}
        </button>
      </form>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-600">
            No exercise entries logged yet.
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900">{entry.title}</h3>
                  {entry.description && <p className="text-sm text-gray-600 mt-1">{entry.description}</p>}
                  <p className="text-xs text-gray-500 mt-2">{formatDateTime(entry.loggedAt)}</p>
                </div>
                {entry.durationMinutes !== null && entry.durationMinutes !== undefined && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                    {entry.durationMinutes} min
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
