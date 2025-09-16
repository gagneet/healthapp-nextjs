'use client'

import { formatDateTime } from '@/lib/utils'
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

interface Appointment {
  id: string
  title: string
  description?: string
  startDate: string
  startTime?: string
  endTime?: string
  type: string
  status: string
  doctor?: {
    name: string
    specialty: string
  }
  location?: string
  notes?: string
}

interface AppointmentsListProps {
  patientId?: string
  limit?: number
}

export default function AppointmentsList({ patientId, limit = 5 }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/patient/appointments/upcoming')
      const result = await response.json()

      if (response.ok) {
        setAppointments(result.payload.data.slice(0, limit))
      } else {
        setError(result.payload?.error?.message || 'Failed to load appointments')
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setError('Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'consultation':
        return <UserIcon className="h-4 w-4" />
      case 'follow-up':
        return <ClockIcon className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-20"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">{error}</p>
        <button
          onClick={fetchAppointments}
          className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
        >
          Try again
        </button>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No upcoming appointments</p>
        <p className="text-sm text-gray-400 mt-1">Your next appointments will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {getTypeIcon(appointment.type)}
                <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
              </div>
              
              {appointment.description && (
                <p className="text-sm text-gray-600 mb-2">{appointment.description}</p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatDateTime(appointment.startDate)}</span>
                </div>
                
                {appointment.startTime && (
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      {new Date(`2000-01-01T${appointment.startTime}`).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {appointment.endTime && (
                        ` - ${new Date(`2000-01-01T${appointment.endTime}`).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}`
                      )}
                    </span>
                  </div>
                )}
              </div>
              
              {appointment.doctor && (
                <div className="flex items-center space-x-1 text-sm text-gray-600 mt-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Dr. {appointment.doctor.name}</span>
                  <span className="text-gray-400">•</span>
                  <span>{appointment.doctor.specialty}</span>
                </div>
              )}
              
              {appointment.location && (
                <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{appointment.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}