'use client'

import { useState } from 'react'

interface Symptom {
  id: string
  name: string
  severity: number
  x: number
  y: number
  z?: number
  description?: string
  onset_time: string
}

interface BodyDiagram3DSimpleProps {
  symptoms: Symptom[]
  onSymptomClick?: (symptom: Symptom) => void
  onBodyClick?: (position: any) => void
  interactive?: boolean
  gender?: 'male' | 'female'
  highlightedSymptom?: string | null
}

export default function BodyDiagram3DSimple({
  symptoms = [],
  onSymptomClick,
  onBodyClick,
  interactive = false,
  gender = 'male',
  highlightedSymptom = null
}: BodyDiagram3DSimpleProps) {
  const [view, setView] = useState<'front' | 'back' | 'left' | 'right'>('front')

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <div className={`px-3 py-1 rounded text-sm font-medium ${
              gender === 'male' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'
            }`}>
              👨 Male
            </div>
            <div className={`px-3 py-1 rounded text-sm font-medium ${
              gender === 'female' ? 'bg-pink-100 text-pink-800' : 'text-gray-600'
            }`}>
              👩 Female
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="h-96 w-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
          <div className="text-center space-y-4">
            <div className="text-6xl">🧑‍⚕️</div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-800">3D Body Diagram</h3>
              <p className="text-sm text-gray-600">
                Interactive 3D body model for symptom visualization
              </p>
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mt-4">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ 3D View Currently Loading...
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  Advanced 3D visualization is being loaded. Please wait or try refreshing the page.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Show symptoms as overlay */}
        {symptoms.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg max-w-xs">
            <h4 className="text-sm font-medium mb-2">Symptoms ({symptoms.length})</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {symptoms.slice(0, 5).map((symptom) => (
                <div key={symptom.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{symptom.name}</span>
                  <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                    symptom.severity >= 8 ? 'bg-red-100 text-red-800' :
                    symptom.severity >= 5 ? 'bg-orange-100 text-orange-800' :
                    symptom.severity >= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {symptom.severity}/10
                  </span>
                </div>
              ))}
              {symptoms.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  +{symptoms.length - 5} more symptoms
                </div>
              )}
            </div>
          </div>
        )}

        {/* Severity Legend */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
          <h4 className="text-sm font-medium mb-2">Symptom Severity</h4>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Minimal (1-2)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
              <span>Mild (3-4)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <span>Moderate (5-7)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span>Severe (8-10)</span>
            </div>
          </div>
        </div>
      </div>

      {interactive && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          3D interactive features will be available once the model loads
        </p>
      )}

      {symptoms.length > 0 && (
        <div className="mt-2 text-center text-sm text-gray-600">
          Showing {symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''} on {gender} model
        </div>
      )}
    </div>
  )
}