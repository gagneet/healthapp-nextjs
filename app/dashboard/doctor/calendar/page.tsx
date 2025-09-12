'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Plus, Clock, User, Users, Filter, ChevronDown, ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { DayPilotCalendar, DayPilotMonth, DayPilot } from '@daypilot/daypilot-lite-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show' | 'in_progress';
  appointmentType: 'consultation' | 'follow-up' | 'emergency' | 'check-up';
  patient: {
    id: string;
    name: string;
    email: string;
  };
  carePlan: {
    id: string;
    name: string;
  } | null;
  priority: string;
}

interface Patient {
  id: string
  name: string
  medicalRecordNumber: string
}

interface DayPilotEvent {
  id: string;
  text: string;
  start: string;
  end: string;
  backColor?: string;
  borderColor?: string;
  fontColor?: string;
  patient: {
    id: string;
    name: string;
    email: string;
  };
  appointmentType: 'consultation' | 'follow-up' | 'emergency' | 'check-up';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show' | 'in_progress';
}

interface HandleEventClickArgs {
  e: {
    data: DayPilotEvent;
  };
}

type ViewType = 'Month' | 'Week' | 'Days'

export default function DoctorCalendarPage() {
  const { data: session } = useSession()
  const router = useRouter()
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

  const [error, setError] = useState<string | null>(null)
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null)

  // First, get the doctor profile ID from user ID
  useEffect(() => {
    const validateSession = () => {
      if (session === undefined) {
        return false; // Session still loading
      }
      if (session === null) {
        setError("Please sign in to access the calendar.");
        setIsLoading(false);
        return false;
      }
      if (!session.user?.businessId) {
        setError("Doctor profile not properly configured. Please contact support.");
        setIsLoading(false);
        return false;
      }
      return true;
    };

    const fetchDoctorProfile = async () => {
      if (!validateSession()) {
        return;
      }

      try {
        const response = await fetch(`/api/doctors/profile/${session.user.businessId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
          throw new Error(errorData.error?.message || errorData.message || `Failed to fetch doctor profile: ${response.status}`);
        }
        
        const apiResponse = await response.json();
        if (!apiResponse.success || !apiResponse.data?.doctor) {
          throw new Error(apiResponse.error?.message || 'Doctor profile data not found in response');
        }

        setDoctorProfileId(apiResponse.data.doctor.id);
      } catch (error) {
        console.error('Failed to fetch doctor profile:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    }

    fetchDoctorProfile()
  }, [session])

  useEffect(() => {
    const fetchCalendarData = async () => {
      if (!doctorProfileId) return

      setIsLoading(true)
      setError(null)

      try {
        const viewTypeMap: { [key in ViewType]: string } = {
          Days: 'day',
          Week: 'week',
          Month: 'month',
        }
        const apiViewType = viewTypeMap[viewType]
        const response = await fetch(`/api/appointments/calendar/doctor/${doctorProfileId}?view=${apiViewType}&startDate=${calendarConfig.startDate}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch calendar data')
        }

        if (data.calendar) {
          const fetchedAppointments = data.calendar.events.filter((event: any) => event.type === 'appointment')
          setAppointments(fetchedAppointments as Appointment[])

          // Extract unique patients from appointments
          const uniquePatients = (fetchedAppointments as Appointment[]).reduce((acc: Patient[], appointment: Appointment) => {
            if (!acc.find(p => p.id === appointment.patient.id)) {
              acc.push({
                id: appointment.patient.id,
                name: appointment.patient.name,
                medicalRecordNumber: `MRN-${appointment.patient.id}`
              })
            }
            return acc
          }, [])
          setPatients(uniquePatients)
        }
      } catch (error) {
        console.error('Failed to fetch calendar data:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalendarData()
  }, [doctorProfileId, selectedDate, viewType, calendarConfig.startDate])

  // Convert appointments to DayPilot events
  useEffect(() => {
    const convertAppointmentsToEvents = () => {
      const filteredAppointments = selectedPatient === 'all'
        ? appointments
        : appointments.filter(apt => apt.patient.id === selectedPatient)

      const events: DayPilotEvent[] = filteredAppointments.map(appointment => {
        return {
          id: appointment.id,
          text: `${appointment.patient.name} - ${appointment.appointmentType}`,
          start: appointment.startTime,
          end: appointment.endTime,
          backColor: getStatusBackColor(appointment.status),
          borderColor: getStatusBorderColor(appointment.status),
          fontColor: '#ffffff',
          patient: appointment.patient,
          appointmentType: appointment.appointmentType,
          status: appointment.status,
        }
      })

      setCalendarEvents(events)
    }

    if (appointments.length > 0) {
      convertAppointmentsToEvents()
    }
  }, [appointments, selectedPatient])

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

  // Navigation handlers
  const handlePreviousClick = () => {
    const currentDate = new Date(calendarConfig.startDate)
    
    if (viewType === 'Month') {
      currentDate.setMonth(currentDate.getMonth() - 1)
    } else if (viewType === 'Week') {
      currentDate.setDate(currentDate.getDate() - 7)
    } else {
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    setCalendarConfig(prev => ({
      ...prev,
      startDate: currentDate.toISOString().split('T')[0]
    }))
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  const handleNextClick = () => {
    const currentDate = new Date(calendarConfig.startDate)
    
    if (viewType === 'Month') {
      currentDate.setMonth(currentDate.getMonth() + 1)
    } else if (viewType === 'Week') {
      currentDate.setDate(currentDate.getDate() + 7)
    } else {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    setCalendarConfig(prev => ({
      ...prev,
      startDate: currentDate.toISOString().split('T')[0]
    }))
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  const handleTodayClick = () => {
    const today = new Date().toISOString().split('T')[0]
    setCalendarConfig(prev => ({
      ...prev,
      startDate: today
    }))
    setSelectedDate(today)
  }

  // Get calendar height based on view type
  const getCalendarHeight = useCallback(() => {
    switch (viewType) {
      case 'Month': return 600
      case 'Week': return 700
      case 'Days': return 800
      default: return 600
    }
  }, [viewType])

  // Get days count for daily view
  const getDaysCount = () => {
    return viewType === 'Days' ? 1 : 7
  }

  // DayPilot event handlers
  const handleEventClick = (args: HandleEventClickArgs) => {
    const appointment = args.e.data;

    if (appointment && appointment.patient && appointment.patient.id) {
      console.log('Navigating to patient:', appointment.patient.id)
      router.push(`/dashboard/doctor/patients/${appointment.patient.id}?appointment=${appointment.id}`)
    } else {
      console.error('Navigation failed: appointment data or patient ID is missing.', args.e.data)
      toast.error('Could not navigate to appointment details. Data is missing.')
    }
  }

  const handleTimeRangeSelected = (args: any) => {
    // Handle new appointment creation
    console.log('Create new appointment:', args.start, args.end)
    // Example: Open appointment creation modal
    
    const startDate = new Date(args.start)
    const endDate = new Date(args.end)
    
    if (viewType === 'Month') {
      // For monthly view, show day-level appointment creation
      alert(`Create new appointment on ${startDate.toDateString()}`)
      // Clear selection for monthly view
      if (args.calendar && args.calendar.clearSelection) {
        args.calendar.clearSelection()
      }
    } else {
      // For weekly/daily view, show time-specific appointment creation
      const timeRange = `${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`
      alert(`Create new appointment from ${timeRange} on ${startDate.toDateString()}`)
      // Clear selection for calendar view
      if (args.calendar && args.calendar.clearSelection) {
        args.calendar.clearSelection()
      }
    }
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
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
                        {getTypeIcon(appointment.appointmentType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {appointment.patient.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(appointment.startTime), 'p')}</span>
                          <span className="text-gray-400">•</span>
                          <span className="capitalize">{appointment.appointmentType}</span>
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
                    {patient.name} ({patient.medicalRecordNumber})
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
                  {/* Calendar Navigation Controls */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                      <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={handlePreviousClick}>
                              <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleTodayClick}>
                              <Home className="h-4 w-4 mr-1" />
                              Today
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleNextClick}>
                              <ChevronRight className="h-4 w-4" />
                          </Button>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                          {new Date(calendarConfig.startDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              ...((viewType !== 'Month' && viewType !== 'Monthly') && { day: 'numeric' })
                          })}
                      </div>
                  </div>
                  <div style={{ height: `${getCalendarHeight()}px` }}>
                      {(viewType === 'Month' || viewType === 'Monthly') ? (
                          <DayPilotMonth
                              startDate={calendarConfig.startDate}
                              events={calendarEvents}
                              onEventClick={handleEventClick}
                              onTimeRangeSelected={handleTimeRangeSelected}
                              {...({ config: {
                                      startDate: calendarConfig.startDate,
                                      locale: 'en-us',
                                      heightSpec: 'Fixed',
                                      height: getCalendarHeight(),
                                      cellHeight: 80,
                                      eventHeight: 25,
                                      timeRangeSelectedHandling: 'Enabled',
                                      eventClickHandling: 'Enabled',
                                      showToolTip: false,
                                      eventBorderColor: '#1f2937',
                                      headerDateFormat: 'MMMM yyyy',
                                      dayHeaderHeight: 30,
                                      weekStarts: 0, // Sunday = 0, Monday = 1
                                      showWeekNumbers: false,
                                      businessBeginsHour: 7,
                                      businessEndsHour: 20,
                                      eventStackingLineHeight: 20
                                  }} as any)}
                          />
                      ) : (
                          <DayPilotCalendar
                              key={viewType}
                              events={calendarEvents}
                              onEventClick={handleEventClick}
                              onTimeRangeSelected={handleTimeRangeSelected}
                              // viewType: 'Days' shows daily view, 'Week' shows weekly view
                              viewType={viewType === 'Days' ? 'Days' : 'Week'}
                              startDate={calendarConfig.startDate}
                              locale="en-us"
                              heightSpec="Full"
                              height={getCalendarHeight()}
                              days={viewType === 'Days' ? 1 : 7}
                              cellHeight={viewType === 'Week' ? 60 : 40}
                              timeRangeSelectedHandling="Enabled"
                              eventClickHandling="Enabled"
                              showToolTip={false}
                              headerDateFormat={viewType === 'Week' ? 'MMMM yyyy' : 'MMMM d, yyyy'}
                              hourWidth={60}
                              timeFormat="Clock12Hours"
                          />
                      )}
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
                  Switch between Daily, Weekly, and Monthly views using the &quot;View as&quot; dropdown. 
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