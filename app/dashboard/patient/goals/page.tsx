'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { FlagIcon } from '@heroicons/react/24/outline'

interface HealthGoal {
  id: string
  category: string
  title: string
  description?: string | null
  targetValue?: number | null
  currentValue?: number | null
  unit?: string | null
  status: string
  targetDate?: string | null
}

export default function PatientGoalsPage() {
  const [goals, setGoals] = useState<HealthGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('CUSTOM')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState('')

  const fetchGoals = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/goals')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load goals')
      }
      setGoals(data.payload?.data || [])
    } catch (err) {
      console.error('Failed to load goals:', err)
      setError('Unable to load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const handleCreateGoal = async () => {
    if (!title.trim()) return
    try {
      const response = await fetch('/api/patient/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          targetValue: targetValue ? Number(targetValue) : undefined,
          unit: unit || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to create goal')
      }
      setTitle('')
      setTargetValue('')
      setUnit('')
      fetchGoals()
    } catch (err) {
      console.error('Failed to create goal:', err)
      setError('Unable to create goal')
    }
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
        <button onClick={fetchGoals} className="mt-3 text-sm text-blue-600 hover:text-blue-700">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FlagIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Health Goals</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Create new goal</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Goal title"
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            {['WEIGHT', 'BLOOD_PRESSURE', 'BLOOD_SUGAR', 'EXERCISE', 'NUTRITION', 'MEDICATION_ADHERENCE', 'SLEEP', 'STRESS', 'CUSTOM'].map((value) => (
              <option key={value} value={value}>{value.replace('_', ' ')}</option>
            ))}
          </select>
          <input
            value={targetValue}
            onChange={(event) => setTargetValue(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Target value"
          />
          <input
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Unit"
          />
        </div>
        <button onClick={handleCreateGoal} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          No goals added yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900">{goal.title}</p>
              <p className="text-xs text-gray-500">Category: {goal.category}</p>
              <p className="text-xs text-gray-500">Status: {goal.status}</p>
              <p className="text-xs text-gray-500">Progress: {goal.currentValue ?? 0} / {goal.targetValue ?? 'N/A'} {goal.unit || ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
