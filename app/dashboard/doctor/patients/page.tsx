'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { Patient } from '@/types/dashboard'
import { formatDate, getAdherenceColor, getInitials, getStatusColor } from '@/lib/utils'

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
  },
]

interface PatientDrawerProps {
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
}

function PatientDrawer({ patient, isOpen, onClose }: PatientDrawerProps) {
  if (!isOpen || !patient) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Patient Overview</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                  <span className="text-xl font-medium text-gray-600">
                    {getInitials(patient.first_name, patient.last_name)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {patient.first_name} {patient.last_name}
                </h3>
                <p className="text-sm text-gray-500">{patient.medical_record_number}</p>
              </div>

              {/* Critical & Non-Critical Boxes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{patient.critical_alerts}</div>
                  <div className="text-sm text-red-800">Critical Alerts</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">2</div>
                  <div className="text-sm text-yellow-800">Non-Critical</div>
                </div>
              </div>

              {/* Adherence Rate */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Adherence</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${getAdherenceColor(patient.adherence_rate)}`}>
                    {patient.adherence_rate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${patient.adherence_rate}%` }}
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {patient.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {patient.phone}
                  </div>
                </div>
              </div>

              {/* Recent Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Last visit: {formatDate(patient.last_visit)}</div>
                  <div>Next appointment: {formatDate(patient.next_appointment)}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  href={`/dashboard/doctor/patients/${patient.id}`}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-center block hover:bg-blue-700 transition-colors"
                  onClick={onClose}
                >
                  View Full Details
                </Link>
                <Link
                  href={`/dashboard/doctor/patients/${patient.id}/care-plan/new`}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-center block hover:bg-green-700 transition-colors"
                  onClick={onClose}
                >
                  Create Care Plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async (searchQuery = '') => {
    try {
      setIsLoading(true)
      let endpoint = '/patients/pagination?page=1&limit=50'
      if (searchQuery) {
        endpoint += `&search=${encodeURIComponent(searchQuery)}`
      }
      
      const result = await apiRequest.get(endpoint)
      
      if (result.status && result.payload?.data?.patients) {
        // Convert the patients object to an array
        const patientsArray = Object.values(result.payload.data.patients).map((patient: any) => ({
          id: patient.basic_info.id,
          user_id: patient.basic_info.user_id,
          first_name: patient.basic_info.first_name,
          last_name: patient.basic_info.last_name,
          email: patient.basic_info.email,
          phone: patient.basic_info.mobile_number,
          date_of_birth: patient.basic_info.date_of_birth,
          gender: patient.basic_info.gender,
          medical_record_number: patient.basic_info.patient_id,
          last_visit: patient.medical_info?.last_visit || null,
          next_appointment: patient.medical_info?.next_appointment || null,
          adherence_rate: patient.medical_info?.adherence_rate || 0,
          critical_alerts: patient.medical_info?.critical_alerts || 0,
          status: patient.basic_info.status || 'active',
          created_at: patient.basic_info.created_at
        }))
        setPatients(patientsArray)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search with debouncing
  const handleSearch = async (query: string) => {
    setSearchTerm(query)
    await fetchPatients(query)
  }

  const filteredPatients = patients.filter(patient => {
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter
    return matchesStatus
  })

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDrawerOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor your patients' health journey
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/dashboard/doctor/patients/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Patient
            </Link>
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
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
            <div className="text-2xl font-bold text-gray-900">{patients.length}</div>
            <div className="text-sm text-gray-600">Total Patients</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {patients.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              {patients.filter(p => p.critical_alerts > 0).length}
            </div>
            <div className="text-sm text-gray-600">With Alerts</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(patients.reduce((sum, p) => sum + p.adherence_rate, 0) / patients.length)}%
            </div>
            <div className="text-sm text-gray-600">Avg Adherence</div>
          </div>
        </div>

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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Appointment
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
                        <div className="text-sm text-gray-900">{patient.email}</div>
                        <div className="text-sm text-gray-500">{patient.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(patient.last_visit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(patient.next_appointment)}
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
                        <button
                          onClick={() => handlePatientClick(patient)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/dashboard/doctor/patients/${patient.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPatients.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No patients match your search criteria.' 
                    : 'No patients found.'
                  }
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patient Drawer */}
      <PatientDrawer
        patient={selectedPatient}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  )
}