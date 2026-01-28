'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { VideoCameraIcon } from '@heroicons/react/24/outline'
import VideoConsultationRoom from '@/components/video-consultation/VideoConsultationRoom'

interface ConsultationSummary {
  id: string
  status: string
  scheduledStart?: string
  scheduledEnd?: string
  consultationType?: string
  doctor?: { user?: { firstName?: string | null; lastName?: string | null } | null }
}

interface JoinData {
  joinUrl: string
  roomId: string
  consultation: { id: string }
}

export default function PatientVideoConsultationsPage() {
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([])
  const [selected, setSelected] = useState<JoinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConsultations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/video-consultations')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load consultations')
      }
      setConsultations(data.data || [])
    } catch (err) {
      console.error('Failed to load consultations:', err)
      setError('Unable to load video consultations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsultations()
  }, [])

  const handleJoin = async (consultationId: string) => {
    try {
      const response = await fetch(`/api/patient/video-consultations/${consultationId}/join`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join consultation')
      }
      setSelected(data.data)
    } catch (err) {
      console.error('Failed to join consultation:', err)
      setError('Unable to join consultation')
    }
  }

  if (selected) {
    return (
      <VideoConsultationRoom
        consultationId={selected.consultation.id}
        roomUrl={selected.joinUrl}
        userRole="patient"
        onEndConsultation={() => setSelected(null)}
      />
    )
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
        <button onClick={fetchConsultations} className="mt-3 text-sm text-blue-600 hover:text-blue-700">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <VideoCameraIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Video Consultations</h1>
      </div>
      {consultations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-600">
          No consultations available.
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((consultation) => (
            <div key={consultation.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {consultation.consultationType || 'Video consultation'}
                </p>
                <p className="text-xs text-gray-500">Status: {consultation.status}</p>
              </div>
              <button
                onClick={() => handleJoin(consultation.id)}
                className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
