'use client'

import { useState } from 'react'
import BodyDiagram3D from '@/components/ui/body-diagram-3d'
import SymptomReporter from '@/components/patient/symptom-reporter'

// Sample symptom data for testing
const sampleSymptoms = [
  {
    id: '1',
    name: 'Headache',
    severity: 7,
    x: 0,
    y: 0.8,
    z: 0,
    description: 'Severe headache with throbbing pain',
    onsetTime: '2025-01-15T10:30:00Z'
  },
  {
    id: '2', 
    name: 'Chest Pain',
    severity: 9,
    x: 0,
    y: 0.2,
    z: 0,
    description: 'Sharp chest pain on left side',
    onsetTime: '2025-01-15T12:00:00Z'
  },
  {
    id: '3',
    name: 'Stomach Ache',
    severity: 4,
    x: 0,
    y: -0.2,
    z: 0,
    description: 'Mild stomach discomfort after eating',
    onsetTime: '2025-01-15T14:30:00Z'
  },
  {
    id: '4',
    name: 'Knee Pain',
    severity: 6,
    x: -0.3,
    y: -1.2,
    z: 0,
    description: 'Left knee pain when walking',
    onsetTime: '2025-01-15T16:00:00Z'
  }
]

export default function Test3DBodyPage() {
  const [symptoms, setSymptoms] = useState(sampleSymptoms)
  const [highlightedSymptom, setHighlightedSymptom] = useState<string | null>(null)
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [showSymptomReporter, setShowSymptomReporter] = useState(false)

  const handleSymptomClick = (symptom: any) => {
    console.log('Symptom clicked:', symptom)
    setHighlightedSymptom(symptom.id)
  }

  const handleBodyClick = (position: any) => {
    console.log('Body clicked at position:', position)
    
    // Create a new symptom at clicked position
    const newSymptom = {
      id: `new-${Date.now()}`,
      name: 'New Symptom',
      severity: 5,
      x: Math.max(-1, Math.min(1, position.x / 2)),
      y: Math.max(-1, Math.min(1, position.y / 2)), 
      z: Math.max(-1, Math.min(1, position.z / 2)),
      description: 'New symptom added via click',
      onsetTime: new Date().toISOString()
    }
    
    setSymptoms([...symptoms, newSymptom])
  }

  const clearSymptoms = () => {
    setSymptoms([])
    setHighlightedSymptom(null)
  }

  const resetToSample = () => {
    setSymptoms(sampleSymptoms)
    setHighlightedSymptom(null)
  }

  const handleSymptomSubmit = (symptomData: any) => {
    console.log('New symptom submitted:', symptomData)
    setSymptoms(prev => [...prev, symptomData])
    setShowSymptomReporter(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            3D Body Diagram Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            Test the new 3D body diagram component with interactive features and gender-specific models.
          </p>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Gender:</label>
              <button
                onClick={() => setGender('male')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  gender === 'male'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                👨 Male
              </button>
              <button
                onClick={() => setGender('female')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  gender === 'female'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                👩 Female
              </button>
            </div>

            <button
              onClick={resetToSample}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Reset to Sample Data
            </button>

            <button
              onClick={clearSymptoms}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Clear All Symptoms
            </button>

            <button
              onClick={() => setShowSymptomReporter(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              Test Symptom Reporter
            </button>
          </div>
        </div>

        {/* 3D Body Diagram */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Interactive 3D Body Diagram</h2>
          <BodyDiagram3D
            symptoms={symptoms}
            onSymptomClick={handleSymptomClick}
            onBodyClick={handleBodyClick}
            interactive={true}
            gender={gender}
            highlightedSymptom={highlightedSymptom}
          />
        </div>

        {/* Current Symptoms List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Symptoms ({symptoms.length})</h2>
          
          {symptoms.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No symptoms recorded. Click on the 3D body model to add symptoms.
            </p>
          ) : (
            <div className="space-y-3">
              {symptoms.map((symptom) => (
                <div
                  key={symptom.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    highlightedSymptom === symptom.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setHighlightedSymptom(symptom.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: 
                            symptom.severity >= 8 ? '#dc2626' :
                            symptom.severity >= 5 ? '#ea580c' :
                            symptom.severity >= 3 ? '#d97706' : '#16a34a'
                        }}
                      ></div>
                      <div>
                        <h3 className="font-medium">{symptom.name}</h3>
                        <p className="text-sm text-gray-600">{symptom.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Severity: {symptom.severity}/10
                      </div>
                      <div className="text-xs text-gray-500">
                        Position: ({symptom.x.toFixed(2)}, {symptom.y.toFixed(2)}, {symptom.z.toFixed(2)})
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Test:</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• <strong>Rotate:</strong> Click and drag to rotate the 3D model</li>
            <li>• <strong>Zoom:</strong> Use mouse wheel to zoom in/out</li>
            <li>• <strong>Add Symptoms:</strong> Click directly on the body model to add new symptoms</li>
            <li>• <strong>Select Symptoms:</strong> Click on symptom markers (colored spheres) to highlight them</li>
            <li>• <strong>Gender Toggle:</strong> Switch between male and female models</li>
            <li>• <strong>Hover:</strong> Hover over symptom markers to see tooltips</li>
          </ul>
        </div>

        {/* Symptom Reporter Modal */}
        <SymptomReporter
          isOpen={showSymptomReporter}
          onClose={() => setShowSymptomReporter(false)}
          onSymptomSubmit={handleSymptomSubmit}
          patientId="test-patient"
          gender={gender}
        />
      </div>
    </div>
  )
}