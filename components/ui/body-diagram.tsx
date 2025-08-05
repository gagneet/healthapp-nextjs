'use client'

import { useState } from 'react'

interface Symptom {
  id: string
  name: string
  severity: number
  x: number // Percentage position on the body diagram
  y: number
  description?: string
  onset_time: string
}

interface BodyDiagramProps {
  symptoms: Symptom[]
  onSymptomClick?: (symptom: Symptom) => void
  onBodyClick?: (x: number, y: number) => void
  interactive?: boolean
  view?: 'front' | 'back' | 'left' | 'right'
  onViewChange?: (view: 'front' | 'back' | 'left' | 'right') => void
  highlightedSymptom?: string | null
}

export default function BodyDiagram({ 
  symptoms = [], 
  onSymptomClick, 
  onBodyClick, 
  interactive = false,
  view = 'front',
  onViewChange,
  highlightedSymptom = null
}: BodyDiagramProps) {
  const [hoveredSymptom, setHoveredSymptom] = useState<string | null>(null)

  const handleBodyClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onBodyClick) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    
    onBodyClick(x, y)
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return '#dc2626' // Red for severe (8-10)
    if (severity >= 5) return '#ea580c' // Orange for moderate (5-7)
    if (severity >= 3) return '#d97706' // Yellow for mild (3-4)
    return '#16a34a' // Green for minimal (1-2)
  }

  const getSeveritySize = (severity: number) => {
    if (severity >= 8) return 16
    if (severity >= 5) return 12
    if (severity >= 3) return 8
    return 6
  }

  // Different body view paths
  const getBodyPaths = () => {
    const frontBodyPath = `
      M150,50 
      C140,50 135,55 135,65
      L135,80
      C135,85 130,90 120,90
      L100,90
      C90,90 85,95 85,105
      L85,200
      C85,210 80,215 70,215
      L70,280
      C70,290 75,295 85,295
      L90,295
      L90,350
      C90,360 95,365 105,365
      L120,365
      C130,365 135,360 135,350
      L135,295
      L165,295
      L165,350
      C165,360 170,365 180,365
      L195,365
      C205,365 210,360 210,350
      L210,295
      L215,295
      C225,295 230,290 230,280
      L230,215
      C230,210 225,205 215,205
      L215,200
      C215,95 210,90 200,90
      L180,90
      C170,90 165,85 165,80
      L165,65
      C165,55 160,50 150,50
      Z
    `

    const backBodyPath = `
      M150,50 
      C140,50 135,55 135,65
      L135,80
      C135,85 130,90 120,90
      L100,90
      C90,90 85,95 85,105
      L85,200
      C85,210 80,215 70,215
      L70,280
      C70,290 75,295 85,295
      L90,295
      L90,350
      C90,360 95,365 105,365
      L120,365
      C130,365 135,360 135,350
      L135,295
      L165,295
      L165,350
      C165,360 170,365 180,365
      L195,365
      C205,365 210,360 210,350
      L210,295
      L215,295
      C225,295 230,290 230,280
      L230,215
      C230,210 225,205 215,205
      L215,200
      C215,95 210,90 200,90
      L180,90
      C170,90 165,85 165,80
      L165,65
      C165,55 160,50 150,50
      Z
    `

    const sideBodyPath = `
      M150,50 
      C145,50 140,52 140,65
      L140,80
      C140,85 135,90 130,90
      L125,90
      C120,90 115,95 115,105
      L115,200
      C115,210 110,215 105,215
      L105,280
      C105,290 110,295 120,295
      L125,295
      L125,350
      C125,360 130,365 140,365
      L160,365
      C170,365 175,360 175,350
      L175,295
      L180,295
      C190,295 195,290 195,280
      L195,215
      C195,210 190,205 185,205
      L185,200
      C185,95 180,90 175,90
      L170,90
      C165,90 160,85 160,80
      L160,65
      C160,52 155,50 150,50
      Z
    `

    return {
      front: frontBodyPath,
      back: backBodyPath,
      left: sideBodyPath,
      right: sideBodyPath
    }
  }

  const bodyPaths = getBodyPaths()
  const currentBodyPath = bodyPaths[view]

  const handleViewChange = (newView: 'front' | 'back' | 'left' | 'right') => {
    onViewChange?.(newView)
  }

  const getViewIcon = (viewType: string) => {
    switch (viewType) {
      case 'front': return '👤'
      case 'back': return '👥'
      case 'left': return '🫴'
      case 'right': return '🤚'
      default: return '👤'
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          {(['front', 'left', 'back', 'right'] as const).map((viewType) => (
            <button
              key={viewType}
              onClick={() => handleViewChange(viewType)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                view === viewType 
                  ? 'bg-white text-gray-900 shadow-sm transform scale-105' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              title={`${viewType.charAt(0).toUpperCase() + viewType.slice(1)} view`}
            >
              <span>{getViewIcon(viewType)}</span>
              <span className="capitalize">{viewType}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rotation Instructions */}
      <div className="text-center mb-2">
        <p className="text-xs text-gray-500">
          Click the view buttons to rotate the body diagram
        </p>
      </div>

      <div className="relative bg-white border border-gray-200 rounded-lg p-4">
        {/* View indicator */}
        <div className="absolute top-2 right-2 bg-gray-100 rounded-full px-2 py-1">
          <span className="text-xs text-gray-600">{view.toUpperCase()}</span>
        </div>

        <svg
          viewBox="0 0 300 400"
          className={`w-full h-auto transition-transform duration-300 ${
            interactive ? 'cursor-crosshair' : ''
          } ${view === 'left' ? 'scale-x-[-1]' : ''}`}
          onClick={handleBodyClick}
        >
          {/* Body outline with smooth transition */}
          <path
            d={currentBodyPath}
            fill="rgba(229, 231, 235, 0.3)"
            stroke="#9ca3af"
            strokeWidth="2"
            className="hover:fill-gray-200 transition-all duration-300"
          />

          {/* Head */}
          <circle
            cx="150"
            cy="35"
            r="25"
            fill="rgba(229, 231, 235, 0.3)"
            stroke="#9ca3af"
            strokeWidth="2"
            className="hover:fill-gray-200 transition-colors"
          />

          {/* Symptom markers */}
          {symptoms.map((symptom) => {
            const isHighlighted = highlightedSymptom === symptom.id
            const isHovered = hoveredSymptom === symptom.id
            
            return (
              <g key={symptom.id}>
                {/* Highlight ring for selected symptom */}
                {isHighlighted && (
                  <circle
                    cx={(symptom.x / 100) * 300}
                    cy={(symptom.y / 100) * 400}
                    r={getSeveritySize(symptom.severity) + 8}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    className="animate-pulse"
                  />
                )}
                
                <circle
                  cx={(symptom.x / 100) * 300}
                  cy={(symptom.y / 100) * 400}
                  r={getSeveritySize(symptom.severity)}
                  fill={getSeverityColor(symptom.severity)}
                  stroke={isHighlighted ? "#3b82f6" : "white"}
                  strokeWidth={isHighlighted ? "3" : "2"}
                  className={`cursor-pointer transition-all duration-200 ${
                    isHighlighted ? 'drop-shadow-lg' : 'hover:opacity-80'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSymptomClick?.(symptom)
                  }}
                  onMouseEnter={() => setHoveredSymptom(symptom.id)}
                  onMouseLeave={() => setHoveredSymptom(null)}
                />
              
                {/* Symptom label on hover */}
                {hoveredSymptom === symptom.id && (
                  <g>
                    <rect
                      x={(symptom.x / 100) * 300 - 40}
                      y={(symptom.y / 100) * 400 - 35}
                      width="80"
                      height="25"
                      fill="rgba(0, 0, 0, 0.8)"
                      rx="4"
                    />
                    <text
                      x={(symptom.x / 100) * 300}
                      y={(symptom.y / 100) * 400 - 18}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      className="pointer-events-none"
                    >
                      {symptom.name}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
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

        {interactive && (
          <p className="text-xs text-gray-500 mt-2">
            Click on the body diagram to add a new symptom location
          </p>
        )}
      </div>
    </div>
  )
}