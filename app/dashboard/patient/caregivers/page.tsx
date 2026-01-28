'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { UserGroupIcon } from '@heroicons/react/24/outline'

interface CaregiverAccess {
  id: string
  relationship: string
  accessLevel: string
  status: string
  caregiver: {
    id: string
    name?: string | null
    email?: string | null
  }
}

export default function PatientCaregiversPage() {
  const [caregivers, setCaregivers] = useState<CaregiverAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [caregiverId, setCaregiverId] = useState('')
  const [relationship, setRelationship] = useState('')

  const fetchCaregivers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/caregivers')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load caregivers')
      }
      setCaregivers(data.payload?.data || [])
    } catch (err) {
      console.error('Failed to load caregivers:', err)
      setError('Unable to load caregivers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaregivers()
  }, [])

  const handleAddCaregiver = async () => {
    if (!caregiverId.trim() || !relationship.trim()) return
    try {
      const response = await fetch('/api/patient/caregivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caregiverId: caregiverId.trim(), relationship: relationship.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to add caregiver')
      }
      setCaregiverId('')
      setRelationship('')
      fetchCaregivers()
    } catch (err) {
      console.error('Failed to add caregiver:', err)
      setError('Unable to add caregiver')
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
        <button onClick={fetchCaregivers} className="mt-3 text-sm text-blue-600 hover:text-blue-700">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <UserGroupIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Caregiver Access</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Invite caregiver</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={caregiverId}
            onChange={(event) => setCaregiverId(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Caregiver user ID"
          />
          <input
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Relationship"
          />
          <button onClick={handleAddCaregiver} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            Add caregiver
          </button>
        </div>
      </div>

      {caregivers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          No caregivers added yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {caregivers.map((caregiver) => (
            <div key={caregiver.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900">{caregiver.caregiver?.name || caregiver.caregiver?.email || 'Caregiver'}</p>
              <p className="text-xs text-gray-500">Relationship: {caregiver.relationship}</p>
              <p className="text-xs text-gray-500">Access: {caregiver.accessLevel}</p>
              <p className="text-xs text-gray-500">Status: {caregiver.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
