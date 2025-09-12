import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface Patient {
  id: string
  name: string
}

interface CreateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  startTime: Date | null
  endTime: Date | null
  patients: Patient[]
  onAppointmentCreated: () => void
  doctorProfileId: string | null
}

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  startTime,
  endTime,
  patients,
  onAppointmentCreated,
  doctorProfileId,
}: CreateAppointmentModalProps) {
  const [patientId, setPatientId] = useState('')
  const [appointmentType, setAppointmentType] = useState('consultation')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setPatientId('')
      setAppointmentType('consultation')
      setDescription('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !startTime || !endTime || !doctorProfileId) {
      toast.error('Please fill all required fields.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          doctorId: doctorProfileId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description: `Type: ${appointmentType}. Notes: ${description}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to create appointment')
      }

      toast.success('Appointment created successfully!')
      onAppointmentCreated()
      onClose()
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold">New Appointment</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              <strong>From:</strong> {startTime?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>To:</strong> {endTime?.toLocaleString()}
            </p>
          </div>

          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <select
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Type
            </label>
            <select
              id="appointmentType"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="check-up">Check-up</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Notes / Reason
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Reason for the appointment..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
