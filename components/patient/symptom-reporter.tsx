'use client'

import { useState, useRef } from 'react'
import { X, MapPin, Save, AlertTriangle, Mic } from 'lucide-react'
import BodyDiagramEnhanced from '@/components/ui/body-diagram-enhanced'
import { BODY_PARTS, BODY_PART_LABELS, BODY_PART_CATEGORIES, detectBodyPartFromCoordinates, getBodyPartLabel } from '@/lib/body-parts'
import SpeechToText from '@/components/common/speech-to-text'

interface SymptomReporterProps {
  patientId?: string
  gender?: 'male' | 'female'
  onSymptomSubmit?: (symptomData: any) => void
  onClose?: () => void
  isOpen?: boolean
}

interface SymptomFormData {
  bodyPart: string
  bodyPartCustom: string
  symptomName: string
  severity: number
  description: string
  duration: string
  triggers: string
  position: { x: number, y: number, z?: number }
}

const SEVERITY_LEVELS = [
  { value: 1, label: 'Very Mild', color: 'bg-green-500', description: 'Barely noticeable' },
  { value: 2, label: 'Mild', color: 'bg-green-400', description: 'Slight discomfort' },
  { value: 3, label: 'Mild-Moderate', color: 'bg-yellow-400', description: 'Noticeable discomfort' },
  { value: 4, label: 'Moderate', color: 'bg-yellow-500', description: 'Moderate discomfort' },
  { value: 5, label: 'Moderate', color: 'bg-orange-400', description: 'Quite uncomfortable' },
  { value: 6, label: 'Moderate-Severe', color: 'bg-orange-500', description: 'Very uncomfortable' },
  { value: 7, label: 'Severe', color: 'bg-red-400', description: 'Intense discomfort' },
  { value: 8, label: 'Very Severe', color: 'bg-red-500', description: 'Extremely intense' },
  { value: 9, label: 'Extremely Severe', color: 'bg-red-600', description: 'Unbearable' },
  { value: 10, label: 'Maximum', color: 'bg-red-700', description: 'Worst possible' }
]

export default function SymptomReporter({
  patientId,
  gender = 'male',
  onSymptomSubmit,
  onClose,
  isOpen = false
}: SymptomReporterProps) {
  const [formData, setFormData] = useState<SymptomFormData>({
    bodyPart: '',
    bodyPartCustom: '',
    symptomName: '',
    severity: 5,
    description: '',
    duration: '',
    triggers: '',
    position: { x: 50, y: 50, z: 0 }
  })

  const [selectedFromDiagram, setSelectedFromDiagram] = useState(false)
  const [showBodyPartForm, setShowBodyPartForm] = useState(true)
  const [showSpeechForName, setShowSpeechForName] = useState(false)
  const [showSpeechForDescription, setShowSpeechForDescription] = useState(false)

  const handleBodyPartSelection = (bodyPart: string, position?: { x: number, y: number, z?: number }) => {
    setFormData(prev => ({
      ...prev,
      bodyPart,
      bodyPartCustom: getBodyPartLabel(bodyPart),
      position: position || prev.position
    }))
    setSelectedFromDiagram(true)
    setShowBodyPartForm(false)
  }

  const handleBodyClick = (x: number, y: number, z?: number) => {
    const detectedPart = detectBodyPartFromCoordinates(x, y, z)
    handleBodyPartSelection(detectedPart, { x, y, z })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const symptomData = {
      name: formData.symptomName,
      severity: formData.severity,
      description: formData.description,
      body_part: formData.bodyPartCustom,
      onset_time: new Date().toISOString(),
      x: formData.position.x,
      y: formData.position.y,
      z: formData.position.z || 0,
      status: 'active' as const,
      duration: formData.duration,
      triggers: formData.triggers,
      patientId: patientId || ''
    }

    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(symptomData)
      })

      if (response.ok) {
        const result = await response.json()
        onSymptomSubmit?.(result.payload.data)
        handleReset()
        // Show success message
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Symptom recorded successfully!')
        }
      } else {
        console.error('Failed to submit symptom:', response.statusText)
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Failed to record symptom. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error submitting symptom:', error)
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Network error. Please check your connection and try again.')
      }
    }
  }

  const handleReset = () => {
    setFormData({
      bodyPart: '',
      bodyPartCustom: '',
      symptomName: '',
      severity: 5,
      description: '',
      duration: '',
      triggers: '',
      position: { x: 50, y: 50, z: 0 }
    })
    setSelectedFromDiagram(false)
    setShowBodyPartForm(true)
    setShowSpeechForName(false)
    setShowSpeechForDescription(false)
  }

  const handleSpeechTranscriptName = (text: string, language: string) => {
    setFormData(prev => ({ ...prev, symptomName: text }))
  }

  const handleSpeechTranscriptDescription = (text: string, language: string) => {
    setFormData(prev => ({ ...prev, description: text }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Report a Symptom</h2>
            <p className="text-gray-600 mt-1">
              Click on the body diagram or select from the list to identify where you're experiencing symptoms
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Left Side - Body Diagram */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Select Body Location
              </h3>
              
              <BodyDiagramEnhanced
                symptoms={[]}
                interactive={true}
                gender={gender}
                onBodyClick={handleBodyClick}
              />
              
              {selectedFromDiagram && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {formData.bodyPartCustom}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedFromDiagram(false)
                      setShowBodyPartForm(true)
                      setFormData(prev => ({ ...prev, bodyPart: '', bodyPartCustom: '' }))
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                  >
                    Change selection
                  </button>
                </div>
              )}
            </div>

            {/* Body Part Selection Dropdown (Alternative method) */}
            {showBodyPartForm && !selectedFromDiagram && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Or select from list:</h4>
                <select
                  value={formData.bodyPart}
                  onChange={(e) => handleBodyPartSelection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a body part...</option>
                  {Object.entries(BODY_PART_CATEGORIES).map(([category, parts]) => (
                    <optgroup key={category} label={category}>
                      {parts.map(part => (
                        <option key={part} value={part}>
                          {getBodyPartLabel(part)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Side - Symptom Details Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Body Part Display */}
              {(selectedFromDiagram || formData.bodyPart) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800">Selected Location:</h4>
                  <p className="text-green-700">{formData.bodyPartCustom}</p>
                </div>
              )}

              {/* Symptom Name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    What are you experiencing? *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSpeechForName(!showSpeechForName)}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Mic className="h-4 w-4" />
                    <span>{showSpeechForName ? 'Hide Voice' : 'Use Voice'}</span>
                  </button>
                </div>
                
                {showSpeechForName ? (
                  <div className="space-y-3">
                    <SpeechToText
                      onTranscript={handleSpeechTranscriptName}
                      language="auto"
                      placeholder="Click microphone and describe your symptom..."
                      className="w-full"
                    />
                    <input
                      type="text"
                      required
                      value={formData.symptomName}
                      onChange={(e) => setFormData(prev => ({ ...prev, symptomName: e.target.value }))}
                      placeholder="e.g., Pain, Ache, Burning, Tingling, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={formData.symptomName}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptomName: e.target.value }))}
                    placeholder="e.g., Pain, Ache, Burning, Tingling, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Pain/Severity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Severity Level: {formData.severity}/10
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {SEVERITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: level.value }))}
                      className={`p-2 rounded text-xs font-medium transition-all ${
                        formData.severity === level.value
                          ? `${level.color} text-white shadow-lg`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level.value}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {SEVERITY_LEVELS.find(l => l.value === formData.severity)?.description}
                </p>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Describe your symptoms in detail *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSpeechForDescription(!showSpeechForDescription)}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Mic className="h-4 w-4" />
                    <span>{showSpeechForDescription ? 'Hide Voice' : 'Use Voice'}</span>
                  </button>
                </div>
                
                {showSpeechForDescription ? (
                  <div className="space-y-3">
                    <SpeechToText
                      onTranscript={handleSpeechTranscriptDescription}
                      language="auto"
                      placeholder="Click microphone and describe your symptoms in detail..."
                      className="w-full"
                    />
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe how it feels, when it happens, what makes it better or worse..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe how it feels, when it happens, what makes it better or worse..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How long have you had this symptom?
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select duration...</option>
                  <option value="less_than_hour">Less than an hour</option>
                  <option value="few_hours">A few hours</option>
                  <option value="today">Started today</option>
                  <option value="yesterday">Since yesterday</option>
                  <option value="few_days">A few days</option>
                  <option value="week">About a week</option>
                  <option value="few_weeks">A few weeks</option>
                  <option value="month">About a month</option>
                  <option value="longer">Longer than a month</option>
                </select>
              </div>

              {/* Triggers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What triggers or worsens this symptom?
                </label>
                <textarea
                  rows={2}
                  value={formData.triggers}
                  onChange={(e) => setFormData(prev => ({ ...prev, triggers: e.target.value }))}
                  placeholder="Movement, eating, stress, weather, time of day, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={!formData.symptomName || !formData.description || (!formData.bodyPart && !selectedFromDiagram)}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Report Symptom
                </button>
              </div>
            </form>

            {/* Emergency Notice */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Emergency Situations</p>
                  <p>
                    If you are experiencing severe symptoms, chest pain, difficulty breathing, 
                    or any other emergency condition, please call emergency services immediately 
                    or go to the nearest emergency room.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}