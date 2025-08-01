'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  UsersIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
  BellIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { DashboardStats, Patient, CriticalAlert, RecentActivity } from '@/types/dashboard'
import { formatDate, getAdherenceColor, getInitials } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Mock data - replace with actual API calls
const mockStats: DashboardStats = {
  total_patients: 147,
  active_patients: 132,
  critical_alerts: 8,
  appointments_today: 12,
  medication_adherence: 87,
  vital_readings_pending: 23,
}

const mockPatients: Patient[] = [
  {
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
  },
  {
    id: '2',
    user_id: 'user2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+1-555-0124',
    date_of_birth: '1975-09-22',
    gender: 'FEMALE',
    medical_record_number: 'MRN002',
    last_visit: '2024-01-18',
    next_appointment: '2024-01-25',
    adherence_rate: 65,
    critical_alerts: 2,
    status: 'active',
    created_at: '2024-01-01',
  },
  {
    id: '3',
    user_id: 'user3',
    first_name: 'Michael',
    last_name: 'Johnson',
    email: 'michael.j@email.com',
    phone: '+1-555-0125',
    date_of_birth: '1988-12-10',
    gender: 'MALE',
    medical_record_number: 'MRN003',
    last_visit: '2024-01-20',
    next_appointment: '2024-01-30',
    adherence_rate: 78,
    critical_alerts: 1,
    status: 'active',
    created_at: '2024-01-01',
  },
]

const mockCriticalAlerts: CriticalAlert[] = [
  {
    id: '1',
    patient_id: '2',
    patient_name: 'Jane Smith',
    type: 'medication',
    severity: 'critical',
    message: 'Missed 3 consecutive blood pressure medications',
    created_at: '2024-01-22T10:30:00Z',
    acknowledged: false,
  },
  {
    id: '2',
    patient_id: '3',
    patient_name: 'Michael Johnson',
    type: 'vital',
    severity: 'high',
    message: 'Blood pressure reading above critical threshold',
    created_at: '2024-01-22T09:15:00Z',
    acknowledged: false,
  },
]

const adherenceChartData = [
  { name: 'Medications', value: 87, color: '#10B981' },
  { name: 'Appointments', value: 94, color: '#3B82F6' },
  { name: 'Vitals', value: 82, color: '#F59E0B' },
  { name: 'Exercise', value: 76, color: '#EF4444' },
]

const monthlyAdherenceData = [
  { month: 'Jan', medications: 85, appointments: 92, vitals: 78 },
  { month: 'Feb', medications: 88, appointments: 94, vitals: 82 },
  { month: 'Mar', medications: 87, appointments: 96, vitals: 85 },
  { month: 'Apr', medications: 90, appointments: 95, vitals: 88 },
]

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

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
            Welcome back, Dr. {user?.last_name}
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your patients today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/dashboard/doctor/patients/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Patient
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Patients',
            value: mockStats.total_patients,
            icon: UsersIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
          },
          {
            title: 'Critical Alerts',
            value: mockStats.critical_alerts,
            icon: ExclamationTriangleIcon,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
          },
          {
            title: 'Today\'s Appointments',
            value: mockStats.appointments_today,
            icon: CalendarIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
          },
          {
            title: 'Avg. Adherence',
            value: `${mockStats.medication_adherence}%`,
            icon: ChartBarIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
          },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adherence Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Adherence Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={adherenceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                >
                  {adherenceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Adherence Rate']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {adherenceChartData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="ml-auto text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Adherence Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyAdherenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="medications" fill="#10B981" name="Medications" />
                <Bar dataKey="appointments" fill="#3B82F6" name="Appointments" />
                <Bar dataKey="vitals" fill="#F59E0B" name="Vitals" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-red-500" />
              Critical Alerts
            </CardTitle>
            <Link
              href="/dashboard/doctor/notifications"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCriticalAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No critical alerts at this time
                </p>
              ) : (
                mockCriticalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-red-900">{alert.patient_name}</p>
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded capitalize">
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-red-800 mt-1">{alert.message}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {formatDate(alert.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Patients</CardTitle>
            <Link
              href="/dashboard/doctor/patients"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPatients.slice(0, 5).map((patient) => (
                <Link
                  key={patient.id}
                  href={`/dashboard/doctor/patients/${patient.id}`}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0">
                    {patient.profile_picture_url ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={patient.profile_picture_url}
                        alt={`${patient.first_name} ${patient.last_name}`}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {getInitials(patient.first_name, patient.last_name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <div className="flex items-center space-x-2">
                        {patient.critical_alerts > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {patient.critical_alerts} alert{patient.critical_alerts > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAdherenceColor(patient.adherence_rate)}`}>
                          {patient.adherence_rate}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last visit: {formatDate(patient.last_visit)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}