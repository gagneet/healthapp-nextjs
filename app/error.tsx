'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createLogger } from '@/lib/logger'

const logger = createLogger('GlobalError')

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error for debugging
    logger.error('Application error occurred:', error)
  }, [error])

  const handleGoToDashboard = () => {
    // Navigate to appropriate dashboard based on user role
    if (typeof window !== 'undefined') {
      try {
        const userString = localStorage.getItem('user')
        if (userString) {
          const user = JSON.parse(userString)
          const role = user.role?.toUpperCase()
          switch (role) {
            case 'DOCTOR':
              router.push('/dashboard/doctor')
              break
            case 'PATIENT':
              router.push('/dashboard/patient')
              break
            case 'ADMIN':
              router.push('/dashboard/admin')
              break
            case 'HOSPITAL':
              router.push('/dashboard/hospital')
              break
            default:
              router.push('/')
          }
        } else {
          router.push('/')
        }
      } catch (error) {
        router.push('/')
      }
    }
  }

  const handleRetry = () => {
    reset()
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
            Something went wrong!
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            The page you're trying to access encountered an error or might not be fully implemented yet.
          </p>
          
          <div className="mt-6 flex flex-col space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={handleRetry}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}