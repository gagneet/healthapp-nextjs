'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PlusIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  PillIcon,
  HeartIcon,
  UserIcon,
  DocumentTextIcon,
  BellIcon,
  CameraIcon,
  DownloadIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { formatDate, formatDateTime } from '@/lib/utils'
import { createLogger } from '@/lib/logger'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import SymptomReporter from '@/components/patient/symptom-reporter'

interface PatientDashboardStats {
  medications_due_today: number
  missed_medications: number
  upcoming_appointments: number
  vitals_pending: number
  adherence_rate: number
  next_appointment_date?: string
}

interface MedicationReminder {
  id: string
  name: string
  dosage: string
  time: string
  taken: boolean
  is_critical: boolean
  instructions?: string
}

interface VitalReading {
  id: string
  type: string
  value: number
  unit: string
  reading_time: string
  is_flagged: boolean
  target_range?: { min: number; max: number }
}

interface Symptom {
  id: string
  name: string
  severity: number
  body_location?: string
  description?: string
  recorded_at: string
}

const mockStats: PatientDashboardStats = {
  medications_due_today: 4,
  missed_medications: 2,
  upcoming_appointments: 1,
  vitals_pending: 3,
  adherence_rate: 87,
  next_appointment_date: '2024-02-01T10:00:00Z',
}

const mockMedicationReminders: MedicationReminder[] = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    time: '08:00',
    taken: true,
    is_critical: true,
    instructions: 'Take with water, before breakfast'
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    time: '12:00',
    taken: false,
    is_critical: true,
    instructions: 'Take with lunch'
  },
  {
    id: '3',
    name: 'Atorvastatin',
    dosage: '20mg',
    time: '20:00',
    taken: false,
    is_critical: false,
    instructions: 'Take at bedtime'
  },
  {
    id: '4',
    name: 'Metformin',
    dosage: '500mg',
    time: '20:00',
    taken: false,
    is_critical: true,
    instructions: 'Take with dinner'
  },
]

const mockVitalReadings: VitalReading[] = [
  {
    id: '1',
    type: 'Blood Pressure',
    value: 142,
    unit: 'mmHg',
    reading_time: '2024-01-22T08:30:00Z',
    is_flagged: true,
    target_range: { min: 90, max: 120 }
  },
  {
    id: '2',
    type: 'Blood Glucose',
    value: 125,
    unit: 'mg/dL',
    reading_time: '2024-01-22T09:00:00Z',
    is_flagged: false,
    target_range: { min: 70, max: 140 }
  },
  {
    id: '3',
    type: 'Weight',
    value: 78.5,
    unit: 'kg',
    reading_time: '2024-01-22T07:00:00Z',
    is_flagged: false,
    target_range: { min: 65, max: 80 }
  },
]

const mockSymptoms: Symptom[] = [
  {
    id: '1',
    name: 'Headache',
    severity: 6,
    body_location: 'Forehead',
    description: 'Persistent throbbing headache, worse in the morning',
    recorded_at: '2024-01-22T06:30:00Z'
  },
  {
    id: '2',
    name: 'Fatigue',
    severity: 4,
    description: 'Feeling tired throughout the day',
    recorded_at: '2024-01-21T14:00:00Z'
  },
]

const vitalsTrendData = [
  { date: '2024-01-15', bp_systolic: 135, glucose: 118, weight: 79.2 },
  { date: '2024-01-16', bp_systolic: 138, glucose: 122, weight: 79.0 },
  { date: '2024-01-17', bp_systolic: 142, glucose: 125, weight: 78.8 },
  { date: '2024-01-18', bp_systolic: 140, glucose: 120, weight: 78.6 },
  { date: '2024-01-19', bp_systolic: 136, glucose: 115, weight: 78.7 },
  { date: '2024-01-20', bp_systolic: 139, glucose: 128, weight: 78.5 },
  { date: '2024-01-21', bp_systolic: 141, glucose: 124, weight: 78.4 },
  { date: '2024-01-22', bp_systolic: 142, glucose: 125, weight: 78.5 },
]

const adherenceWeeklyData = [
  { day: 'Mon', medications: 100, vitals: 100, exercise: 0 },
  { day: 'Tue', medications: 100, vitals: 100, exercise: 100 },
  { day: 'Wed', medications: 75, vitals: 0, exercise: 100 },
  { day: 'Thu', medications: 100, vitals: 100, exercise: 0 },
  { day: 'Fri', medications: 100, vitals: 100, exercise: 100 },
  { day: 'Sat', medications: 50, vitals: 100, exercise: 100 },
  { day: 'Sun', medications: 100, vitals: 0, exercise: 0 },
]

const logger = createLogger('PatientDashboard')

export default function PatientDashboard() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showSymptomReporter, setShowSymptomReporter] = useState(false)
  const [patientSymptoms, setPatientSymptoms] = useState<any[]>([])

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const markMedicationTaken = (medicationId: string) => {
    // In real app, this would call an API
    logger.info('Marking medication as taken:', medicationId)
  }

  const recordVital = (vitalType: string) => {
    // In real app, this would open a modal or navigate to recording page
    logger.info('Recording vital:', vitalType)
  }

  const handleSymptomSubmit = (symptomData: any) => {
    // In real app, this would call an API to save the symptom
    logger.info('Submitting symptom:', symptomData)
    setPatientSymptoms(prev => [...prev, symptomData])
    setShowSymptomReporter(false)
    
    // Show success message (you could use a toast notification here)
    alert('Symptom reported successfully! Your doctor will be notified.')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-gray-600 mt-1">
            Stay on track with your health journey.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <CameraIcon className="h-4 w-4 mr-2" />
            Record Symptom
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Vital Reading
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          {
            title: 'Due Today',
            value: mockStats.medications_due_today,
            icon: PillIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            urgent: false,
          },
          {
            title: 'Missed Medications',
            value: mockStats.missed_medications,
            icon: ExclamationTriangleIcon,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            urgent: mockStats.missed_medications > 0,
          },
          {
            title: 'Upcoming Appointments',
            value: mockStats.upcoming_appointments,
            icon: CalendarIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            urgent: false,
          },
          {
            title: 'Vitals Pending',
            value: mockStats.vitals_pending,
            icon: HeartIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            urgent: mockStats.vitals_pending > 2,
          },
          {
            title: 'Adherence Rate',
            value: `${mockStats.adherence_rate}%`,
            icon: CheckIcon,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
            urgent: mockStats.adherence_rate < 80,
          },
        ].map((stat, index) => (
          <Card key={index} className={stat.urgent ? 'ring-2 ring-red-200' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.urgent && (
                    <p className="text-xs text-red-600 mt-1 font-medium">Needs attention</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Medication Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <PillIcon className="h-5 w-5 mr-2" />
            Today's Medication Schedule
          </CardTitle>
          <Link
            href="/dashboard/patient/medications"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All Medications
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockMedicationReminders.map((medication) => (
              <div
                key={medication.id}
                className={`flex items-center p-4 rounded-lg border transition-colors ${
                  medication.taken
                    ? 'bg-green-50 border-green-200'
                    : medication.is_critical
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      medication.taken ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {medication.taken && <CheckIcon className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className={`font-medium ${medication.taken ? 'text-green-900' : 'text-gray-900'}`}>
                        {medication.name} {medication.dosage}
                      </p>
                      <p className="text-sm text-gray-600">
                        {medication.time} - {medication.instructions}
                      </p>
                      {medication.is_critical && !medication.taken && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                          Critical
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!medication.taken && (
                  <button
                    onClick={() => markMedicationTaken(medication.id)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Mark Taken
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vital Signs Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Vital Signs Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={vitalsTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bp_systolic" stroke="#ef4444" name="Blood Pressure (Systolic)" />
                <Line type="monotone" dataKey="glucose" stroke="#3b82f6" name="Blood Glucose" />
                <Line type="monotone" dataKey="weight" stroke="#10b981" name="Weight" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Adherence */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adherenceWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="medications" fill="#3B82F6" name="Medications" />
                <Bar dataKey="vitals" fill="#10B981" name="Vitals" />
                <Bar dataKey="exercise" fill="#F59E0B" name="Exercise" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vitals and Symptoms Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vital Readings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <HeartIcon className="h-5 w-5 mr-2" />
              Recent Vital Readings
            </CardTitle>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Record New
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockVitalReadings.map((vital) => (
                <div
                  key={vital.id}
                  className={`p-3 rounded-lg border ${
                    vital.is_flagged ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{vital.type}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {vital.value} {vital.unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(vital.reading_time)}
                      </p>
                      {vital.target_range && (
                        <p className="text-xs text-gray-500">
                          Target: {vital.target_range.min} - {vital.target_range.max} {vital.unit}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {vital.is_flagged ? (
                        <div className="flex items-center text-red-600">
                          <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Out of Range</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <CheckIcon className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Normal</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Symptoms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Recent Symptoms
            </CardTitle>
            <button 
              onClick={() => setShowSymptomReporter(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Report Symptom
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patientSymptoms.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No symptoms reported recently
                </p>
              ) : (
                patientSymptoms.map((symptom) => (
                  <div key={symptom.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{symptom.name}</p>
                          {symptom.body_location && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {symptom.body_location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600">Severity:</span>
                          <div className="flex items-center">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full mr-1 ${
                                  i < symptom.severity ? 'bg-red-500' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                            <span className="text-sm font-medium text-gray-900 ml-2">
                              {symptom.severity}/10
                            </span>
                          </div>
                        </div>
                        {symptom.description && (
                          <p className="text-sm text-gray-600 mt-2">{symptom.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Recorded: {formatDateTime(symptom.recorded_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment */}
      {mockStats.next_appointment_date && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Follow-up Consultation</p>
                <p className="text-sm text-blue-700">
                  {formatDateTime(mockStats.next_appointment_date)}
                </p>
                <p className="text-sm text-blue-600">Dr. Johnson - Cardiology</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  Join Virtual Meeting
                </button>
                <button className="px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-50">
                  <DownloadIcon className="h-4 w-4 mr-2 inline" />
                  Download Prescription
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Symptom Reporter Modal */}
      <SymptomReporter
        isOpen={showSymptomReporter}
        onClose={() => setShowSymptomReporter(false)}
        onSymptomSubmit={handleSymptomSubmit}
        patientId={user?.id}
        gender={user?.gender === 'F' ? 'female' : 'male'}
      />
    </div>
  )
}