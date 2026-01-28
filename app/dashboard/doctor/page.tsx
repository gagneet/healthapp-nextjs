'use client'

export const dynamic = 'force-dynamic'




// Force dynamic rendering for authenticated pages

import PatientQuickView from '@/components/dashboard/patient-quick-view'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { formatDate, getAdherenceColor, getInitials } from '@/lib/utils'
import { userHelpers } from '@/types/auth'
import { CriticalAlert, DashboardStats, Patient } from '@/types/dashboard'
import {
  BellIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// API Response types  
interface APIResponse<T> {
  status: boolean
  statusCode: number
  payload: {
    data: T
    message: string
  }
}

interface DashboardAPIStats {
  stats: DashboardStats
}

interface RecentPatientsAPI {
  patients: Patient[]
}

interface CriticalAlertsAPI {
  alerts: CriticalAlert[]
}

interface AdherenceAnalyticsAPI {
  adherenceOverview: { name: string; value: number; color: string }[]
  monthly_trends: { month: string; carePlans: number; appointments: number; vitals: number }[]
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [quickViewOpen, setQuickViewOpen] = useState(false)

  // Data state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [recentPatients, setRecentPatients] = useState<Patient[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([])
  const [adherenceChartData, setAdherenceChartData] = useState<{ name: string; value: number; color: string }[]>([])
  const [monthlyAdherenceData, setMonthlyAdherenceData] = useState<{ month: string; carePlans: number; appointments: number; vitals: number }[]>([])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const headers = {
        'Content-Type': 'application/json',
      }

      // Fetch dashboard data
      const response = await fetch('/api/doctors/dashboard', { headers, credentials: 'include' })
      if (!response.ok) throw new Error('Failed to fetch dashboard data')

      const apiResponse = await response.json()
      if (!apiResponse.status) throw new Error(apiResponse.payload?.message || 'API Error')

      const data = apiResponse.payload.data

      // Map to UI state
      setDashboardStats({
        totalPatients: data.statistics.totalPatients,
        criticalAlerts: data.statistics.highRiskPatients, // Using high risk count for alerts widget
        appointments_today: data.statistics.todayAppointments,
        medication_adherence: 85 // Mocking adherence for now or calculate from recentPatients logic?
      })

      // Use recent patients from main response
      setRecentPatients(data.recentPatients.map((p: any) => ({
        ...p,
        firstName: p.name.split(' ')[0],
        lastName: p.name.split(' ').slice(1).join(' '),
        // Map other fields as best effort or keep simple
      })) || [])

      // Still fetch specific analytics if needed, but critical alerts can likely be fetched separately if we want details
      const [alertsRes, analyticsRes] = await Promise.all([
        fetch('/api/doctors/critical-alerts?limit=5', { headers, credentials: 'include' }),
        fetch('/api/doctors/adherence-analytics', { headers, credentials: 'include' })
      ])

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        if (alertsData.status) setCriticalAlerts(alertsData.payload.data.alerts || [])
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        if (analyticsData.status) {
          setAdherenceChartData(analyticsData.payload.data.adherenceOverview || [])
          setMonthlyAdherenceData(analyticsData.payload.data.monthly_trends || [])
        }
      }

    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handlePatientQuickView = (patient: Patient) => {
    setSelectedPatient(patient)
    setQuickViewOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchDashboardData}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, Dr. {userHelpers.getLastName(user) || userHelpers.getFirstName(user)}
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
            value: dashboardStats?.totalPatients || 0,
            icon: UsersIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
          },
          {
            title: 'Critical Alerts',
            value: dashboardStats?.criticalAlerts || 0,
            icon: ExclamationTriangleIcon,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
          },
          {
            title: 'Today\'s Appointments',
            value: dashboardStats?.appointments_today || 0,
            icon: CalendarIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
          },
          {
            title: 'Avg. Adherence',
            value: `${dashboardStats?.medication_adherence || 0}%`,
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
              {criticalAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No critical alerts at this time
                </p>
              ) : (
                criticalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-red-900">{alert.patientName}</p>
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded capitalize">
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-red-800 mt-1">{alert.message}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {formatDate(alert.createdAt)}
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
              {recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0">
                    {(patient as any).profilePictureUrl ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={(patient as any).profilePictureUrl}
                        alt={`${patient.firstName} ${patient.lastName}`}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {getInitials(patient.firstName, patient.lastName)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <div className="flex items-center space-x-2">
                        {((patient as any).criticalAlerts || 0) > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {(patient as any).criticalAlerts} alert{((patient as any).criticalAlerts || 0) > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAdherenceColor((patient as any).adherenceRate || 0)}`}>
                          {(patient as any).adherenceRate || 0}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last visit: {patient.lastVisit ? formatDate(patient.lastVisit) : 'No visits yet'}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center space-x-2">
                    <button
                      onClick={() => handlePatientQuickView(patient)}
                      className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Quick View"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/dashboard/doctor/patients/${patient.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Quick View Drawer */}
      <PatientQuickView
        isOpen={quickViewOpen}
        setIsOpen={setQuickViewOpen}
        patient={selectedPatient}
      />
    </div>
  )
}
