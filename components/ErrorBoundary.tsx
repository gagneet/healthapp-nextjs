'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { createLogger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>
}

interface State {
  hasError: boolean
  error: Error | null
}

const logger = createLogger('ErrorBoundary')

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React component error caught:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  private handleGoToDashboard = () => {
    // Clear error state and redirect to appropriate dashboard based on user
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      // Try to get user from localStorage to determine appropriate redirect
      try {
        const userString = localStorage.getItem('user')
        if (userString) {
          const user = JSON.parse(userString)
          const role = user.role?.toUpperCase()
          switch (role) {
            case 'DOCTOR':
              window.location.href = '/dashboard/doctor'
              break
            case 'PATIENT':
              window.location.href = '/dashboard/patient'
              break
            case 'ADMIN':
              window.location.href = '/dashboard/admin'
              break
            case 'HOSPITAL':
              window.location.href = '/dashboard/hospital'
              break
            default:
              window.location.href = '/'
          }
        } else {
          // No user found, redirect to home
          window.location.href = '/'
        }
      } catch (error) {
        // Error parsing user, redirect to home
        window.location.href = '/'
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Component Error
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                A component on this page crashed. This might be due to an unimplemented feature.
              </p>
              
              <div className="mt-6 flex flex-col space-y-3">
                <button
                  onClick={this.handleGoToDashboard}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard
                </button>
                
                <button
                  onClick={this.handleRetry}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack && '\n\n' + this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary