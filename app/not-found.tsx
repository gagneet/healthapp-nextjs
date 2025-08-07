'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createLogger } from '@/lib/logger'
import { useEffect } from 'react'

const logger = createLogger('NotFound')

export default function NotFound() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    logger.warn('404 page accessed:', window.location.pathname)
  }, [])

  const handleGoBack = () => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'DOCTOR':
          router.push('/dashboard/doctor')
          break
        case 'PATIENT':
          router.push('/dashboard/patient')
          break
        case 'HOSPITAL_ADMIN':
        case 'SYSTEM_ADMIN':
          router.push('/dashboard/admin')
          break
        default:
          router.push('/dashboard')
      }
    } else {
      router.push('/')
    }
  }

  const handleGoToDashboard = () => {
    if (isAuthenticated && user) {
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
      router.push('/auth/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.816-6.207-2.18C4.246 11.227 2.883 8.407 4.559 6.207A9.958 9.958 0 0112 4c.686 0 1.348.074 1.979.214A7.014 7.014 0 0121 12a9.958 9.958 0 01-8 4.9V19c0 .552-.448 1-1 1s-1-.448-1-1v-2.1z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Page Not Found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            The page you're looking for doesn't exist or hasn't been implemented yet.
          </p>
          
          <div className="mt-6 flex flex-col space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isAuthenticated && user ? `Go to ${user.role === 'DOCTOR' ? 'Doctor' : user.role === 'PATIENT' ? 'Patient' : 'Admin'} Dashboard` : 'Go Home'}
            </button>
            
            {isAuthenticated && (
              <button
                onClick={handleGoToDashboard}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Main Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}