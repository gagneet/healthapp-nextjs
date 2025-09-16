'use client'

import { HeartIcon, ScaleIcon, ThermometerIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface VitalsRecorderProps {
  isOpen: boolean
  onClose: () => void
  onVitalRecorded: (vital: any) => void
  patientId?: string
}

const vitalTypes = [
  { id: 'blood_pressure', name: 'Blood Pressure', unit: 'mmHg', icon: HeartIcon, hasSystolicDiastolic: true },
  { id: 'heart_rate', name: 'Heart Rate', unit: 'bpm', icon: HeartIcon },
  { id: 'temperature', name: 'Temperature', unit: '°F', icon: ThermometerIcon },
  { id: 'weight', name: 'Weight', unit: 'lbs', icon: ScaleIcon },
  { id: 'blood_glucose', name: 'Blood Glucose', unit: 'mg/dL', icon: HeartIcon },
  { id: 'oxygen_saturation', name: 'Oxygen Saturation', unit: '%', icon: HeartIcon }
]

export default function VitalsRecorder({ isOpen, onClose, onVitalRecorded, patientId }: VitalsRecorderProps) {
  const [selectedVitalType, setSelectedVitalType] = useState('')
  const [value, setValue] = useState('')
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedVital = vitalTypes.find(v => v.id === selectedVitalType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedVitalType) {
      toast.error('Please select a vital type')
      return
    }

    if (!value && !systolic) {
      toast.error('Please enter a value')
      return
    }

    setIsSubmitting(true)

    try {
      const vitalData: any = {
        vitalType: selectedVitalType,
        value: selectedVital?.hasSystolicDiastolic ? `${systolic}/${diastolic}` : value,
        unit: selectedVital?.unit || '',
        notes: notes.trim() || undefined
      }

      if (selectedVital?.hasSystolicDiastolic) {
        vitalData.systolic = parseInt(systolic)
        vitalData.diastolic = parseInt(diastolic)
      }

      const response = await fetch('/api/patient/vitals/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vitalData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Vital signs recorded successfully!')
        onVitalRecorded(result.payload.data)
        handleClose()
      } else {
        toast.error(result.payload?.error?.message || 'Failed to record vital signs')
      }
    } catch (error) {
      console.error('Error recording vitals:', error)
      toast.error('Failed to record vital signs')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedVitalType('')
    setValue('')
    setSystolic('')
    setDiastolic('')
    setNotes('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Record Vital Signs</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vital Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Vital Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {vitalTypes.map((vital) => (
                <button
                  key={vital.id}
                  type="button"
                  onClick={() => setSelectedVitalType(vital.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    selectedVitalType === vital.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <vital.icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium text-sm">{vital.name}</div>
                      <div className="text-xs text-gray-500">{vital.unit}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Value Input */}
          {selectedVital && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedVital.name} Reading
              </label>
              
              {selectedVital.hasSystolicDiastolic ? (
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Systolic"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1">Systolic</div>
                  </div>
                  <div className="text-gray-400">/</div>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Diastolic"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1">Diastolic</div>
                  </div>
                  <div className="text-sm text-gray-500">{selectedVital.unit}</div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder={`Enter ${selectedVital.name.toLowerCase()}`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-500">{selectedVital.unit}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this reading..."
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
              disabled={isSubmitting || !selectedVitalType}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Recording...' : 'Record Vital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}