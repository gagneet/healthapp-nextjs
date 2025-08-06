'use client'

import { useState, useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Html, useHelper } from '@react-three/drei'
import * as THREE from 'three'

interface Symptom {
  id: string
  name: string
  severity: number
  x: number // 3D position X (-1 to 1)
  y: number // 3D position Y (-1 to 1)
  z: number // 3D position Z (-1 to 1)
  description?: string
  onset_time: string
}

interface BodyDiagram3DProps {
  symptoms: Symptom[]
  onSymptomClick?: (symptom: Symptom) => void
  onBodyClick?: (position: THREE.Vector3) => void
  interactive?: boolean
  gender?: 'male' | 'female'
  highlightedSymptom?: string | null
}

// 3D Human Body Model Component
function HumanBodyModel({ gender, onBodyClick, interactive }: {
  gender: 'male' | 'female'
  onBodyClick?: (position: THREE.Vector3) => void
  interactive?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Create a basic human-shaped geometry
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    
    // Head (circle at top)
    const headRadius = 0.8
    const headCenter = new THREE.Vector2(0, 4)
    shape.moveTo(headRadius, 4)
    shape.absarc(headCenter.x, headCenter.y, headRadius, 0, Math.PI * 2, false)
    
    // Body outline
    shape.moveTo(-1.2, 3) // Left shoulder
    shape.lineTo(-1.2, 1) // Left side
    shape.lineTo(-0.8, -1) // Left hip
    shape.lineTo(-0.6, -3.5) // Left leg
    shape.lineTo(-0.2, -3.5) // Left foot
    shape.lineTo(0.2, -3.5) // Right foot  
    shape.lineTo(0.6, -3.5) // Right leg
    shape.lineTo(0.8, -1) // Right hip
    shape.lineTo(1.2, 1) // Right side
    shape.lineTo(1.2, 3) // Right shoulder
    shape.lineTo(0.8, 3.2) // Neck right
    shape.lineTo(-0.8, 3.2) // Neck left
    shape.lineTo(-1.2, 3) // Close to left shoulder

    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 0.1,
      bevelThickness: 0.1
    }

    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [])

  const handleClick = (event: THREE.Event) => {
    if (!interactive || !onBodyClick) return
    
    event.stopPropagation()
    const intersect = event.intersections?.[0]
    if (intersect?.point) {
      onBodyClick(intersect.point)
    }
  }

  // Different colors for male/female
  const bodyColor = gender === 'female' ? '#fce7f3' : '#e0f2fe'
  const outlineColor = gender === 'female' ? '#ec4899' : '#0284c7'

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onClick={handleClick}
      position={[0, 0, 0]}
    >
      <meshStandardMaterial 
        color={bodyColor}
        transparent
        opacity={0.8}
      />
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color={outlineColor} linewidth={2} />
      </lineSegments>
    </mesh>
  )
}

// Symptom Marker Component
function SymptomMarker({ 
  symptom, 
  onClick, 
  isHighlighted 
}: {
  symptom: Symptom
  onClick?: (symptom: Symptom) => void
  isHighlighted?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2
    }
  })

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return '#dc2626' // Red for severe (8-10)
    if (severity >= 5) return '#ea580c' // Orange for moderate (5-7)
    if (severity >= 3) return '#d97706' // Yellow for mild (3-4)
    return '#16a34a' // Green for minimal (1-2)
  }

  const getSeveritySize = (severity: number) => {
    if (severity >= 8) return 0.15
    if (severity >= 5) return 0.12
    if (severity >= 3) return 0.08
    return 0.06
  }

  const handleClick = (event: THREE.Event) => {
    event.stopPropagation()
    onClick?.(symptom)
  }

  return (
    <group position={[symptom.x * 2, symptom.y * 2, symptom.z * 2 + 0.5]}>
      {/* Highlight ring for selected symptom */}
      {isHighlighted && (
        <mesh>
          <ringGeometry args={[getSeveritySize(symptom.severity) + 0.05, getSeveritySize(symptom.severity) + 0.1, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
        </mesh>
      )}
      
      {/* Main symptom marker */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[getSeveritySize(symptom.severity), 16, 16]} />
        <meshStandardMaterial 
          color={getSeverityColor(symptom.severity)}
          emissive={isHighlighted ? '#1e40af' : undefined}
          emissiveIntensity={isHighlighted ? 0.3 : 0}
        />
      </mesh>

      {/* Tooltip on hover */}
      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-black text-white px-2 py-1 rounded text-sm whitespace-nowrap pointer-events-none">
            <div className="font-medium">{symptom.name}</div>
            <div className="text-xs">Severity: {symptom.severity}/10</div>
          </div>
        </Html>
      )}
    </group>
  )
}

// Camera Controls Component
function CameraControls() {
  const { camera } = useThree()
  
  // Set initial camera position
  camera.position.set(0, 0, 8)
  camera.lookAt(0, 0, 0)
  
  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={3}
      maxDistance={15}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
    />
  )
}

// Scene Component
function Scene({
  symptoms,
  onSymptomClick,
  onBodyClick,
  interactive,
  gender = 'male',
  highlightedSymptom
}: BodyDiagram3DProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} />
      
      {/* Human Body Model */}
      <HumanBodyModel 
        gender={gender}
        onBodyClick={onBodyClick}
        interactive={interactive}
      />
      
      {/* Symptom Markers */}
      {symptoms.map((symptom) => (
        <SymptomMarker
          key={symptom.id}
          symptom={symptom}
          onClick={onSymptomClick}
          isHighlighted={highlightedSymptom === symptom.id}
        />
      ))}
      
      {/* Camera Controls */}
      <CameraControls />
      
      {/* Grid helper for reference */}
      <gridHelper args={[10, 10]} position={[0, -4, 0]} />
    </>
  )
}

// Loading component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-96 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading 3D Body Diagram...</p>
      </div>
    </div>
  )
}

export default function BodyDiagram3D({
  symptoms = [],
  onSymptomClick,
  onBodyClick,
  interactive = false,
  gender = 'male',
  highlightedSymptom = null
}: BodyDiagram3DProps) {
  const [view, setView] = useState<'front' | 'back' | 'left' | 'right'>('front')

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return '#dc2626'
    if (severity >= 5) return '#ea580c' 
    if (severity >= 3) return '#d97706'
    return '#16a34a'
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Gender and View Controls */}
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
        
        <div className="text-sm text-gray-500">
          🖱️ Click + drag to rotate • Scroll to zoom
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="h-96 w-full">
          <Suspense fallback={<LoadingFallback />}>
            <Canvas
              camera={{ position: [0, 0, 8], fov: 50 }}
              style={{ background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)' }}
            >
              <Scene
                symptoms={symptoms}
                onSymptomClick={onSymptomClick}
                onBodyClick={onBodyClick}
                interactive={interactive}
                gender={gender}
                highlightedSymptom={highlightedSymptom}
              />
            </Canvas>
          </Suspense>
        </div>

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
          Click on the 3D body model to add a new symptom location
        </p>
      )}

      {/* Symptom Count */}
      {symptoms.length > 0 && (
        <div className="mt-2 text-center text-sm text-gray-600">
          Showing {symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''} on {gender} model
        </div>
      )}
    </div>
  )
}