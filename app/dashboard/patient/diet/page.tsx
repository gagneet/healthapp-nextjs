'use client'

export const dynamic = 'force-dynamic'




import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/utils'

interface DietLogEntry {
  id: string
  title: string
  description?: string
  loggedAt: string
  calories?: number | null
  mealType?: string | null
}

interface DietPlan {
  id: string
  name: string
  description?: string | null
  targetCalories?: number | null
  targetProtein?: number | null
  targetCarbs?: number | null
  targetFat?: number | null
  targetFiber?: number | null
  targetWater?: number | null
  restrictions?: string[] | null
  startDate?: string | null
  endDate?: string | null
  meals?: Array<{
    id: string
    mealType: string
    scheduledTime: string
    name: string
    description?: string | null
    targetCalories?: number | null
  }>
}

interface NutritionSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export default function PatientDietPage() {
  const [entries, setEntries] = useState<DietLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')
  const [mealType, setMealType] = useState('LUNCH')
  const [plan, setPlan] = useState<DietPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [summary, setSummary] = useState<NutritionSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const fetchEntries = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/diet')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to load diet entries')
      }
      setEntries(result.payload.data || [])
    } catch (err) {
      console.error('Failed to load diet entries:', err)
      setError('Unable to load diet entries')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
    fetchPlan()
    fetchSummary()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
    try {
      const trimmedTitle = title.trim()
      const response = await fetch('/api/patient/diet/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          mealType,
          calories: calories ? parseInt(calories, 10) : undefined,
          notes: notes.trim() || undefined
        })
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to log diet entry')
      }
      setTitle('')
      setMealType('LUNCH')
      setCalories('')
      setNotes('')
      fetchEntries()
      fetchSummary()
    } catch (err) {
      console.error('Diet log error:', err)
      setError('Unable to log diet entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchPlan = async () => {
    setPlanLoading(true)
    setPlanError(null)
    try {
      const response = await fetch('/api/patient/diet/plan')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to load diet plan')
      }
      setPlan(result.payload.data || null)
    } catch (err) {
      console.error('Failed to load diet plan:', err)
      setPlanError('Unable to load diet plan')
    } finally {
      setPlanLoading(false)
    }
  }

  const fetchSummary = async () => {
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const response = await fetch('/api/patient/diet/nutrition-summary')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to load nutrition summary')
      }
      setSummary(result.payload.data || null)
    } catch (err) {
      console.error('Failed to load nutrition summary:', err)
      setSummaryError('Unable to load nutrition summary')
    } finally {
      setSummaryLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
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
          className="mt-3 text-sm text-green-600 hover:text-green-700"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Diet Tracking</h1>
        <p className="text-sm text-gray-600 mt-1">Log meals and review recent entries</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Diet Plan</h2>
          {planLoading ? (
            <p className="text-sm text-gray-500">Loading diet plan...</p>
          ) : planError ? (
            <p className="text-sm text-red-600">{planError}</p>
          ) : plan ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{plan.name}</p>
                {plan.description && <p className="text-sm text-gray-600">{plan.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div>Calories: {plan.targetCalories ?? '—'}</div>
                <div>Protein: {plan.targetProtein ?? '—'} g</div>
                <div>Carbs: {plan.targetCarbs ?? '—'} g</div>
                <div>Fat: {plan.targetFat ?? '—'} g</div>
              </div>
              {plan.restrictions && plan.restrictions.length > 0 && (
                <div className="text-xs text-gray-500">
                  Restrictions: {plan.restrictions.join(', ')}
                </div>
              )}
              {plan.meals && plan.meals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Planned Meals</p>
                  {plan.meals.map((meal) => (
                    <div key={meal.id} className="text-sm text-gray-600 flex items-center justify-between">
                      <span>{meal.mealType.replace('_', ' ').toLowerCase()} · {meal.name}</span>
                      <span>{meal.scheduledTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active diet plan.</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Today’s Nutrition Summary</h2>
          {summaryLoading ? (
            <p className="text-sm text-gray-500">Loading summary...</p>
          ) : summaryError ? (
            <p className="text-sm text-red-600">{summaryError}</p>
          ) : summary ? (
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-green-700">{summary.calories}</div>
                <div className="text-xs text-green-600">Calories</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-blue-700">{summary.protein} g</div>
                <div className="text-xs text-blue-600">Protein</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-purple-700">{summary.carbs} g</div>
                <div className="text-xs text-purple-600">Carbs</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-yellow-700">{summary.fat} g</div>
                <div className="text-xs text-yellow-600">Fat</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No nutrition summary available.</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meal summary</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., Breakfast - Oatmeal and fruit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meal type</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="MORNING_SNACK">Morning Snack</option>
            <option value="LUNCH">Lunch</option>
            <option value="AFTERNOON_SNACK">Afternoon Snack</option>
            <option value="DINNER">Dinner</option>
            <option value="EVENING_SNACK">Evening Snack</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Calories (optional)</label>
          <input
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            type="number"
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., 450"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Logging...' : 'Log meal'}
        </button>
      </form>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-600">
            No diet entries logged yet.
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900">{entry.title}</h3>
                  {entry.mealType && (
                    <p className="text-xs text-gray-500 mt-1">
                      {entry.mealType.replace('_', ' ').toLowerCase()}
                    </p>
                  )}
                  {entry.description && <p className="text-sm text-gray-600 mt-1">{entry.description}</p>}
                  <p className="text-xs text-gray-500 mt-2">{formatDateTime(entry.loggedAt)}</p>
                </div>
                {entry.calories !== null && entry.calories !== undefined && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                    {entry.calories} cal
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
