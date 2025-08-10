'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

interface Appointment {
  id: string
  doctor_name: string
  doctor_speciality: string
  appointment_date: string
  appointment_time: string
  duration: number
  type: 'in-person' | 'telemedicine' | 'phone'
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  location?: string
  notes?: string
  reminder_sent: boolean
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.payload?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const response = await fetch(`/api/patient/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        fetchAppointments() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.appointment_date + 'T' + apt.appointment_time)
    const now = new Date()

    switch (filter) {
      case 'upcoming':
        return appointmentDate >= now && apt.status === 'scheduled'
      case 'past':
        return appointmentDate < now || apt.status === 'completed'
      case 'all':
        return true
      default:
        return true
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CalendarIcon className="w-4 h-4" />
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4" />
      case 'rescheduled':
        return <ExclamationCircleIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'telemedicine':
        return <VideoCameraIcon className="w-4 h-4" />
      case 'phone':
        return <PhoneIcon className="w-4 h-4" />
      case 'in-person':
        return <MapPinIcon className="w-4 h-4" />
      default:
        return <CalendarIcon className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalendarIcon className="w-8 h-8 mr-3 text-blue-600" />
            My Appointments
          </h1>
          <p className="text-gray-600 mt-1">Manage your healthcare appointments</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Schedule New
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['upcoming', 'past', 'all'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  filter === filterOption
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {filterOption} ({filteredAppointments.length})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'upcoming' 
                ? 'You have no upcoming appointments.'
                : `No ${filter} appointments found.`}
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{appointment.doctor_name}</h3>
                          <p className="text-sm text-gray-600">{appointment.doctor_speciality}</p>
                        </div>
                      </div>
                      <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1 capitalize">{appointment.status}</span>
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        {appointment.appointment_time} ({appointment.duration} mins)
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        {getTypeIcon(appointment.type)}
                        <span className="ml-2 capitalize">{appointment.type}</span>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="w-4 h-4 mr-2" />
                          {appointment.location}
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{appointment.notes}</p>
                      </div>
                    )}
                  </div>

                  {appointment.status === 'scheduled' && (
                    <div className="flex flex-col space-y-2">
                      {appointment.type === 'telemedicine' && (
                        <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                          Join Video Call
                        </button>
                      )}
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm">
                        Reschedule
                      </button>
                      <button
                        onClick={() => cancelAppointment(appointment.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {appointments.length > 0 && (
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-white rounded-lg shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors text-left">
              <CalendarIcon className="w-6 h-6 text-blue-600 mb-2" />
              <div className="font-medium text-gray-900">Schedule Follow-up</div>
              <div className="text-sm text-gray-600">Book your next appointment</div>
            </button>
            <button className="p-4 bg-white rounded-lg shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors text-left">
              <PhoneIcon className="w-6 h-6 text-blue-600 mb-2" />
              <div className="font-medium text-gray-900">Contact Doctor</div>
              <div className="text-sm text-gray-600">Send a message or call</div>
            </button>
            <button className="p-4 bg-white rounded-lg shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors text-left">
              <VideoCameraIcon className="w-6 h-6 text-blue-600 mb-2" />
              <div className="font-medium text-gray-900">Telemedicine</div>
              <div className="text-sm text-gray-600">Schedule video consultation</div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}