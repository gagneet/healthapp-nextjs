'use client'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  ExclamationTriangleIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline'
import BodyDiagramEnhanced from '@/components/ui/body-diagram-enhanced'

interface Symptom {
  id: string
  name: string
  severity: number
  location: string
  description: string
  onsetTime: string
  duration: string
  triggers?: string[]
  relief_factors?: string[]
  associated_symptoms?: string[]
  x: number
  y: number
  z?: number
}

export default function SymptomsPage() {
  const { user } = useAuth()
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom | null>(null)

  useEffect(() => {
    fetchSymptoms()
  }, [])

  const fetchSymptoms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/symptoms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSymptoms(data.payload?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch symptoms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-100 text-red-800'
    if (severity >= 6) return 'bg-orange-100 text-orange-800'
    if (severity >= 4) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getSeverityText = (severity: number) => {
    if (severity >= 8) return 'Severe'
    if (severity >= 6) return 'Moderate'
    if (severity >= 4) return 'Mild'
    return 'Minimal'
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
            <ExclamationTriangleIcon className="w-8 h-8 mr-3 text-yellow-600" />
            Symptoms Tracker
          </h1>
          <p className="text-gray-600 mt-1">Record and track your symptoms with visual mapping</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Record Symptom
        </button>
      </div>

      {/* Body Diagram */}
      {symptoms.length > 0 && (
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Symptom Visualization</h2>
          <BodyDiagramEnhanced
            symptoms={symptoms}
            onSymptomClick={(symptom) => {
              // Find the full symptom object from our list
              const fullSymptom = symptoms.find(s => s.id === symptom.id) || null
              setSelectedSymptom(fullSymptom)
            }}
            interactive={true}
            highlightedSymptom={selectedSymptom?.id || null}
          />
        </div>
      )}

      {/* Symptoms List */}
      <div className="space-y-4">
        {symptoms.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No symptoms recorded</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start tracking your symptoms to help your healthcare provider better understand your condition.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Record First Symptom
            </button>
          </div>
        ) : (
          symptoms.map((symptom) => (
            <div 
              key={symptom.id} 
              className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                selectedSymptom?.id === symptom.id ? 'border-blue-500' : 'border-gray-200'
              }`}
              onClick={() => setSelectedSymptom(symptom)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">{symptom.name}</h3>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(symptom.severity)}`}>
                        {getSeverityText(symptom.severity)} ({symptom.severity}/10)
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        {symptom.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {new Date(symptom.onsetTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        Duration: {symptom.duration}
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-700">{symptom.description}</p>
                    </div>

                    {/* Additional Details */}
                    {(symptom.triggers?.length || symptom.relief_factors?.length || symptom.associated_symptoms?.length) && (
                      <div className="mt-4 space-y-2">
                        {symptom.triggers && symptom.triggers.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Triggers:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {symptom.triggers.map((trigger, index) => (
                                <span key={index} className="inline-block px-2 py-1 bg-red-50 text-red-700 text-xs rounded">
                                  {trigger}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {symptom.relief_factors && symptom.relief_factors.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Relief Factors:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {symptom.relief_factors.map((factor, index) => (
                                <span key={index} className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                                  {factor}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {symptom.associated_symptoms && symptom.associated_symptoms.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Associated Symptoms:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {symptom.associated_symptoms.map((assocSymptom, index) => (
                                <span key={index} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                  {assocSymptom}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {symptoms.length > 0 && (
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-900 mb-4">Symptom Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {symptoms.filter(s => s.severity >= 6).length}
              </div>
              <div className="text-sm text-yellow-700">Moderate to Severe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(symptoms.map(s => s.location)).size}
              </div>
              <div className="text-sm text-blue-700">Body Areas Affected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {symptoms.filter(s => new Date(s.onsetTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-sm text-green-700">Recent (7 days)</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Symptom Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Record New Symptom</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptom Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Headache, Back pain"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rate from 1 (mild) to 10 (severe)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Lower back, Right temple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the symptom in detail..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Onset Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2 hours, ongoing"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Symptom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}