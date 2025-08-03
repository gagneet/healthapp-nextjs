'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Patient, 
  CarePlan, 
  Medication, 
  VitalReading, 
  Appointment, 
  Symptom 
} from '@/types/dashboard'
import { formatDate, formatDateTime, getInitials, getAdherenceColor, getPriorityColor } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data - replace with actual API calls
const mockPatient: Patient = {
  id: '1',
  user_id: 'user1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@email.com',
  phone: '+1-555-0123',
  date_of_birth: '1980-05-15',
  gender: 'MALE',
  medical_record_number: 'MRN001',
  last_visit: '2024-01-15',
  next_appointment: '2024-02-01',
  adherence_rate: 92,
  critical_alerts: 0,
  status: 'active',
  created_at: '2024-01-01',
}

const mockCarePlans: CarePlan[] = [
  {
    id: '1',
    name: 'Hypertension Management',
    status: 'active',
    priority: 'high',
    start_date: '2024-01-01',
    end_date: '2024-06-01',
    medications_count: 3,
    vitals_count: 2,
    appointments_count: 4,
  },
  {
    id: '2',
    name: 'Diabetes Care Plan',
    status: 'active',
    priority: 'critical',
    start_date: '2024-01-15',
    medications_count: 2,
    vitals_count: 3,
    appointments_count: 2,
  },
]

const mockMedications: Medication[] = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    start_date: '2024-01-01',
    is_critical: true,
    adherence_rate: 95,
    last_taken: '2024-01-22T08:00:00Z',
    next_due: '2024-01-23T08:00:00Z',
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    start_date: '2024-01-15',
    is_critical: true,
    adherence_rate: 88,
    last_taken: '2024-01-22T12:00:00Z',
    next_due: '2024-01-22T20:00:00Z',
  },
]

const mockVitalReadings: VitalReading[] = [
  {
    id: '1',
    type: 'Blood Pressure',
    value: 140,
    unit: 'mmHg',
    reading_time: '2024-01-22T08:30:00Z',
    is_flagged: true,
    normal_range: { min: 90, max: 120 },
  },
  {
    id: '2',
    type: 'Blood Glucose',
    value: 125,
    unit: 'mg/dL',
    reading_time: '2024-01-22T09:00:00Z',
    is_flagged: false,
    normal_range: { min: 70, max: 140 },
  },
]

const mockAppointments: Appointment[] = [
  {
    id: '1',
    title: 'Follow-up Consultation',
    type: 'follow-up',
    start_time: '2024-02-01T10:00:00Z',
    end_time: '2024-02-01T10:30:00Z',
    status: 'scheduled',
    is_virtual: false,
  },
  {
    id: '2',
    title: 'Blood Work Review',
    type: 'consultation',
    start_time: '2024-01-25T14:00:00Z',
    end_time: '2024-01-25T14:30:00Z',
    status: 'confirmed',
    is_virtual: true,
    notes: 'Review recent lab results',
  },
]

const mockSymptoms: Symptom[] = [
  {
    id: '1',
    name: 'Headache',
    severity: 6,
    description: 'Persistent headache, especially in the morning',
    onset_time: '2024-01-20T06:00:00Z',
    recorded_at: '2024-01-20T08:00:00Z',
  },
  {
    id: '2',
    name: 'Fatigue',
    severity: 4,
    description: 'Feeling tired throughout the day',
    onset_time: '2024-01-18T10:00:00Z',
    recorded_at: '2024-01-18T10:15:00Z',
  },
]

const vitalsChartData = [
  { date: '2024-01-15', bp_systolic: 135, bp_diastolic: 85, glucose: 118 },
  { date: '2024-01-16', bp_systolic: 138, bp_diastolic: 88, glucose: 122 },
  { date: '2024-01-17', bp_systolic: 142, bp_diastolic: 90, glucose: 125 },
  { date: '2024-01-18', bp_systolic: 140, bp_diastolic: 87, glucose: 120 },
  { date: '2024-01-19', bp_systolic: 136, bp_diastolic: 84, glucose: 115 },
  { date: '2024-01-20', bp_systolic: 139, bp_diastolic: 86, glucose: 128 },
  { date: '2024-01-21', bp_systolic: 141, bp_diastolic: 89, glucose: 124 },
  { date: '2024-01-22', bp_systolic: 140, bp_diastolic: 88, glucose: 125 },
]

const tabs = [
  { id: 'overview', name: 'Overview' },
  { id: 'medications', name: 'Medications' },
  { id: 'vitals', name: 'Vitals' },
  { id: 'appointments', name: 'Appointments' },
  { id: 'symptoms', name: 'Symptoms' },
  { id: 'care-plans', name: 'Care Plans' },
]

export default function PatientDetailsPage() {
  const params = useParams()
  const patientId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading patient data
    setTimeout(() => {
      setPatient(mockPatient)
      setIsLoading(false)
    }, 1000)
  }, [patientId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Patient not found</h2>
        <p className="text-gray-600 mt-2">The patient you're looking for doesn't exist.</p>
        <Link
          href="/dashboard/doctor/patients"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Patients
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/doctor/patients"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl font-medium text-gray-600">
                {getInitials(patient.first_name, patient.last_name)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-gray-600">
                {patient.medical_record_number} • {patient.email}
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <PlusIcon className="h-4 w-4 mr-2" />
            Quick Action
          </button>
          <Link
            href={`/dashboard/doctor/patients/${patient.id}/care-plan/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Care Plan
          </Link>
        </div>
      </div>

      {/* Patient Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Adherence</p>
                <p className="text-3xl font-bold text-gray-900">{patient.adherence_rate}%</p>
              </div>
              <div className={`p-3 rounded-full ${getAdherenceColor(patient.adherence_rate)}`}>
                <CheckIcon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{patient.critical_alerts}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Medications</p>
                <p className="text-3xl font-bold text-gray-900">{mockMedications.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Appointment</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(patient.next_appointment)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Missed Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Recent Missed Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium text-red-900">Blood Pressure Medication</p>
                <p className="text-sm text-red-700">Missed on Jan 20, 2024 at 8:00 AM</p>
              </div>
              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">Critical</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="font-medium text-yellow-900">Blood Glucose Reading</p>
                <p className="text-sm text-yellow-700">Missed on Jan 19, 2024 at 9:00 AM</p>
              </div>
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Important</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(patient.date_of_birth || '')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{patient.gender?.toLowerCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{patient.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                        {patient.status}
                      </span>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Vital Signs Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Vital Signs Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={vitalsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bp_systolic" stroke="#ef4444" name="Systolic BP" />
                    <Line type="monotone" dataKey="glucose" stroke="#3b82f6" name="Glucose" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Active Medications</CardTitle>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Medication
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMedications.map((medication) => (
                    <div key={medication.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">{medication.name}</h3>
                            {medication.is_critical && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Critical
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {medication.dosage} • {medication.frequency}
                          </p>
                          <p className="text-sm text-gray-500">
                            Started: {formatDate(medication.start_date)}
                          </p>
                          {medication.last_taken && (
                            <p className="text-sm text-gray-500">
                              Last taken: {formatDateTime(medication.last_taken)}
                            </p>
                          )}
                          {medication.next_due && (
                            <p className="text-sm text-blue-600">
                              Next due: {formatDateTime(medication.next_due)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getAdherenceColor(medication.adherence_rate)}`}>
                            {medication.adherence_rate}% adherence
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vital Readings</CardTitle>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Reading
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockVitalReadings.map((vital) => (
                    <div key={vital.id} className={`border rounded-lg p-4 ${vital.is_flagged ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{vital.type}</h3>
                          <p className="text-2xl font-bold text-gray-900">
                            {vital.value} {vital.unit}
                          </p>
                          <p className="text-sm text-gray-500">
                            Recorded: {formatDateTime(vital.reading_time)}
                          </p>
                          {vital.normal_range.min && vital.normal_range.max && (
                            <p className="text-sm text-gray-500">
                              Normal range: {vital.normal_range.min} - {vital.normal_range.max} {vital.unit}
                            </p>
                          )}
                        </div>
                        <div>
                          {vital.is_flagged ? (
                            <div className="flex items-center text-red-600">
                              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                              <span className="text-sm font-medium">Flagged</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <CheckIcon className="h-5 w-5 mr-2" />
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
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Appointments</CardTitle>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAppointments.map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{appointment.title}</h3>
                          <p className="text-sm text-gray-600 capitalize">{appointment.type}</p>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(appointment.start_time)} - {formatDateTime(appointment.end_time)}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                          )}
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status}
                            </span>
                            {appointment.is_virtual && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Virtual
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'symptoms' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reported Symptoms</CardTitle>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Symptom
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSymptoms.map((symptom) => (
                    <div key={symptom.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{symptom.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600">Severity:</span>
                            <div className="flex items-center">
                              {[...Array(10)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-3 rounded-full mr-1 ${
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
                          <div className="text-sm text-gray-500 mt-2">
                            {symptom.onset_time && (
                              <p>Onset: {formatDateTime(symptom.onset_time)}</p>
                            )}
                            <p>Recorded: {formatDateTime(symptom.recorded_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'care-plans' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Care Plans</CardTitle>
                <Link
                  href={`/dashboard/doctor/patients/${patient.id}/care-plan/new`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Care Plan
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCarePlans.map((carePlan) => (
                    <div key={carePlan.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">{carePlan.name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(carePlan.priority)}`}>
                              {carePlan.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatDate(carePlan.start_date)} - {carePlan.end_date ? formatDate(carePlan.end_date) : 'Ongoing'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>{carePlan.medications_count} medications</span>
                            <span>{carePlan.vitals_count} vitals</span>
                            <span>{carePlan.appointments_count} appointments</span>
                          </div>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            carePlan.status === 'active' ? 'bg-green-100 text-green-800' :
                            carePlan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {carePlan.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}