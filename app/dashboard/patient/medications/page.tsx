'use client'

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
  dosage: string
  frequency: string
  instructions: string
  prescribed_date: string
  end_date?: string
  status: 'active' | 'completed' | 'discontinued'
  next_dose?: string
  taken_today: boolean
  side_effects?: string[]
}

export default function MedicationsPage() {
  const { user } = useAuth()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'discontinued'>('active')

  useEffect(() => {
    fetchMedications()
  }, [])

  const fetchMedications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/medications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMedications(data.payload?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch care_plans: ', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsTaken = async (medicationId: string) => {
    try {
      const response = await fetch(`/api/patient/medications/${medicationId}/take`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        fetchMedications() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to mark medication as taken:', error)
    }
  }

  const filteredMedications = medications.filter(med => {
    if (filter === 'all') return true
    return med.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'discontinued':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'discontinued':
        return <XCircleIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
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
            {(['all', 'active', 'completed', 'discontinued'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
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
              {filter === 'active' 
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

                  {medication.status === 'active' && (
                    <div className="flex flex-col items-end space-y-2">
                      {medication.next_dose && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Next: {new Date(medication.next_dose).toLocaleTimeString()}
                        </div>
                      )}
                      <button
                        onClick={() => markAsTaken(medication.id)}
                        disabled={medication.taken_today}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          medication.taken_today
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {medication.taken_today ? 'Taken Today' : 'Mark as Taken'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Prescribed: {new Date(medication.prescribed_date).toLocaleDateString()}
                    </div>
                    {medication.end_date && (
                      <div>
                        End Date: {new Date(medication.end_date).toLocaleDateString()}
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
                {medications.filter(m => m.status === 'active').length}
              </div>
              <div className="text-sm text-blue-700">Active Medications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {medications.filter(m => m.taken_today).length}
              </div>
              <div className="text-sm text-green-700">Taken Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {medications.filter(m => m.status === 'active' && !m.taken_today).length}
              </div>
              <div className="text-sm text-yellow-700">Pending Today</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}