'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { ClipboardDocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface CarePlanSummary {
  id: string
  title: string
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  status?: string | null
  priority?: string | null
}

export default function PatientCarePlansPage() {
  const [carePlans, setCarePlans] = useState<CarePlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchCarePlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/care-plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load care plans')
      }
      setCarePlans(data.payload?.data || [])
    } catch (err) {
      console.error('Failed to load care plans:', err)
      setError('Unable to load care plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCarePlans()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchCarePlans}
          className="mt-3 text-sm text-green-600 hover:text-green-700"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <ClipboardDocumentCheckIcon className="w-8 h-8 mr-3 text-green-600" />
          Care Plans
        </h1>
        <p className="text-gray-600 mt-1">Review your active and historical care plans</p>
      </div>

      {carePlans.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          No care plans available.
        </div>
      ) : (
        <div className="grid gap-4">
          {carePlans.map((plan) => (
            <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{plan.title}</h3>
                  {plan.description && <p className="text-sm text-gray-600 mt-1">{plan.description}</p>}
                  <div className="text-xs text-gray-500 mt-2 space-x-3">
                    {plan.startDate && <span>Start: {new Date(plan.startDate).toLocaleDateString()}</span>}
                    {plan.endDate && <span>End: {new Date(plan.endDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button
                  className="text-sm text-green-600 hover:text-green-700"
                  onClick={() => setSelectedId(plan.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && (
        <CarePlanDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

interface CarePlanDetailModalProps {
  id: string
  onClose: () => void
}

interface CarePlanDetail {
  id: string
  title: string
  description?: string | null
  status?: string | null
  priority?: string | null
  startDate?: string | null
  endDate?: string | null
  prescribedMedications?: Array<{
    id: string
    medicine?: { name?: string | null } | null
    details?: Record<string, unknown> | null
  }>
  vitalRequirements?: Array<{
    id: string
    frequency: string
    vitalType?: { name?: string | null; unit?: string | null } | null
  }>
  diets?: Array<{ dietPlan?: { name?: string | null } | null }>
  workouts?: Array<{ workoutPlan?: { name?: string | null } | null }>
}

function CarePlanDetailModal({ id, onClose }: CarePlanDetailModalProps) {
  const [detail, setDetail] = useState<CarePlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/patient/care-plans/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.payload?.error?.message || 'Failed to load care plan')
        }
        setDetail(data.payload?.data || null)
      } catch (err) {
        console.error('Failed to load care plan detail:', err)
        setError('Unable to load care plan')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Care Plan Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading care plan...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : detail ? (
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="text-base font-medium text-gray-900">{detail.title}</h4>
              {detail.description && <p className="text-sm text-gray-600">{detail.description}</p>}
              <p className="text-xs text-gray-500 mt-1">Status: {detail.status || 'ACTIVE'} · Priority: {detail.priority || 'MEDIUM'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Medications</h5>
                <div className="space-y-2">
                  {(detail.prescribedMedications || []).map((med) => (
                    <div key={med.id} className="bg-gray-50 rounded-md p-2">
                      {med.medicine?.name || 'Medication'}
                    </div>
                  ))}
                  {(detail.prescribedMedications || []).length === 0 && (
                    <p className="text-xs text-gray-500">No medications listed.</p>
                  )}
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Vital Requirements</h5>
                <div className="space-y-2">
                  {(detail.vitalRequirements || []).map((vital) => (
                    <div key={vital.id} className="bg-gray-50 rounded-md p-2">
                      {vital.vitalType?.name || 'Vital'} · {vital.frequency}
                    </div>
                  ))}
                  {(detail.vitalRequirements || []).length === 0 && (
                    <p className="text-xs text-gray-500">No vital requirements listed.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Diet Plans</h5>
                <div className="space-y-2">
                  {(detail.diets || []).map((diet, index) => (
                    <div key={`${diet.dietPlan?.name}-${index}`} className="bg-gray-50 rounded-md p-2">
                      {diet.dietPlan?.name || 'Diet plan'}
                    </div>
                  ))}
                  {(detail.diets || []).length === 0 && (
                    <p className="text-xs text-gray-500">No diet plans assigned.</p>
                  )}
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Workout Plans</h5>
                <div className="space-y-2">
                  {(detail.workouts || []).map((workout, index) => (
                    <div key={`${workout.workoutPlan?.name}-${index}`} className="bg-gray-50 rounded-md p-2">
                      {workout.workoutPlan?.name || 'Workout plan'}
                    </div>
                  ))}
                  {(detail.workouts || []).length === 0 && (
                    <p className="text-xs text-gray-500">No workout plans assigned.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No care plan details available.</p>
        )}
      </div>
    </div>
  )
}
