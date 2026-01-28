'use client'

export const dynamic = 'force-dynamic'




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

interface ExercisePlan {
  id: string
  name: string
  description?: string | null
  weeklyGoalMinutes?: number | null
  weeklyGoalSessions?: number | null
  restrictions?: string[] | null
  startDate?: string | null
  endDate?: string | null
  scheduledWorkouts?: Array<{
    id: string
    dayOfWeek: number
    name: string
    description?: string | null
    targetDuration: number
  }>
}

interface ActivitySummary {
  totalSteps?: number | null
  totalDistance?: number | null
  totalCaloriesBurned?: number | null
  activeMinutes?: number | null
  sedentaryMinutes?: number | null
  flightsClimbed?: number | null
  restingHeartRate?: number | null
}

export default function PatientExercisePage() {
  const [entries, setEntries] = useState<ExerciseLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [intensity, setIntensity] = useState('MODERATE')
  const [plan, setPlan] = useState<ExercisePlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [activityForm, setActivityForm] = useState<ActivitySummary>({
    totalSteps: 0,
    totalDistance: 0,
    totalCaloriesBurned: 0,
    activeMinutes: 0,
    sedentaryMinutes: 0,
    flightsClimbed: 0,
    restingHeartRate: 0
  })
  const [activitySaving, setActivitySaving] = useState(false)

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
    fetchPlan()
    fetchActivity()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !durationMinutes) return
    setIsSubmitting(true)
    try {
      const trimmedTitle = title.trim()
      const response = await fetch('/api/patient/exercise/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          durationMinutes: parseInt(durationMinutes, 10),
          intensity,
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
      setIntensity('MODERATE')
      fetchEntries()
      fetchActivity()
    } catch (err) {
      console.error('Exercise log error:', err)
      setError('Unable to log exercise entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchPlan = async () => {
    setPlanLoading(true)
    setPlanError(null)
    try {
      const response = await fetch('/api/patient/exercise/plan')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to load exercise plan')
      }
      setPlan(result.payload.data || null)
    } catch (err) {
      console.error('Failed to load exercise plan:', err)
      setPlanError('Unable to load exercise plan')
    } finally {
      setPlanLoading(false)
    }
  }

  const fetchActivity = async () => {
    setActivityLoading(true)
    setActivityError(null)
    try {
      const response = await fetch('/api/patient/exercise/activity')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to load activity summary')
      }
      const summary = result.payload.data || null
      setActivity(summary)
      if (summary) {
        setActivityForm({
          totalSteps: summary.totalSteps ?? 0,
          totalDistance: summary.totalDistance ?? 0,
          totalCaloriesBurned: summary.totalCaloriesBurned ?? 0,
          activeMinutes: summary.activeMinutes ?? 0,
          sedentaryMinutes: summary.sedentaryMinutes ?? 0,
          flightsClimbed: summary.flightsClimbed ?? 0,
          restingHeartRate: summary.restingHeartRate ?? 0,
        })
      }
    } catch (err) {
      console.error('Failed to load activity summary:', err)
      setActivityError('Unable to load activity summary')
    } finally {
      setActivityLoading(false)
    }
  }

  const handleActivityChange = (field: keyof ActivitySummary, value: string) => {
    const numericValue = value === '' ? undefined : Number(value)
    setActivityForm((prev) => ({
      ...prev,
      [field]: Number.isNaN(numericValue) ? prev[field] : numericValue
    }))
  }

  const handleActivitySave = async () => {
    setActivitySaving(true)
    setActivityError(null)
    try {
      const payload = {
        totalSteps: activityForm.totalSteps ?? undefined,
        totalDistance: activityForm.totalDistance ?? undefined,
        totalCaloriesBurned: activityForm.totalCaloriesBurned ?? undefined,
        activeMinutes: activityForm.activeMinutes ?? undefined,
        sedentaryMinutes: activityForm.sedentaryMinutes ?? undefined,
        flightsClimbed: activityForm.flightsClimbed ?? undefined,
        restingHeartRate: activityForm.restingHeartRate ?? undefined,
      }
      const response = await fetch('/api/patient/exercise/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to update activity summary')
      }
      setActivity(result.payload.data || null)
    } catch (err) {
      console.error('Failed to update activity summary:', err)
      setActivityError('Unable to update activity summary')
    } finally {
      setActivitySaving(false)
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Exercise Plan</h2>
          {planLoading ? (
            <p className="text-sm text-gray-500">Loading exercise plan...</p>
          ) : planError ? (
            <p className="text-sm text-red-600">{planError}</p>
          ) : plan ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{plan.name}</p>
                {plan.description && <p className="text-sm text-gray-600">{plan.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div>Weekly Minutes: {plan.weeklyGoalMinutes ?? '—'}</div>
                <div>Weekly Sessions: {plan.weeklyGoalSessions ?? '—'}</div>
              </div>
              {plan.restrictions && plan.restrictions.length > 0 && (
                <div className="text-xs text-gray-500">
                  Restrictions: {plan.restrictions.join(', ')}
                </div>
              )}
              {plan.scheduledWorkouts && plan.scheduledWorkouts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Scheduled Workouts</p>
                  {plan.scheduledWorkouts.map((workout) => (
                    <div key={workout.id} className="text-sm text-gray-600">
                      Day {workout.dayOfWeek + 1}: {workout.name} · {workout.targetDuration} min
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active exercise plan.</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Today’s Activity Summary</h2>
          {activityLoading ? (
            <p className="text-sm text-gray-500">Loading activity summary...</p>
          ) : activityError ? (
            <p className="text-sm text-red-600">{activityError}</p>
          ) : activity ? (
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-purple-700">{activity.totalSteps ?? 0}</div>
                <div className="text-xs text-purple-600">Steps</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-green-700">{activity.activeMinutes ?? 0}</div>
                <div className="text-xs text-green-600">Active Minutes</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-blue-700">{activity.totalDistance ?? 0} km</div>
                <div className="text-xs text-blue-600">Distance</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-yellow-700">{activity.totalCaloriesBurned ?? 0}</div>
                <div className="text-xs text-yellow-600">Calories</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No activity summary available.</p>
          )}
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Steps</label>
                <input
                  type="number"
                  value={activityForm.totalSteps ?? 0}
                  onChange={(e) => handleActivityChange('totalSteps', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Distance (km)</label>
                <input
                  type="number"
                  value={activityForm.totalDistance ?? 0}
                  onChange={(e) => handleActivityChange('totalDistance', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Active Minutes</label>
                <input
                  type="number"
                  value={activityForm.activeMinutes ?? 0}
                  onChange={(e) => handleActivityChange('activeMinutes', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Calories Burned</label>
                <input
                  type="number"
                  value={activityForm.totalCaloriesBurned ?? 0}
                  onChange={(e) => handleActivityChange('totalCaloriesBurned', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleActivitySave}
              disabled={activitySaving}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              {activitySaving ? 'Saving...' : 'Update Summary'}
            </button>
          </div>
        </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Intensity</label>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="LOW">Low</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High</option>
            <option value="VERY_HIGH">Very high</option>
          </select>
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
