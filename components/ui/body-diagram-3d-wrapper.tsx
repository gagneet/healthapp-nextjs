'use client'

import { useState, useEffect } from 'react'
import BodyDiagram3DSimple from './body-diagram-3d-simple'

interface Symptom {
  id: string
  name: string
  severity: number
  x: number
  y: number
  z?: number
  description?: string
  onsetTime: string
}

interface BodyDiagram3DWrapperProps {
  symptoms: Symptom[]
  onSymptomClick?: (symptom: Symptom) => void
  onBodyClick?: (position: any) => void
  interactive?: boolean
  gender?: 'male' | 'female'
  highlightedSymptom?: string | null
}

export default function BodyDiagram3DWrapper(props: BodyDiagram3DWrapperProps) {
  const [hasError, setHasError] = useState(false)
  const [Component, setComponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadComponent = async () => {
      try {
        // Try to load the advanced 3D component
        const { default: AdvancedComponent } = await import('./body-diagram-3d')
        if (mounted) {
          setComponent(() => AdvancedComponent)
          setLoading(false)
        }
      } catch (error) {
        console.warn('Advanced 3D component failed to load, using fallback:', error)
        if (mounted) {
          setHasError(true)
          setComponent(() => BodyDiagram3DSimple)
          setLoading(false)
        }
      }
    }

    loadComponent()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading 3D body diagram...</p>
        </div>
      </div>
    )
  }

  if (hasError || !Component) {
    return <BodyDiagram3DSimple {...props} />
  }

  return <Component {...props} />
}