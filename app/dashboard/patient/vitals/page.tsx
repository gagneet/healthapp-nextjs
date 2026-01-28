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

interface VitalType {
  id: string
  name: string
  unit: string
  normalRangeMin: number | null
  normalRangeMax: number | null
  description: string | null
  isCompound: boolean
}

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

interface VitalAlert {
  id: string
  vitalType: string
  value: number | null
  alertLevel: 'WARNING' | 'CRITICAL' | 'EMERGENCY'
  recordedAt: string
}

export default function VitalsPage() {
  const { user } = useAuth()
  const [vitals, setVitals] = useState<VitalReading[]>([])
  const [trends, setTrends] = useState<VitalTrend[]>([])
  const [vitalTypes, setVitalTypes] = useState<VitalType[]>([])
  const [loading, setLoading] = useState(true)
  const [vitalTypesLoading, setVitalTypesLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedVitalTypeId, setSelectedVitalTypeId] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [systolicValue, setSystolicValue] = useState('')
  const [diastolicValue, setDiastolicValue] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [alerts, setAlerts] = useState<VitalAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [alertsError, setAlertsError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVitalTypes()
    fetchVitals()
    fetchTrends()
    fetchAlerts()
  }, [])

  const fetchVitalTypes = async () => {
    try {
      setVitalTypesLoading(true)
      const response = await fetch('/api/patient/vitals/types')
      if (!response.ok) {
        throw new Error('Failed to load vital types')
      }
      const data = await response.json()
      setVitalTypes(data.payload?.data || [])
    } catch (error) {
      console.error('Failed to fetch vital types:', error)
      setError('Failed to load vital types. Please refresh the page.')
    } finally {
      setVitalTypesLoading(false)
    }
  }

  const fetchVitals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/vitals')
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
      const response = await fetch('/api/patient/vitals/trends')
      if (response.ok) {
        const data = await response.json()
        setTrends(data.payload?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error)
    }
  }

  const fetchAlerts = async () => {
    setAlertsLoading(true)
    setAlertsError(null)
    try {
      const response = await fetch('/api/patient/vitals/alerts')
      const data = await response.json()
      if (response.ok) {
        setAlerts(data.payload?.data || [])
      } else {
        setAlertsError(data.payload?.error?.message || 'Failed to load alerts')
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
      setAlertsError('Unable to load vital alerts')
    } finally {
      setAlertsLoading(false)
    }
  }

  const handleSaveVital = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedVitalTypeId) {
      setError('Please select a vital type')
      return
    }

    const selectedType = vitalTypes.find(vt => vt.id === selectedVitalTypeId)
    if (!selectedType) {
      setError('Invalid vital type selected')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload: {
        vitalTypeId: string
        value?: number
        unit?: string
        systolicValue?: number
        diastolicValue?: number
        notes?: string
      } = {
        vitalTypeId: selectedType.id,
        unit: selectedType.unit,
        notes: notes.trim() || undefined,
      }

      if (selectedType.isCompound) {
        // Blood Pressure requires systolic and diastolic
        if (!systolicValue || !diastolicValue) {
          throw new Error('Both systolic and diastolic values are required for Blood Pressure')
        }
        payload.systolicValue = Number(systolicValue)
        payload.diastolicValue = Number(diastolicValue)
      } else {
        // Regular vital sign
        if (!inputValue) {
          throw new Error(`Please enter a value for ${selectedType.name}`)
        }
        payload.value = Number(inputValue)
      }

      const response = await fetch('/api/patient/vitals/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.payload?.error?.message || 'Failed to save vital')
      }

      // Success - reset form and refresh data
      setShowAddForm(false)
      setSelectedVitalTypeId('')
      setInputValue('')
      setSystolicValue('')
      setDiastolicValue('')
      setNotes('')

      // Refresh all data
      await Promise.all([
        fetchVitals(),
        fetchTrends(),
        fetchAlerts()
      ])

    } catch (error) {
      console.error('Error recording vitals:', error)
      setError(error instanceof Error ? error.message : 'Failed to record vital signs')
    } finally {
      setSaving(false)
    }
  }

  const selectedVitalType = vitalTypes.find(vt => vt.id === selectedVitalTypeId)

  if (vitalTypesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading vital types...</p>
      </div>
    )
  }

  if (vitalTypes.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">System Configuration Required</h3>
        <p className="text-red-700">
          No vital types are configured in the system. Please contact your system administrator to seed the vital types.
        </p>
        <p className="text-sm text-red-600 mt-2">
          Run: <code className="bg-red-100 px-2 py-1 rounded">PGPASSWORD='secure_pg_password' psql -h /var/run/postgresql -U healthapp_user -d healthapp_prod -f scripts/seed-vital-types-sql.sql</code>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HeartIcon className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vital Signs</h1>
            <p className="text-sm text-gray-500">Track and monitor your health metrics</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Record Vital
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vital Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Vital Sign</h3>
          <form onSubmit={handleSaveVital} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vital Type
              </label>
              <select
                value={selectedVitalTypeId}
                onChange={(e) => {
                  setSelectedVitalTypeId(e.target.value)
                  setInputValue('')
                  setSystolicValue('')
                  setDiastolicValue('')
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select vital type...</option>
                {vitalTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.unit})
                  </option>
                ))}
              </select>
              {selectedVitalType && selectedVitalType.normalRangeMin !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  Normal range: {selectedVitalType.normalRangeMin} - {selectedVitalType.normalRangeMax} {selectedVitalType.unit}
                </p>
              )}
            </div>

            {selectedVitalType && (
              <>
                {selectedVitalType.isCompound ? (
                  // Blood Pressure (compound)
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Systolic (top number)
                      </label>
                      <input
                        type="number"
                        value={systolicValue}
                        onChange={(e) => setSystolicValue(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="120"
                        required
                        min="0"
                        max="300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diastolic (bottom number)
                      </label>
                      <input
                        type="number"
                        value={diastolicValue}
                        onChange={(e) => setDiastolicValue(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="80"
                        required
                        min="0"
                        max="200"
                      />
                    </div>
                  </div>
                ) : (
                  // Regular vital sign
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value ({selectedVitalType.unit})
                    </label>
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${selectedVitalType.name.toLowerCase()}`}
                      required
                      step="0.1"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setError(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving || !selectedVitalTypeId}
              >
                {saving ? 'Saving...' : 'Save Vital'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Critical Vital Alerts</h3>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="bg-white border border-red-300 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-900">{alert.vitalType}</p>
                        <p className="text-sm text-red-700">
                          {alert.value && `Value: ${alert.value}`} - Level: {alert.alertLevel}
                        </p>
                      </div>
                      <span className="text-xs text-red-600">
                        {new Date(alert.recordedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends */}
      {trends.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.map((trend, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{trend.vitalType}</span>
                  {trend.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                  ) : trend.trend === 'down' ? (
                    <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">{trend.current}</span>
                  <span className={`text-sm ${
                    trend.trend === 'up' ? 'text-green-600' :
                    trend.trend === 'down' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {trend.change >= 0 ? '+' : ''}{trend.change_percent.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Previous: {trend.previous}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Vitals */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Readings</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading vitals...</div>
          ) : vitals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No vitals recorded yet. Click "Record Vital" to add your first reading.
            </div>
          ) : (
            vitals.slice(0, 10).map((vital) => (
              <div key={vital.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{vital.vitalType}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        vital.status === 'normal' ? 'bg-green-100 text-green-800' :
                        vital.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {vital.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-2 text-sm text-gray-600">
                      {vital.systolic && vital.diastolic ? (
                        <span>{vital.systolic}/{vital.diastolic} {vital.unit}</span>
                      ) : (
                        <span>{vital.value} {vital.unit}</span>
                      )}
                      <span>•</span>
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {new Date(vital.recordedAt).toLocaleString()}
                      </span>
                    </div>
                    {vital.notes && (
                      <p className="mt-1 text-sm text-gray-500">{vital.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
