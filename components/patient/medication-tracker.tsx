'use client'

import { BeakerIcon, CheckIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface MedicationTrackerProps {
  isOpen: boolean
  onClose: () => void
  onMedicationTaken: (medication: any) => void
  patientId?: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency?: string | null
  instructions?: string | null
  nextDue?: string
}

export default function MedicationTracker({ isOpen, onClose, onMedicationTaken, patientId }: MedicationTrackerProps) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [selectedMedication, setSelectedMedication] = useState<string>('')
  const [customDosage, setCustomDosage] = useState('')
  const [notes, setNotes] = useState('')
  const [takenAt, setTakenAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchMedications()
      // Set current time as default
      const now = new Date()
      setTakenAt(now.toISOString().slice(0, 16)) // Format for datetime-local input
    }
  }, [isOpen])

  const fetchMedications = async () => {
    setIsLoading(true)
    try {
      if (!patientId) {
        setMedications([])
        return
      }

      const response = await fetch(`/api/medications/patient/${patientId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.payload?.error?.message || 'Failed to load medications')
      }

      const data = Array.isArray(result.payload?.data?.carePlans) ? result.payload.data.carePlans : []
      const mappedMedications = data.map((medication: any) => ({
        id: medication.id,
        name: medication.name,
        dosage: medication.dosage || '',
        frequency: medication.frequency,
        instructions: medication.notes || medication.instructions,
        nextDue: medication.nextDue
      }))

      setMedications(mappedMedications)
    } catch (error) {
      console.error('Error fetching medications:', error)
      toast.error('Failed to load medications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMedication) {
      toast.error('Please select a medication')
      return
    }

    const medication = medications.find(m => m.id === selectedMedication)
    if (!medication) {
      toast.error('Selected medication not found')
      return
    }

    setIsSubmitting(true)

    try {
      const medicationData = {
        medicationId: selectedMedication,
        dosage: customDosage || medication.dosage,
        notes: notes.trim() || undefined,
        takenAt: takenAt || undefined
      }

      const response = await fetch('/api/patient/medications/take', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(medicationData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`${medication.name} recorded successfully!`)
        onMedicationTaken(result.payload.data)
        handleClose()
      } else {
        toast.error(result.payload?.error?.message || 'Failed to record medication')
      }
    } catch (error) {
      console.error('Error recording medication:', error)
      toast.error('Failed to record medication')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedMedication('')
    setCustomDosage('')
    setNotes('')
    setTakenAt('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Record Medication</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Medication Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Medication
            </label>
            
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading medications...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {medications.map((medication) => (
                  <button
                    key={medication.id}
                    type="button"
                    onClick={() => setSelectedMedication(medication.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      selectedMedication === medication.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <BeakerIcon className="h-5 w-5 mt-0.5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{medication.name}</div>
                        <div className="text-sm text-gray-600">{medication.dosage} • {medication.frequency}</div>
                        <div className="text-xs text-gray-500">{medication.instructions}</div>
                        {medication.nextDue && (
                          <div className="flex items-center mt-1 text-xs text-orange-600">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Next due: {new Date(medication.nextDue).toLocaleString()}
                          </div>
                        )}
                      </div>
                      {selectedMedication === medication.id && (
                        <CheckIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Dosage */}
          {selectedMedication && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage (Optional - leave blank to use prescribed dosage)
              </label>
              <input
                type="text"
                placeholder={medications.find(m => m.id === selectedMedication)?.dosage}
                value={customDosage}
                onChange={(e) => setCustomDosage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Time Taken */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Taken
            </label>
            <input
              type="datetime-local"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about taking this medication..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedMedication}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Recording...' : 'Record Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
