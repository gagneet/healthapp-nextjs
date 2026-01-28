'use client'

export const dynamic = 'force-dynamic'




// Force dynamic rendering for authenticated pages

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  HeartIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface VitalReading {
  id: string
  vitalType: string
  value: number
  unit: string
  recordedAt: string
  status: 'normal' | 'warning' | 'critical'
  notes?: string
  systolic?: number
  diastolic?: number
}

interface VitalTrend {
  vitalType: string
  current: number
  previous: number
  change: number
  change_percent: number
  trend: 'up' | 'down' | 'stable'
}

export default function VitalsPage() {
  const { user } = useAuth()
  const [vitals, setVitals] = useState<VitalReading[]>([])
  const [trends, setTrends] = useState<VitalTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedVital, setSelectedVital] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [systolicValue, setSystolicValue] = useState('')
  const [diastolicValue, setDiastolicValue] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const vitalTypes = [
    { id: 'blood_pressure', name: 'Blood Pressure', unit: 'mmHg', hasDouble: true },
    { id: 'heart_rate', name: 'Heart Rate', unit: 'bpm', hasDouble: false },
    { id: 'temperature', name: 'Temperature', unit: '°F', hasDouble: false },
    { id: 'weight', name: 'Weight', unit: 'lbs', hasDouble: false },
    { id: 'blood_glucose', name: 'Blood Glucose', unit: 'mg/dL', hasDouble: false },
    { id: 'oxygen_saturation', name: 'Oxygen Saturation', unit: '%', hasDouble: false },
  ]

  useEffect(() => {
    fetchVitals()
    fetchTrends()
  }, [])

  const fetchVitals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/vitals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setVitals(data.payload?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch vitals:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    try {
      const response = await fetch('/api/patient/vitals/trends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setTrends(data.payload?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error)
    }
  }

  const handleSaveVital = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedVital) return
    const selected = vitalTypes.find((type) => type.id === selectedVital)
    if (!selected) return

    try {
      setSaving(true)
      const response = await fetch('/api/vital-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to load vital types')
      }
      const data = await response.json()
      const vitalType = Array.isArray(data.payload?.data)
        ? data.payload.data.find((type: { id: string; name: string }) =>
          type.name.toLowerCase().includes(selected.id.replace('_', ' '))
        )
        : null
      if (!vitalType) {
        throw new Error('Vital type not found')
      }

      const payload: {
        vitalTypeId: string
        value?: number
        unit?: string
        systolicValue?: number
        diastolicValue?: number
        notes?: string
      } = {
        vitalTypeId: vitalType.id,
        unit: selected.unit,
        notes: notes.trim() || undefined,
      }

      if (selected.hasDouble) {
        payload.systolicValue = systolicValue ? Number(systolicValue) : undefined
        payload.diastolicValue = diastolicValue ? Number(diastolicValue) : undefined
      } else {
        payload.value = inputValue ? Number(inputValue) : undefined
      }

      const saveResponse = await fetch('/api/patient/vitals/record', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save vital')
      }

      setShowAddForm(false)
      setSelectedVital('')
      setInputValue('')
      setSystolicValue('')
      setDiastolicValue('')
      setNotes('')
      await fetchVitals()
      await fetchTrends()
    } catch (error) {
      console.error('Failed to save vital:', error)
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: VitalReading['status']) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: VitalReading['status']) => {
    switch (status) {
      case 'critical':
        return <ExclamationTriangleIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  const getTrendIcon = (trend: VitalTrend['trend']) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" />
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
    }
  }

  const formatVitalValue = (vital: VitalReading) => {
    if (vital.vitalType === 'blood_pressure' && vital.systolic && vital.diastolic) {
      return `${vital.systolic}/${vital.diastolic} ${vital.unit}`
    }
    return `${vital.value} ${vital.unit}`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <HeartIcon className="w-8 h-8 mr-3 text-red-600" />
            Vital Readings
          </h1>
          <p className="text-gray-600 mt-1">Track and monitor your health vitals</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Record Vital
        </button>
      </div>

      {/* Trends Overview */}
      {trends.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trends.slice(0, 3).map((trend) => (
              <div key={trend.vitalType} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {trend.vitalType.replace('_', ' ')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{trend.current}</p>
                    <p className="text-xs text-gray-500">vs previous: {trend.previous}</p>
                  </div>
                  <div className="flex items-center">
                    {getTrendIcon(trend.trend)}
                    <span className={`ml-2 text-sm font-medium ${
                      trend.change_percent > 0 ? 'text-red-600' : trend.change_percent < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {trend.change_percent > 0 ? '+' : ''}{trend.change_percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vitals List */}
      <div className="space-y-4">
        {vitals.length === 0 ? (
          <div className="text-center py-12">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vital readings yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start recording your vital signs to track your health progress.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Record First Vital
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Readings</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {vitals.slice(0, 10).map((vital) => (
                <div key={vital.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900 capitalize">
                          {vital.vitalType.replace('_', ' ')}
                        </h4>
                        <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vital.status)}`}>
                          {getStatusIcon(vital.status)}
                          <span className="ml-1 capitalize">{vital.status}</span>
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-600">
                        <span className="font-semibold text-lg text-gray-900 mr-2">
                          {formatVitalValue(vital)}
                        </span>
                        <span className="mr-4">•</span>
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {new Date(vital.recordedAt).toLocaleDateString()}
                        <span className="mx-2">•</span>
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {new Date(vital.recordedAt).toLocaleTimeString()}
                      </div>
                      {vital.notes && (
                        <p className="mt-2 text-sm text-gray-600">{vital.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Record Vital Sign</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={handleSaveVital}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vital Type
                </label>
                <select
                  value={selectedVital}
                  onChange={(e) => setSelectedVital(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select vital type</option>
                  {vitalTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVital && (
                <>
                    {vitalTypes.find(t => t.id === selectedVital)?.hasDouble ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Systolic
                        </label>
                          <input
                            type="number"
                            value={systolicValue}
                            onChange={(event) => setSystolicValue(event.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="120"
                          />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Diastolic
                        </label>
                          <input
                            type="number"
                            value={diastolicValue}
                            onChange={(event) => setDiastolicValue(event.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="80"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Value ({vitalTypes.find(t => t.id === selectedVital)?.unit})
                      </label>
                        <input
                          type="number"
                          step="0.1"
                          value={inputValue}
                          onChange={(event) => setInputValue(event.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter value"
                        />
                      </div>
                    )}

                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any additional notes..."
                      />
                    </div>
                  </>
                )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={saving || !selectedVital}
                >
                  {saving ? 'Saving...' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
