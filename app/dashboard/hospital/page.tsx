'use client'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UsersIcon,
  UserGroupIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  BellIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { formatDate, getInitials } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

// Mock data - replace with actual API calls
const mockHospitalStats = {
  total_doctors: 24,
  total_hsps: 18,
  total_patients: 342,
  active_staff: 38,
  pending_approvals: 3,
  critical_alerts: 5,
  departments: 8,
  organization_name: 'Metro General Hospital',
}

const mockDoctors = [
  {
    id: '1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@metrogeneral.com',
    specialty: 'Cardiology',
    patients_count: 45,
    status: 'active',
    last_login: '2024-01-22T08:30:00Z',
    joined_date: '2023-03-15',
  },
  {
    id: '2',
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'michael.chen@metrogeneral.com',
    specialty: 'Endocrinology',
    patients_count: 38,
    status: 'active',
    last_login: '2024-01-22T07:45:00Z',
    joined_date: '2023-06-20',
  },
  {
    id: '3',
    first_name: 'David',
    last_name: 'Williams',
    email: 'david.williams@metrogeneral.com',
    specialty: 'Internal Medicine',
    patients_count: 52,
    status: 'active',
    last_login: '2024-01-21T16:20:00Z',
    joined_date: '2022-11-10',
  },
]

const mockHSPs = [
  {
    id: '1',
    first_name: 'Emma',
    last_name: 'Davis',
    email: 'emma.davis@metrogeneral.com',
    role: 'Registered Nurse',
    department: 'Cardiology',
    patients_assigned: 12,
    status: 'active',
    last_login: '2024-01-22T06:15:00Z',
  },
  {
    id: '2',
    first_name: 'James',
    last_name: 'Wilson',
    email: 'james.wilson@metrogeneral.com',
    role: 'Clinical Pharmacist',
    department: 'Pharmacy',
    patients_assigned: 8,
    status: 'active',
    last_login: '2024-01-22T08:00:00Z',
  },
]

const staffDistributionData = [
  { name: 'Doctors', value: 24, color: '#3B82F6' },
  { name: 'Nurses', value: 12, color: '#10B981' },
  { name: 'Pharmacists', value: 4, color: '#F59E0B' },
  { name: 'Other HSPs', value: 2, color: '#EF4444' },
]

const departmentData = [
  { department: 'Cardiology', doctors: 4, hsps: 6, patients: 89 },
  { department: 'Endocrinology', doctors: 3, hsps: 4, patients: 67 },
  { department: 'Internal Medicine', doctors: 5, hsps: 3, patients: 102 },
  { department: 'Neurology', doctors: 2, hsps: 2, patients: 34 },
  { department: 'Orthopedics', doctors: 3, hsps: 2, patients: 28 },
  { department: 'Pediatrics', doctors: 4, hsps: 1, patients: 22 },
]

const monthlyGrowthData = [
  { month: 'Sep', doctors: 20, hsps: 15, patients: 298 },
  { month: 'Oct', doctors: 21, hsps: 16, patients: 312 },
  { month: 'Nov', doctors: 23, hsps: 17, patients: 328 },
  { month: 'Dec', doctors: 24, hsps: 18, patients: 342 },
]

export default function HospitalDashboard() {
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
            {mockHospitalStats.organization_name}
          </h1>
          <p className="text-gray-600 mt-1">
            Hospital Administration Dashboard
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/dashboard/hospital/staff/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Staff Member
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Doctors',
            value: mockHospitalStats.total_doctors,
            icon: UsersIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            change: '+2 this month',
          },
          {
            title: 'Healthcare Staff',
            value: mockHospitalStats.total_hsps,
            icon: UserGroupIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            change: '+1 this month',
          },
          {
            title: 'Total Patients',
            value: mockHospitalStats.total_patients,
            icon: HeartIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            change: '+14 this month',
          },
          {
            title: 'Critical Alerts',
            value: mockHospitalStats.critical_alerts,
            icon: ExclamationTriangleIcon,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            change: '-2 from yesterday',
          },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
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
        {/* Staff Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={staffDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                >
                  {staffDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Staff Count']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {staffDistributionData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="ml-auto text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="doctors" stroke="#3B82F6" name="Doctors" />
                <Line type="monotone" dataKey="hsps" stroke="#10B981" name="HSPs" />
                <Line type="monotone" dataKey="patients" stroke="#F59E0B" name="Patients" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="doctors" fill="#3B82F6" name="Doctors" />
              <Bar dataKey="hsps" fill="#10B981" name="HSPs" />
              <Bar dataKey="patients" fill="#F59E0B" name="Patients" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Staff Summary & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Doctors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Doctors</CardTitle>
            <Link
              href="/dashboard/hospital/staff"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDoctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {getInitials(doctor.first_name, doctor.last_name)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {doctor.patients_count} patients
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{doctor.specialty}</p>
                    <p className="text-xs text-gray-400">
                      Last login: {formatDate(doctor.last_login)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent HSPs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Healthcare Service Providers</CardTitle>
            <Link
              href="/dashboard/hospital/staff"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockHSPs.map((hsp) => (
                <div key={hsp.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-green-700">
                        {getInitials(hsp.first_name, hsp.last_name)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {hsp.first_name} {hsp.last_name}
                      </p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {hsp.patients_assigned} assigned
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{hsp.role}</p>
                    <p className="text-xs text-gray-400">{hsp.department}</p>
                  </div>
                </div>
              ))}
              
              {/* Pending Approvals Alert */}
              {mockHospitalStats.pending_approvals > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <BellIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm font-medium text-yellow-800">
                      {mockHospitalStats.pending_approvals} staff applications pending approval
                    </p>
                  </div>
                  <Link
                    href="/dashboard/hospital/staff?filter=pending"
                    className="text-sm text-yellow-700 hover:text-yellow-800 underline mt-1 block"
                  >
                    Review applications
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/hospital/staff/new"
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <PlusIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-900">Add New Staff</p>
                <p className="text-sm text-blue-700">Invite doctors or healthcare providers</p>
              </div>
            </Link>
            
            <Link
              href="/dashboard/hospital/organizations"
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <HomeIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-900">Manage Organizations</p>
                <p className="text-sm text-green-700">Configure departments and settings</p>
              </div>
            </Link>
            
            <Link
              href="/dashboard/hospital/notifications"
              className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              <BellIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-yellow-900">View Notifications</p>
                <p className="text-sm text-yellow-700">System alerts and updates</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}