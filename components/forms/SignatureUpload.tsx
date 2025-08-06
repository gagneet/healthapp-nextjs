'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { 
  PencilIcon, 
  PhotoIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface SignatureUploadProps {
  currentSignatureUrl?: string
  onSignatureChange: (signatureData: string | null) => void
  onUploadSuccess?: (url: string) => void
  onUploadError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export default function SignatureUpload({
  currentSignatureUrl,
  onSignatureChange,
  onUploadSuccess,
  onUploadError,
  disabled = false,
  className = ''
}: SignatureUploadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [mode, setMode] = useState<'draw' | 'upload' | 'view'>('view')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 200

    // Set drawing styles
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    if (mode === 'draw') {
      initializeCanvas()
    }
  }, [mode, initializeCanvas])

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    })
    startDrawing(mouseEvent as any)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    })
    draw(mouseEvent as any)
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    stopDrawing()
  }

  // Clear drawing
  const clearSignature = () => {
    initializeCanvas()
    setHasDrawn(false)
    onSignatureChange(null)
    setUploadStatus('idle')
    setStatusMessage('')
  }

  // Save drawn signature
  const saveDrawnSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return

    try {
      setUploading(true)
      
      // Convert canvas to blob
      const dataURL = canvas.toDataURL('image/png')
      
      // Convert dataURL to blob
      const response = await fetch(dataURL)
      const blob = await response.blob()

      // Create form data
      const formData = new FormData()
      formData.append('signature_image', blob, 'signature.png')

      // Upload to server
      const token = localStorage.getItem('authToken')
      const uploadResponse = await fetch('/api/doctors/profile/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await uploadResponse.json()

      if (result.status && uploadResponse.ok) {
        const signatureUrl = result.payload.data.uploaded_files.signature_image_url
        setUploadStatus('success')
        setStatusMessage('Signature uploaded successfully')
        onSignatureChange(dataURL)
        onUploadSuccess?.(signatureUrl)
        setMode('view')
      } else {
        throw new Error(result.payload?.error?.message || 'Upload failed')
      }

    } catch (error) {
      setUploadStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload signature'
      setStatusMessage(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadStatus('error')
      setStatusMessage('Please select a valid image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadStatus('error')
      setStatusMessage('File size must be less than 2MB')
      return
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('signature_image', file)

      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/doctors/profile/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.status && response.ok) {
        const signatureUrl = result.payload.data.uploaded_files.signature_image_url
        setUploadStatus('success')
        setStatusMessage('Signature uploaded successfully')
        onSignatureChange(signatureUrl)
        onUploadSuccess?.(signatureUrl)
        setMode('view')
      } else {
        throw new Error(result.payload?.error?.message || 'Upload failed')
      }

    } catch (error) {
      setUploadStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload signature'
      setStatusMessage(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setUploading(false)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'signature.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Digital Signature</h3>
        <div className="flex space-x-2">
          {!disabled && (
            <>
              <button
                type="button"
                onClick={() => setMode('draw')}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md transition-colors ${
                  mode === 'draw' 
                    ? 'text-white bg-blue-600 border-blue-600' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Draw
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md transition-colors ${
                  mode === 'upload' 
                    ? 'text-white bg-blue-600 border-blue-600' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <PhotoIcon className="h-4 w-4 mr-2" />
                Upload
              </button>
            </>
          )}
        </div>
      </div>

      {/* Current Signature Display */}
      {mode === 'view' && currentSignatureUrl && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <img
              src={currentSignatureUrl}
              alt="Current signature"
              className="mx-auto max-h-40 bg-white border rounded"
            />
            <div className="mt-4 flex justify-center space-x-3">
              {!disabled && (
                <button
                  type="button"
                  onClick={() => setMode('draw')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Redraw
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawing Canvas */}
      {mode === 'draw' && (
        <div className="border-2 border-gray-300 rounded-lg p-4">
          <div className="bg-white border rounded-lg">
            <canvas
              ref={canvasRef}
              className="block mx-auto cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Sign above using your mouse, trackpad, or finger on touch devices
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={clearSignature}
                disabled={!hasDrawn || uploading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear
              </button>
              {hasDrawn && (
                <button
                  type="button"
                  onClick={downloadSignature}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download
                </button>
              )}
              <button
                type="button"
                onClick={saveDrawnSignature}
                disabled={!hasDrawn || uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Saving...' : 'Save Signature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload */}
      {mode === 'upload' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="signature-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload signature image
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  PNG, JPG up to 2MB
                </span>
              </label>
              <input
                ref={fileInputRef}
                id="signature-upload"
                name="signature-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="sr-only"
              />
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <PhotoIcon className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Select File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-3 rounded-md ${
          uploadStatus === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-700' 
            : 'bg-red-100 border border-red-300 text-red-700'
        }`}>
          <div className="flex items-center">
            {uploadStatus === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            ) : (
              <XCircleIcon className="h-5 w-5 mr-2" />
            )}
            <span className="text-sm">{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}