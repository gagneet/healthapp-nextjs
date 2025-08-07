'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Plus, Clock, User, Users, Filter, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { DayPilotCalendar, DayPilot } from '@daypilot/daypilot-lite-react'

interface Appointment {
  id: number
  patient_name: string
  appointment_time: string
  appointment_date: string
  status: 'scheduled' | 'completed' | 'cancelled'
  type: 'consultation' | 'follow-up' | 'emergency'
}

interface Patient {
  id: string
  name: string
  medical_record_number: string
}

interface DayPilotEvent {
  id: string
  text: string
  start: string
  end: string
  backColor?: string
  borderColor?: string
  fontColor?: string
  data?: any
}

type ViewType = 'Month' | 'Week' | 'Days'

export default function DoctorCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(true)
  
  // DayPilot Calendar state
  const [calendarEvents, setCalendarEvents] = useState<DayPilotEvent[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('all')
  const [viewType, setViewType] = useState<ViewType>('Week')
  const [calendarConfig, setCalendarConfig] = useState({
    viewType: 'Week' as ViewType,
    startDate: new Date().toISOString().split('T')[0],
    locale: 'en-us'
  })

  useEffect(() => {
    // Simulate loading appointments - this would be replaced with actual API call
    setIsLoading(true)
    setTimeout(() => {
      // Mock data for demonstration
      const mockAppointments = [
        {
          id: 1,
          patient_name: 'John Doe',
          appointment_time: '09:00',
          appointment_date: selectedDate,
          status: 'scheduled',
          type: 'consultation'
        },
        {
          id: 2,
          patient_name: 'Jane Smith',
          appointment_time: '10:30',
          appointment_date: selectedDate,
          status: 'scheduled',
          type: 'follow-up'
        },
        {
          id: 3,
          patient_name: 'Mike Johnson',
          appointment_time: '14:00',
          appointment_date: selectedDate,
          status: 'completed',
          type: 'consultation'
        }
      ]
      setAppointments(mockAppointments)
      setIsLoading(false)
    }, 1000)
  }, [selectedDate])

  // Load patients for dropdown (mock data - replace with API call)
  useEffect(() => {
    const mockPatients: Patient[] = [
      { id: '1', name: 'John Doe', medical_record_number: 'MRN-001' },
      { id: '2', name: 'Jane Smith', medical_record_number: 'MRN-002' },
      { id: '3', name: 'Mike Johnson', medical_record_number: 'MRN-003' },
      { id: '4', name: 'Sarah Wilson', medical_record_number: 'MRN-004' },
      { id: '5', name: 'David Brown', medical_record_number: 'MRN-005' }
    ]
    setPatients(mockPatients)
  }, [])

  // Convert appointments to DayPilot events
  useEffect(() => {
    const convertAppointmentsToEvents = () => {
      // Extended mock data for monthly view
      const monthlyAppointments = [
        // Current week
        { id: 1, patient_name: 'John Doe', appointment_time: '09:00', appointment_date: selectedDate, status: 'scheduled', type: 'consultation' },
        { id: 2, patient_name: 'Jane Smith', appointment_time: '10:30', appointment_date: selectedDate, status: 'scheduled', type: 'follow-up' },
        // Add more appointments for the month
        { id: 4, patient_name: 'Sarah Wilson', appointment_time: '14:00', appointment_date: getDateOffset(1), status: 'scheduled', type: 'consultation' },
        { id: 5, patient_name: 'David Brown', appointment_time: '11:00', appointment_date: getDateOffset(3), status: 'completed', type: 'follow-up' },
        { id: 6, patient_name: 'John Doe', appointment_time: '15:30', appointment_date: getDateOffset(7), status: 'scheduled', type: 'emergency' },
        { id: 7, patient_name: 'Jane Smith', appointment_time: '09:30', appointment_date: getDateOffset(10), status: 'scheduled', type: 'consultation' },
        { id: 8, patient_name: 'Mike Johnson', appointment_time: '13:00', appointment_date: getDateOffset(14), status: 'cancelled', type: 'follow-up' },
      ]

      const filteredAppointments = selectedPatient === 'all' 
        ? monthlyAppointments 
        : monthlyAppointments.filter(apt => {
          const patient = patients.find(p => p.name === apt.patient_name)
          // Ensure type-safe comparison between patient ID and selectedPatient
          return patient?.id && String(patient.id) === selectedPatient
        })

      const events: DayPilotEvent[] = filteredAppointments.map(appointment => {
        const startDateTime = `${appointment.appointment_date}T${appointment.appointment_time}:00`
        const endTime = addHours(appointment.appointment_time, 1)
        const endDateTime = `${appointment.appointment_date}T${endTime}:00`

        return {
          id: appointment.id.toString(),
          text: `${appointment.patient_name} - ${appointment.type}`,
          start: startDateTime,
          end: endDateTime,
          backColor: getStatusBackColor(appointment.status),
          borderColor: getStatusBorderColor(appointment.status),
          fontColor: '#ffffff',
          data: appointment
        }
      })

      setCalendarEvents(events)
    }

    if (patients.length > 0) {
      convertAppointmentsToEvents()
    }
  }, [appointments, selectedDate, selectedPatient, patients])

  // Helper functions
  const getDateOffset = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const addHours = (time: string, hours: number) => {
    const [hour, minute] = time.split(':').map(Number)
    const newHour = hour + hours
    return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  const getStatusBackColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3b82f6'
      case 'completed': return '#10b981'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#1d4ed8'
      case 'completed': return '#059669'
      case 'cancelled': return '#dc2626'
      default: return '#374151'
    }
  }

  // Handle view type change
  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType)
    setCalendarConfig(prev => ({
      ...prev,
      viewType: newViewType
    }))
  }

  // Get calendar height based on view type
  const getCalendarHeight = () => {
    switch (viewType) {
      case 'Month': return 600
      case 'Week': return 700
      case 'Days': return 800
      default: return 600
    }
  }

  // Get days count for daily view
  const getDaysCount = () => {
    return viewType === 'Days' ? 1 : 7
  }

  // DayPilot event handlers
  const handleEventClick = (args: any) => {
    const appointment = args.e.data
    // Navigate to patient appointment page - replace with actual routing
    console.log('Navigate to patient appointment:', appointment)
    // Example: router.push(`/dashboard/doctor/patients/${appointment.patient_id}/appointments/${appointment.id}`)
    alert(`Clicked appointment: ${appointment.patient_name} - ${appointment.type}\\n\\nThis will navigate to the patient appointment page.`)
  }

  const handleTimeRangeSelected = (args: any) => {
    // Handle new appointment creation
    console.log('Create new appointment:', args.start, args.end)
    // Example: Open appointment creation modal
    alert(`Create new appointment from ${args.start} to ${args.end}`)
    args.calendar.clearSelection()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50'
      case 'completed': return 'text-green-600 bg-green-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return '👨‍⚕️'
      case 'follow-up': return '🔄'
      case 'emergency': return '🚨'
      default: return '📅'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Manage your appointments and schedule</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Widget */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
                <span className="text-gray-600">Scheduled</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                <span className="text-gray-600">Cancelled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Appointments for {new Date(selectedDate).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No appointments scheduled</p>
                <p className="text-sm text-gray-500">Select a different date or create a new appointment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getTypeIcon(appointment.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {appointment.patient_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>{appointment.appointment_time}</span>
                          <span className="text-gray-400">•</span>
                          <span className="capitalize">{appointment.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(a => a.status === 'scheduled').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DayPilot Calendar Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {viewType === 'Month' ? 'Monthly' : viewType === 'Week' ? 'Weekly' : 'Daily'} Calendar View
            </h2>
            <p className="text-gray-600">Click on appointments to view details or select empty slots to create new appointments</p>
          </div>
          
          {/* View As Dropdown and Patient Filter */}
          <div className="flex items-center gap-4">
            {/* View As Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">View as:</label>
              <div className="relative">
                <select
                  value={viewType}
                  onChange={(e) => handleViewTypeChange(e.target.value as ViewType)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Days">Daily</option>
                  <option value="Week">Weekly</option>
                  <option value="Month">Monthly</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Patient Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <label htmlFor="patient-filter" className="text-sm font-medium text-gray-700">
                Filter by Patient:
              </label>
              <select
                id="patient-filter"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Patients</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.medical_record_number})
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Manage Patients
            </Button>
          </div>
        </div>

        {/* DayPilot Calendar */}
        <Card>
          <CardContent className="p-6">
            <div style={{ height: `${getCalendarHeight()}px` }}>
              <DayPilotCalendar
                {...calendarConfig}
                events={calendarEvents}
                onEventClick={handleEventClick}
                onTimeRangeSelected={handleTimeRangeSelected}
                style={{
                  height: '100%'
                }}
                config={{
                  viewType: viewType,
                  startDate: calendarConfig.startDate,
                  locale: 'en-us',
                  heightSpec: 'Fixed',
                  height: getCalendarHeight(),
                  days: viewType === 'Days' ? getDaysCount() : undefined,
                  cellHeight: viewType === 'Month' ? 80 : viewType === 'Week' ? 60 : 40,
                  eventHeight: 25,
                  timeRangeSelectedHandling: 'Enabled',
                  eventClickHandling: 'Enabled',
                  selectMode: viewType === 'Days' ? 'Hour' : 'Day',
                  showToolTip: false,
                  eventBorderColor: '#1f2937',
                  headerDateFormat: viewType === 'Month' ? 'MMMM yyyy' : viewType === 'Week' ? 'MMMM yyyy' : 'MMMM d, yyyy',
                  hourWidth: viewType === 'Days' ? 60 : undefined,
                  businessHoursStart: '07:00',
                  businessHoursEnd: '20:00',
                  showNonBusiness: true
                }}
              />
            </div>
            
            {/* Calendar Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-6">
                <h4 className="text-sm font-medium text-gray-700">Legend:</h4>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-600">Cancelled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Features Info */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <CalendarIcon className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-900 mb-1">Enhanced Calendar Views Available</h4>
                <p className="text-sm text-green-700">
                  Switch between Daily, Weekly, and Monthly views using the "View as" dropdown. 
                  Filter by specific patients and click on appointments to view details or select empty slots to create new appointments.
                  Treatment plans and medication schedules integration coming soon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}