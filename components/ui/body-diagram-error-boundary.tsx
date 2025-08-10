'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error }>
}

class BodyDiagramErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Body Diagram Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} />
      }

      return (
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-center p-4">
            <div className="text-red-600 text-lg mb-2">⚠️ 3D View Error</div>
            <p className="text-red-700 text-sm mb-3">
              The 3D body diagram encountered an error and couldn't load.
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Try Again
              </button>
              <p className="text-xs text-red-600">
                If this persists, please use the 2D view instead.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default BodyDiagramErrorBoundary