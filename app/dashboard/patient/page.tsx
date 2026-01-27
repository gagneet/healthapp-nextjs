'use client'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

import AppointmentsList from '@/components/patient/appointments-list'
import HealthSummary from '@/components/patient/health-summary'
import MedicationTracker from '@/components/patient/medication-tracker'
import VitalsRecorder from '@/components/patient/vitals-recorder'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { formatDateTime } from '@/lib/utils'
import {
  BeakerIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  PlayIcon,
  PlusIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import dynamicImport from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
// Dynamically import the SymptomReporter to prevent SSR/hydration issues
const SymptomReporter = dynamicImport(() => import('@/components/patient/symptom-reporter'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading symptom reporter...</p>
      </div>
    </div>
  )
})

interface PatientDashboardData {
  adherenceSummary: {
    today: {
      medicationsDue: number
      medicationsTaken: number
      vitalsDue: number
      vitalsRecorded: number
      exercisesDue: number
      exercisesCompleted: number
    }
    weekly: {
      adherenceRate: number
      missedMedications: number
      completedActivities: number
    }
    monthly: {
      overallScore: number
      trend: 'improving' | 'declining' | 'stable'
    }
  }
  upcomingEvents: ScheduledEventType[]
  overdueItems: OverdueItem[]
  recentActivities: ActivityRecord[]
  healthMetrics: {
    weight: { value: number; date: string; trend: 'up' | 'down' | 'stable' }
    bloodPressure: { systolic: number; diastolic: number; date: string }
    heartRate: { value: number; date: string }
    bloodSugar: { value: number; date: string }
  }
  alerts: AlertType[]
}

interface ScheduledEventType {
  id: string
  eventType: 'MEDICATION' | 'VITAL_CHECK' | 'EXERCISE' | 'DIET_LOG' | 'APPOINTMENT'
  title: string
  description?: string
  scheduledFor: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'SCHEDULED' | 'PENDING' | 'COMPLETED' | 'MISSED'
  eventData: any
}

interface OverdueItem {
  id: string
  type: string
  title: string
  dueDate: string
  hoursOverdue: number
  priority: string
}

interface ActivityRecord {
  id: string
  type: string
  title: string
  completedAt: string
  result: any
}

interface AlertType {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  action_required: boolean
  createdAt: string
}

// Chart colors
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6B7280'
}

const CHART_COLORS = [COLORS.success, COLORS.warning, COLORS.danger, COLORS.info]

export default function PatientDashboard() {
  const { user, getFirstName } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<PatientDashboardData | null>(null)
  const [showSymptomReporter, setShowSymptomReporter] = useState(false)
  const [showVitalsRecorder, setShowVitalsRecorder] = useState(false)
  const [showMedicationTracker, setShowMedicationTracker] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'medications' | 'vitals' | 'activities'>('overview')

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      // This would normally be an API call to your backend
      const response = await fetch(`/api/patient/dashboard/${user.profileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data.payload.data)
      } else {
        console.error('API response not OK:', response.statusText)
        setDashboardData(null)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setDashboardData(null)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Mock data generation removed - using real API data only

  const handleCompleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/patient/events/${eventId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed_at: new Date().toISOString() })
      })
      if (!response.ok) {
        const data = await response.json()
        console.error('Failed to complete event:', data.payload?.error?.message || response.statusText)
      }
      fetchDashboardData()
    } catch (error) {
      console.error('Failed to complete event:', error)
    }
  }

  const handleMarkMissed = async (eventId: string) => {
    try {
      const response = await fetch(`/api/patient/events/${eventId}/missed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ missed_at: new Date().toISOString() })
      })
      if (!response.ok) {
        const data = await response.json()
        console.error('Failed to mark event as missed:', data.payload?.error?.message || response.statusText)
      }
      fetchDashboardData()
    } catch (error) {
      console.error('Failed to mark event as missed:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200'
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'MEDIUM': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'LOW': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'MEDICATION': return <BeakerIcon className="h-5 w-5" />
      case 'VITAL_CHECK': return <HeartIcon className="h-5 w-5" />
      case 'EXERCISE': return <PlayIcon className="h-5 w-5" />
      case 'DIET_LOG': return <DocumentTextIcon className="h-5 w-5" />
      case 'APPOINTMENT': return <CalendarIcon className="h-5 w-5" />
      default: return <ClockIcon className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">Please try refreshing the page or contact support if the issue persists.</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Prepare chart data with null safety
  const adherenceToday = dashboardData?.adherenceSummary?.today || {}
  const medicationsTaken = adherenceToday.medications_taken || 0
  const medicationsDue = adherenceToday.medications_due || 0
  
  const adherenceChartData = [
    { name: 'Taken', value: medicationsTaken, color: COLORS.success },
    { name: 'Due', value: Math.max(0, medicationsDue - medicationsTaken), color: COLORS.warning },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Health</h1>
            <p className="text-sm text-gray-600">Welcome back, {getFirstName()}</p>
          </div>
          <button
            onClick={() => setShowSymptomReporter(true)}
            className="p-2 bg-blue-600 text-white rounded-lg shadow-lg"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs - Mobile */}
      <div className="bg-white border-b px-4 md:hidden">
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'medications', label: 'Meds', icon: BeakerIcon },
            { id: 'vitals', label: 'Vitals', icon: HeartIcon },
            { id: 'activities', label: 'Activities', icon: PlayIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeView === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your medications, track vitals, and stay healthy</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowMedicationTracker(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <BeakerIcon className="h-5 w-5 mr-2" />
              Log Medication
            </button>
            <button
              onClick={() => setShowVitalsRecorder(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            >
              <HeartIcon className="h-5 w-5 mr-2" />
              Record Vitals
            </button>
            <button
              onClick={() => setShowSymptomReporter(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Report Symptom
            </button>
          </div>
        </div>

        {/* Alerts Section */}
        {dashboardData.alerts.length > 0 && (
          <div className="mb-6">
            <div className="grid gap-4">
              {dashboardData.alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  alert.type === 'error' ? 'bg-red-50 border-red-400' :
                  alert.type === 'success' ? 'bg-green-50 border-green-400' :
                  'bg-blue-50 border-blue-400'
                }`}>
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDateTime(alert.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Today's Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BeakerIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Medications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {adherenceToday.medications_taken || 0}/
                      {adherenceToday.medications_due || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <HeartIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Vitals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {adherenceToday.vitals_recorded || 0}/
                      {adherenceToday.vitals_due || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <PlayIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Exercise</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {adherenceToday.exercises_completed || 0}/
                      {adherenceToday.exercises_due || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.adherenceSummary?.monthly?.overallScore || 0}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Adherence Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Medication Adherence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={adherenceChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {adherenceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Health Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <HealthSummary patientId={user?.profileId} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upcoming Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.upcomingEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className={`p-4 rounded-lg border ${getPriorityColor(event.priority)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getEventIcon(event.eventType)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Due: {formatDateTime(event.scheduledFor)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCompleteEvent(event.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Mark as completed"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleMarkMissed(event.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Mark as missed"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {dashboardData.upcomingEvents.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No upcoming tasks. Great job staying on track! 🎉
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Items */}
          {dashboardData.overdueItems.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Overdue Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.overdueItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-lg border border-red-200 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-red-900">{item.title}</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Overdue by {item.hoursOverdue} hour{item.hoursOverdue !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-red-600 mt-2">
                            Was due: {formatDateTime(item.dueDate)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckIcon className="h-5 w-5 mr-2" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      {getEventIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{formatDateTime(activity.completedAt)}</p>
                    </div>
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                ))}
                {dashboardData.recentActivities.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No recent activities to show.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments Section */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentsList patientId={user?.profileId} limit={5} />
            </CardContent>
          </Card>
        </div>

        {/* Symptom Reporter Modal */}
        <SymptomReporter
          isOpen={showSymptomReporter}
          onClose={() => setShowSymptomReporter(false)}
          onSymptomSubmit={(symptom) => {
            console.log('Symptom reported:', symptom)
            setShowSymptomReporter(false)
            // Optionally refresh dashboard data
            fetchDashboardData()
          }}
          patientId={user?.profileId}
          gender={user?.gender === 'FEMALE' ? 'female' : 'male'}
        />

        {/* Vitals Recorder Modal */}
        <VitalsRecorder
          isOpen={showVitalsRecorder}
          onClose={() => setShowVitalsRecorder(false)}
          onVitalRecorded={(vital) => {
            console.log('Vital recorded:', vital)
            setShowVitalsRecorder(false)
            fetchDashboardData()
          }}
          patientId={user?.profileId}
        />

        {/* Medication Tracker Modal */}
        <MedicationTracker
          isOpen={showMedicationTracker}
          onClose={() => setShowMedicationTracker(false)}
          onMedicationTaken={(medication) => {
            console.log('Medication taken:', medication)
            setShowMedicationTracker(false)
            fetchDashboardData()
          }}
          patientId={user?.profileId}
        />
      </div>

      {/* Mobile Quick Actions Floating Button */}
      <div className="fixed bottom-20 right-4 md:hidden">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setShowMedicationTracker(true)}
            className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700"
            title="Log Medication"
          >
            <BeakerIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => setShowVitalsRecorder(true)}
            className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700"
            title="Record Vitals"
          >
            <HeartIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="grid grid-cols-5 py-2">
          {[
            { id: 'overview', label: 'Home', icon: ChartBarIcon },
            { id: 'medications', label: 'Meds', icon: BeakerIcon },
            { id: 'vitals', label: 'Vitals', icon: HeartIcon },
            { id: 'activities', label: 'Activity', icon: PlayIcon },
            { id: 'symptoms', label: 'Symptoms', icon: UserIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'symptoms') {
                  setShowSymptomReporter(true)
                } else if (tab.id === 'medications') {
                  setShowMedicationTracker(true)
                } else if (tab.id === 'vitals') {
                  setShowVitalsRecorder(true)
                } else {
                  setActiveView(tab.id as any)
                }
              }}
              className={`flex flex-col items-center py-2 px-1 ${
                activeView === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <tab.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
