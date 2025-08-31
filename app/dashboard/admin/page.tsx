'use client'

// Force dynamic rendering for authenticated pages  
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  UserGroupIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

interface SystemStats {
  overview: {
    totalDoctors: number
    totalPatients: number
    totalMedicines: number
    totalAppointments: number
  }
  recentActivity: {
    newDoctors30Days: number
    newPatients30Days: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.status && result.payload?.data) {
          setStats(result.payload.data)
        }
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Doctors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.overview.totalDoctors || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HeartIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Patients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.overview.totalPatients || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BeakerIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Medicines
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.overview.totalMedicines || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Appointments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.overview.totalAppointments || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Activity (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Doctors</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.recentActivity.newDoctors30Days || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Patients</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats?.recentActivity.newPatients30Days || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a 
                href="/dashboard/admin/medicines" 
                className="block w-full text-left px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
              >
                Manage Medicines
              </a>
              <a 
                href="/dashboard/admin/conditions" 
                className="block w-full text-left px-4 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100"
              >
                Manage Conditions
              </a>
              <a 
                href="/dashboard/admin/treatments" 
                className="block w-full text-left px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100"
              >
                Manage Treatments
              </a>
              <a 
                href="/dashboard/admin/doctors" 
                className="block w-full text-left px-4 py-2 text-sm bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100"
              >
                Manage Doctors
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}