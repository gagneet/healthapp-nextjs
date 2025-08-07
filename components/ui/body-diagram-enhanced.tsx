'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import BodyDiagram from './body-diagram'

// Dynamically import 3D component to prevent SSR issues with Three.js
const BodyDiagram3D = dynamic(() => import('./body-diagram-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-500">Loading 3D body diagram...</p>
      </div>
    </div>
  )
})

interface Symptom {
  id: string
  name: string
  severity: number
  x: number
  y: number
  z?: number // Optional Z coordinate for 3D
  description?: string
  onset_time: string
}

interface BodyDiagramEnhancedProps {
  symptoms: Symptom[]
  onSymptomClick?: (symptom: Symptom) => void
  onBodyClick?: (x: number, y: number, z?: number) => void
  interactive?: boolean
  view?: 'front' | 'back' | 'left' | 'right'
  onViewChange?: (view: 'front' | 'back' | 'left' | 'right') => void
  highlightedSymptom?: string | null
  gender?: 'male' | 'female'
}

export default function BodyDiagramEnhanced({
  symptoms = [],
  onSymptomClick,
  onBodyClick,
  interactive = false,
  view = 'front',
  onViewChange,
  highlightedSymptom = null,
  gender = 'male'
}: BodyDiagramEnhancedProps) {
  const [mode, setMode] = useState<'2d' | '3d'>('2d')

  // Convert 3D coordinates to 2D for legacy support
  const symptoms2D = symptoms.map(symptom => ({
    ...symptom,
    // If z coordinate exists, use it to adjust x,y positions for 2D projection
    x: symptom.z !== undefined ? symptom.x : symptom.x,
    y: symptom.z !== undefined ? symptom.y : symptom.y
  }))

  // Convert 3D coordinates for 3D view
  const symptoms3D = symptoms.map(symptom => ({
    ...symptom,
    x: symptom.x,
    y: symptom.y,
    z: symptom.z || 0 // Default Z to 0 if not specified
  }))

  const handle2DBodyClick = (x: number, y: number) => {
    onBodyClick?.(x, y, 0) // Add default Z coordinate
  }

  const handle3DBodyClick = (position: any) => {
    // Convert Three.js Vector3 position to normalized coordinates
    const x = Math.max(-1, Math.min(1, position.x / 2))
    const y = Math.max(-1, Math.min(1, position.y / 2))
    const z = Math.max(-1, Math.min(1, position.z / 2))
    onBodyClick?.(x * 50 + 50, y * 50 + 50, z) // Convert to percentage for 2D compatibility
  }

  return (
    <div className="w-full">
      {/* Mode Toggle */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setMode('2d')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              mode === '2d'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>📋</span>
            <span>2D View</span>
          </button>
          <button
            onClick={() => setMode('3d')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              mode === '3d'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>🎭</span>
            <span>3D View</span>
          </button>
        </div>
      </div>

      {/* Render appropriate diagram based on mode */}
      {mode === '2d' ? (
        <BodyDiagram
          symptoms={symptoms2D}
          onSymptomClick={onSymptomClick}
          onBodyClick={handle2DBodyClick}
          interactive={interactive}
          view={view}
          onViewChange={onViewChange}
          highlightedSymptom={highlightedSymptom}
        />
      ) : (
        <BodyDiagram3D
          symptoms={symptoms3D}
          onSymptomClick={onSymptomClick}
          onBodyClick={handle3DBodyClick}
          interactive={interactive}
          gender={gender}
          highlightedSymptom={highlightedSymptom}
        />
      )}

      {/* Feature info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          {mode === '2d' 
            ? 'Switch to 3D view for interactive gender-specific models'
            : `Showing ${gender} 3D model - switch to 2D for traditional diagram views`
          }
        </p>
      </div>
    </div>
  )
}