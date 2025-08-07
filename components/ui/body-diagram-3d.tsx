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
  const groupRef = useRef<THREE.Group>(null)
  
  const handleBodyPartClick = (event: THREE.Event, bodyPartName: string) => {
    if (!interactive || !onBodyClick) return
    
    event.stopPropagation()
    const intersect = event.intersections?.[0]
    if (intersect?.point) {
      // Add body part information to the click event
      const position = new THREE.Vector3()
      position.copy(intersect.point)
      position.bodyPart = bodyPartName // Add custom property for body part identification
      onBodyClick(position)
    }
  }

  // Different colors for male/female
  const bodyColor = gender === 'female' ? '#fce7f3' : '#e0f2fe'
  const skinColor = gender === 'female' ? '#f3d5d1' : '#e8c5a0'

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 3.5, 0]} onClick={(e) => handleBodyPartClick(e, 'head')}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 2.8, 0]} onClick={(e) => handleBodyPartClick(e, 'neck')}>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 1.2, 0]} onClick={(e) => handleBodyPartClick(e, 'chest')}>
        <boxGeometry args={[1.8, 2.4, 0.8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-1.2, 1.8, 0]} onClick={(e) => handleBodyPartClick(e, 'left_arm')}>
        <cylinderGeometry args={[0.2, 0.25, 1.4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[1.2, 1.8, 0]} onClick={(e) => handleBodyPartClick(e, 'right_arm')}>
        <cylinderGeometry args={[0.2, 0.25, 1.4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Forearms */}
      <mesh position={[-1.2, 0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.0, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[1.2, 0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.0, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Hands */}
      <mesh position={[-1.2, 0.0, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[1.2, 0.0, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Hips/Pelvis */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.8, 0.9, 0.6, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      
      {/* Thighs */}
      <mesh position={[-0.4, -1.2, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 1.6, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.4, -1.2, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 1.6, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      
      {/* Knees */}
      <mesh position={[-0.4, -2.1, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.4, -2.1, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Shins */}
      <mesh position={[-0.4, -3.0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 1.4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.4, -3.0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 1.4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      
      {/* Feet */}
      <mesh position={[-0.4, -3.9, 0.1]}>
        <boxGeometry args={[0.3, 0.2, 0.6]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.4, -3.9, 0.1]}>
        <boxGeometry args={[0.3, 0.2, 0.6]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
    </group>
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

  // Convert 2D coordinates to 3D body coordinates
  const convertedX = (symptom.x / 100 - 0.5) * 3 // Map 0-100 to body width
  const convertedY = (symptom.y / 100 - 0.5) * -7 + 0.5 // Map 0-100 to body height (inverted Y)
  const convertedZ = symptom.z + 0.5 // Add offset from body surface

  return (
    <group position={[convertedX, convertedY, convertedZ]}>
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
              gl={{ 
                preserveDrawingBuffer: true,
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance'
              }}
              onContextLost={(e) => {
                console.warn('WebGL context lost, preventing default behavior')
                e.preventDefault()
              }}
              onContextRestore={() => {
                console.log('WebGL context restored')
              }}
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