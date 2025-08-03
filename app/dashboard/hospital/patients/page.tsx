'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Patient } from '@/types/dashboard'
import { formatDate, getAdherenceColor, getInitials, getStatusColor } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data - replace with actual API calls
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
    assigned_doctor: 'Dr. Sarah Johnson',
    assigned_hsp: 'Emma Davis, RN',
    department: 'Cardiology',
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
    assigned_doctor: 'Dr. Sarah Johnson',
    assigned_hsp: 'Emma Davis, RN',
    department: 'Cardiology',
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
    assigned_doctor: 'Dr. Michael Chen',
    assigned_hsp: 'James Wilson, PharmD',
    department: 'Endocrinology',
  },
  {
    id: '4',
    user_id: 'user4',
    first_name: 'Sarah',
    last_name: 'Williams',
    email: 'sarah.w@email.com',
    phone: '+1-555-0126',
    date_of_birth: '1990-03-14',
    gender: 'FEMALE',
    medical_record_number: 'MRN004',
    last_visit: '2024-01-12',
    next_appointment: '2024-02-05',
    adherence_rate: 95,
    critical_alerts: 0,
    status: 'active',
    created_at: '2024-01-01',
    assigned_doctor: 'Dr. Michael Chen',
    department: 'Endocrinology',
  },
  {
    id: '5',
    user_id: 'user5',
    first_name: 'Robert',
    last_name: 'Davis',
    email: 'robert.d@email.com',
    phone: '+1-555-0127',
    date_of_birth: '1965-11-28',
    gender: 'MALE',
    medical_record_number: 'MRN005',
    last_visit: '2024-01-10',
    next_appointment: '2024-01-28',
    adherence_rate: 58,
    critical_alerts: 3,
    status: 'active',
    created_at: '2024-01-01',
    assigned_doctor: 'Dr. David Williams',
    department: 'Internal Medicine',
  },
]

const departmentData = [
  {
    department: 'Cardiology',
    patients: mockPatients.filter(p => p.department === 'Cardiology').length,
    avgAdherence: Math.round(
      mockPatients.filter(p => p.department === 'Cardiology')
        .reduce((acc, p) => acc + p.adherence_rate, 0) /
      mockPatients.filter(p => p.department === 'Cardiology').length
    ),
    criticalAlerts: mockPatients.filter(p => p.department === 'Cardiology')
      .reduce((acc, p) => acc + p.critical_alerts, 0),
  },
  {
    department: 'Endocrinology',
    patients: mockPatients.filter(p => p.department === 'Endocrinology').length,
    avgAdherence: Math.round(
      mockPatients.filter(p => p.department === 'Endocrinology')
        .reduce((acc, p) => acc + p.adherence_rate, 0) /
      mockPatients.filter(p => p.department === 'Endocrinology').length
    ),
    criticalAlerts: mockPatients.filter(p => p.department === 'Endocrinology')
      .reduce((acc, p) => acc + p.critical_alerts, 0),
  },
  {
    department: 'Internal Medicine',
    patients: mockPatients.filter(p => p.department === 'Internal Medicine').length,
    avgAdherence: Math.round(
      mockPatients.filter(p => p.department === 'Internal Medicine')
        .reduce((acc, p) => acc + p.adherence_rate, 0) /
      mockPatients.filter(p => p.department === 'Internal Medicine').length
    ),
    criticalAlerts: mockPatients.filter(p => p.department === 'Internal Medicine')
      .reduce((acc, p) => acc + p.critical_alerts, 0),
  },
]

export default function HospitalPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.medical_record_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.assigned_doctor?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = departmentFilter === 'all' || patient.department === departmentFilter
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Overview</h1>
          <p className="text-gray-600 mt-1">
            Monitor all patients across departments and care teams
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients, doctors, or medical records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
              </select>
              <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{patients.length}</div>
              <div className="text-sm text-gray-600">Total Patients</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-600">
                {patients.filter(p => p.critical_alerts > 0).length}
              </div>
              <div className="text-sm text-gray-600">With Alerts</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(patients.reduce((sum, p) => sum + p.adherence_rate, 0) / patients.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg Adherence</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {patients.filter(p => {
                  const nextAppt = new Date(p.next_appointment)
                  const today = new Date()
                  const diffTime = nextAppt.getTime() - today.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  return diffDays <= 7 && diffDays >= 0
                }).length}
              </div>
              <div className="text-sm text-gray-600">Upcoming Appts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="patients" fill="#3B82F6" name="Patients" />
              <Bar dataKey="avgAdherence" fill="#10B981" name="Avg Adherence %" />
              <Bar dataKey="criticalAlerts" fill="#EF4444" name="Critical Alerts" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient List ({filteredPatients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Healthcare Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adherence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alerts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {getInitials(patient.first_name, patient.last_name)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.medical_record_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.assigned_doctor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.assigned_hsp || 'Not assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(patient.last_visit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAdherenceColor(patient.adherence_rate)}`}>
                        {patient.adherence_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.critical_alerts > 0 ? (
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-600">
                            {patient.critical_alerts}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/hospital/patients/${patient.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <EyeIcon className="h-4 w-4 inline" />
                      </Link>
                      <Link
                        href={`/dashboard/doctor/patients/${patient.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'No patients are currently registered.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}