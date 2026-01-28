'use client'

export const dynamic = 'force-dynamic'




// Force dynamic rendering for authenticated pages

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'

interface Medication {
  id: string
  name: string
  dosage: string | null
  frequency: string | null
  instructions: string | null
  scheduledAt?: string | null
  status: 'TAKEN' | 'MISSED' | 'PENDING'
  prescribedDate?: string | null
  endDate?: string | null
  side_effects?: string[] | null
}

type MedicationHistoryStatus = 'TAKEN' | 'MISSED' | 'LATE' | 'PARTIAL' | 'PENDING'

interface MedicationHistoryItem {
  id: string
  medicationId: string
  medicationName: string
  scheduledAt: string
  takenAt: string | null
  status: MedicationHistoryStatus
  dosageTaken?: string | null
  notes?: string | null
  frequency?: string | null
}

interface AdherenceStats {
  total: number
  taken: number
  missed: number
  adherenceRate: number
}

type HistoryRange = '7d' | '30d' | '90d'

export default function MedicationsPage() {
  const { user } = useAuth()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'TAKEN' | 'MISSED' | 'PENDING'>('all')
  const [history, setHistory] = useState<MedicationHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyRange, setHistoryRange] = useState<HistoryRange>('30d')
  const [adherenceStats, setAdherenceStats] = useState<AdherenceStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    fetchMedications()
  }, [])

  useEffect(() => {
    fetchHistory()
    fetchAdherenceStats()
  }, [historyRange])

  const fetchMedications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/medications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data: { payload?: { data?: { schedule?: Medication[] } } } = await response.json()
        setMedications(data.payload?.data?.schedule || [])
      }
    } catch (error) {
      console.error('Failed to fetch carePlans: ', error)
    } finally {
      setLoading(false)
    }
  }

  const getHistoryRangeStart = (range: HistoryRange) => {
    const startDate = new Date()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    startDate.setDate(startDate.getDate() - days)
    return startDate
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const startDate = getHistoryRangeStart(historyRange)
      const endDate = new Date()
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: '50'
      })
      const response = await fetch(`/api/patient/medications/history?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data: { payload?: { data?: MedicationHistoryItem[]; error?: { message?: string } } } = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load medication history')
      }
      setHistory(data.payload?.data || [])
    } catch (error) {
      console.error('Failed to fetch medication history:', error)
      setHistoryError('Unable to load medication history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchAdherenceStats = async () => {
    setStatsLoading(true)
    setStatsError(null)
    try {
      const startDate = getHistoryRangeStart(historyRange)
      const endDate = new Date()
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      const response = await fetch(`/api/patient/medications/adherence-stats?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data: { payload?: { data?: AdherenceStats; error?: { message?: string } } } = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load adherence stats')
      }
      setAdherenceStats(data.payload?.data || null)
    } catch (error) {
      console.error('Failed to fetch medication adherence stats:', error)
      setStatsError('Unable to load adherence stats')
    } finally {
      setStatsLoading(false)
    }
  }

  const markAsTaken = async (medicationId: string) => {
    try {
      const response = await fetch('/api/patient/medications/take', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medicationId, dosage: '1 dose' }),
      })
      if (response.ok) {
        fetchMedications() // Refresh the list
        fetchHistory()
        fetchAdherenceStats()
      }
    } catch (error) {
      console.error('Failed to mark medication as taken:', error)
    }
  }

  const filteredMedications = medications.filter((med) => {
    if (filter === 'all') return true
    return med.status === filter
  })

  const getStatusColor = (status: Medication['status']) => {
    switch (status) {
      case 'TAKEN':
        return 'bg-green-100 text-green-800'
      case 'MISSED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Medication['status']) => {
    switch (status) {
      case 'TAKEN':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'MISSED':
        return <XCircleIcon className="w-4 h-4" />
      case 'PENDING':
        return <ClockIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const getHistoryStatusColor = (status: MedicationHistoryStatus) => {
    switch (status) {
      case 'TAKEN':
        return 'bg-green-100 text-green-800'
      case 'MISSED':
        return 'bg-red-100 text-red-800'
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800'
      case 'PARTIAL':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
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
            <BeakerIcon className="w-8 h-8 mr-3 text-blue-600" />
            My Medications
          </h1>
          <p className="text-gray-600 mt-1">Track your prescribed medications and dosages</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['all', 'PENDING', 'TAKEN', 'MISSED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-2 px-1 border-b-2 font-medium text-sm uppercase transition-colors ${
                  filter === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status} ({medications.filter(m => status === 'all' || m.status === status).length})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Medications List */}
      <div className="space-y-4">
        {filteredMedications.length === 0 ? (
          <div className="text-center py-12">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No medications found</h3>
            <p className="mt-1 text-sm text-gray-500">
                {filter === 'all'
                  ? 'You have no active medications at this time.'
                  : `No ${filter} medications found.`}
              </p>
          </div>
        ) : (
          filteredMedications.map((medication) => (
            <div key={medication.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">{medication.name}</h3>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(medication.status)}`}>
                        {getStatusIcon(medication.status)}
                        <span className="ml-1 capitalize">{medication.status}</span>
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Dosage:</span> {medication.dosage}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Frequency:</span> {medication.frequency}
                      </p>
                      {medication.instructions && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Instructions:</span> {medication.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {medication.status !== 'TAKEN' && (
                    <div className="flex flex-col items-end space-y-2">
                      {medication.scheduledAt && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Scheduled: {new Date(medication.scheduledAt).toLocaleTimeString()}
                        </div>
                      )}
                      <button
                        onClick={() => markAsTaken(medication.id)}
                        disabled={medication.status === 'TAKEN'}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          medication.status === 'TAKEN'
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {medication.status === 'TAKEN' ? 'Taken Today' : 'Mark as Taken'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                          Prescribed: {medication.scheduledAt ? new Date(medication.scheduledAt).toLocaleDateString() : 'N/A'}
                        </div>
                    {medication.endDate && (
                      <div>
                        End Date: {new Date(medication.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {medication.side_effects && medication.side_effects.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center text-sm text-yellow-700">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        <span className="font-medium">Possible side effects:</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {medication.side_effects.map((effect, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded"
                          >
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {medications.length > 0 && (
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Medication Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {medications.length}
              </div>
              <div className="text-sm text-blue-700">Total Medications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {medications.filter((m) => m.status === 'TAKEN').length}
              </div>
              <div className="text-sm text-green-700">Taken Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {medications.filter((m) => m.status === 'PENDING').length}
              </div>
              <div className="text-sm text-yellow-700">Pending Today</div>
            </div>
          </div>
        </div>
      )}

      {/* Adherence Summary */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Adherence Summary</h3>
            <p className="text-sm text-gray-500">Review your medication adherence</p>
          </div>
          <select
            value={historyRange}
            onChange={(event) => setHistoryRange(event.target.value as HistoryRange)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        {statsLoading ? (
          <div className="text-sm text-gray-500">Loading adherence stats...</div>
        ) : statsError ? (
          <div className="text-sm text-red-600">{statsError}</div>
        ) : adherenceStats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{adherenceStats.adherenceRate}%</div>
              <div className="text-sm text-green-700">Adherence Rate</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{adherenceStats.total}</div>
              <div className="text-sm text-blue-700">Total Doses</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{adherenceStats.taken}</div>
              <div className="text-sm text-green-700">Taken</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{adherenceStats.missed}</div>
              <div className="text-sm text-red-700">Missed</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No adherence stats available.</div>
        )}
      </div>

      {/* Medication History */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Medication History</h3>
          <p className="text-sm text-gray-500">Recent medication logs for the selected range</p>
        </div>
        <div className="divide-y divide-gray-200">
          {historyLoading ? (
            <div className="px-6 py-6 text-sm text-gray-500">Loading history...</div>
          ) : historyError ? (
            <div className="px-6 py-6 text-sm text-red-600">{historyError}</div>
          ) : history.length === 0 ? (
            <div className="px-6 py-6 text-sm text-gray-500">No medication history for this range.</div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">{item.medicationName}</h4>
                      <span className={`ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getHistoryStatusColor(item.status)}`}>
                        {item.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Scheduled: {new Date(item.scheduledAt).toLocaleString()}
                    </p>
                    {item.takenAt && (
                      <p className="text-xs text-gray-500">
                        Taken: {new Date(item.takenAt).toLocaleString()}
                      </p>
                    )}
                    {item.frequency && (
                      <p className="text-xs text-gray-500">Frequency: {item.frequency}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {item.dosageTaken && <div>Dosage: {item.dosageTaken}</div>}
                    {item.notes && <div className="mt-1 max-w-xs">{item.notes}</div>}
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
