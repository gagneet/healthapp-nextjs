'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import OtpVerificationModal from '@/components/ui/OtpVerificationModal'
import { apiRequest } from '@/lib/api'
import { Patient, ConsentStatus } from '@/types/dashboard'
import { formatDate, getAdherenceColor, getInitials, getStatusColor } from '@/lib/utils'

// Helper functions for displaying missing data with user-friendly messages
const displayMedicalInfo = (value: any, fallbackMessage: string) => {
  if (value === null || value === undefined || value === '') {
    return (
      <span className="text-gray-400 italic text-sm">
        {fallbackMessage}
      </span>
    )
  }
  return value
}

const displayDateInfo = (dateString: string | null, fallbackMessage: string) => {
  if (!dateString) {
    return (
      <span className="text-gray-400 italic text-sm">
        {fallbackMessage}
      </span>
    )
  }
  return formatDate(dateString)
}

const displayAdherenceRate = (rate: number | null | undefined) => {
  if (rate === null || rate === undefined) {
    return (
      <span className="text-gray-400 italic text-sm">
        No medication data
      </span>
    )
  }
  return `${rate}%`
}

// Helper function to get patient type badge
const getPatientTypeBadge = (patient: Patient) => {
  if (patient.patientType === 'M' || patient.accessType === 'primary') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
        <span className="font-bold mr-1">M</span> Primary
      </span>
    )
  } else if (patient.patientType === 'R' || patient.accessType === 'secondary') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
        <span className="font-bold mr-1">R</span> Referred
      </span>
    )
  }
  return null
}

// Helper function to get consent status badge
const getConsentStatusBadge = (patient: Patient) => {
  if (!patient.requiresConsent) {
    return (
      <div className="flex items-center text-xs text-green-600">
        <CheckCircleIcon className="h-4 w-4 mr-1" />
        <span>No consent required</span>
      </div>
    )
  }

  switch (patient.consentStatus) {
    case 'granted':
      return (
        <div className="flex items-center text-xs text-green-600">
          <ShieldCheckIcon className="h-4 w-4 mr-1" />
          <span>Consent granted</span>
        </div>
      )
    case 'requested':
      return (
        <div className="flex items-center text-xs text-yellow-600">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>OTP sent</span>
        </div>
      )
    case 'pending':
      return (
        <div className="flex items-center text-xs text-orange-600">
          <ExclamationCircleIcon className="h-4 w-4 mr-1" />
          <span>Consent needed</span>
        </div>
      )
    case 'expired':
      return (
        <div className="flex items-center text-xs text-red-600">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          <span>Consent expired</span>
        </div>
      )
    case 'denied':
      return (
        <div className="flex items-center text-xs text-red-600">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          <span>Consent denied</span>
        </div>
      )
    default:
      return (
        <div className="flex items-center text-xs text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>Status unknown</span>
        </div>
      )
  }
}

// Helper function to get action buttons for consent workflow
const getConsentActionButtons = (patient: Patient, onRequestConsent: (patient: Patient) => void) => {
  if (!patient.requires_consent || patient.consent_status === 'granted') {
    return (
      <Link
        href={`/dashboard/doctor/patients/${patient.id}`}
        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
      >
        <EyeIcon className="h-4 w-4 mr-1" />
        View
      </Link>
    )
  }

  if (patient.consent_status === 'pending' || patient.consent_status === 'expired') {
    return (
      <button
        onClick={() => onRequestConsent(patient)}
        className="text-orange-600 hover:text-orange-900 inline-flex items-center mr-3"
      >
        <ShieldCheckIcon className="h-4 w-4 mr-1" />
        Request Consent
      </button>
    )
  }

  if (patient.consent_status === 'requested') {
    return (
      <button
        onClick={() => onRequestConsent(patient)}
        className="text-yellow-600 hover:text-yellow-900 inline-flex items-center mr-3"
      >
        <ClockIcon className="h-4 w-4 mr-1" />
        Verify OTP
      </button>
    )
  }

  return (
    <span className="text-gray-400 text-sm">No access</span>
  )
}

// Mock data removed - using real API data only

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
                    {getInitials(patient.firstName, patient.lastName)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h3>
                <p className="text-sm text-gray-500">{patient.medicalRecordNumber}</p>
              </div>

              {/* Critical & Non-Critical Boxes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {patient.criticalAlerts ?? 'N/A'}
                  </div>
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {patient.adherenceRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${patient.adherenceRate}%` }}
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
                  <div>Last visit: {patient.lastVisit ? formatDate(patient.lastVisit) : "No previous visits"}</div>
                  <div>Next appointment: {patient.nextAppointment ? formatDate(patient.nextAppointment) : "No upcoming appointments"}</div>
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
  const [selectedPatientForConsent, setSelectedPatientForConsent] = useState<Patient | null>(null)
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)

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
      
      try {
        const result = await apiRequest.get(endpoint)
        
        if ((result as any).status && (result as any).payload?.data?.patients) {
          // Convert the patients object to an array with consent workflow fields
          const patientsArray = Object.values((result as any).payload.data.patients).map((patient: any) => ({
            id: patient.basic_info?.id || patient.id,
            userId: patient.basic_info?.userId || patient.userId,
            firstName: patient.basic_info?.firstName || patient.firstName,
            lastName: patient.basic_info?.lastName || patient.lastName,
            email: patient.basic_info?.email || patient.email,
            phone: patient.basic_info?.mobileNumber || patient.phone,
            date_of_birth: patient.basic_info?.date_of_birth || patient.date_of_birth,
            gender: patient.basic_info?.gender || patient.gender,
            medicalRecordNumber: patient.basic_info?.patientId || patient.medicalRecordNumber,
            lastVisit: patient.medical_info?.lastVisit || patient.lastVisit || null,
            nextAppointment: patient.medical_info?.nextAppointment || patient.nextAppointment || null,
            adherenceRate: patient.medical_info?.adherenceRate ?? patient.adherenceRate ?? 0,
            criticalAlerts: patient.medical_info?.criticalAlerts ?? patient.criticalAlerts ?? 0,
            total_appointments: patient.medical_info?.total_appointments ?? patient.total_appointments ?? 0,
            active_care_plans: patient.medical_info?.active_care_plans ?? patient.active_care_plans ?? 0,
            status: patient.basic_info?.status || patient.status || 'active',
            createdAt: patient.basic_info?.createdAt || patient.createdAt,
            
            // Consent workflow fields
            patient_type: patient.patient_type || 'M',
            patient_type_label: patient.patient_type_label || 'Primary Patient',
            access_type: patient.access_type || 'primary',
            requires_consent: patient.requires_consent || false,
            consent_status: patient.consent_status || 'not_required',
            accessGranted: patient.accessGranted ?? true,
            can_view: patient.can_view ?? true,
            same_provider: patient.same_provider || false,
            assignment_id: patient.assignment_id || null,
            assignment_reason: patient.assignment_reason || null,
            specialtyFocus: patient.specialtyFocus || [],
            primary_doctor_provider: patient.primary_doctor_provider || null,
            secondary_doctor_provider: patient.secondary_doctor_provider || null
          }))
          setPatients(patientsArray)
          return
        }
      } catch (apiError) {
        console.error('API call failed:', apiError)
        setPatients([])
        // Don't throw - let component handle gracefully
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search with debouncing
  const handleSearch = useCallback(async (query: string) => {
    setSearchTerm(query)
    await fetchPatients(query)
  }, [])

  const filteredPatients = patients.filter(patient => {
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter
    return matchesStatus
  })

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDrawerOpen(true)
  }

  const handleRequestConsent = (patient: Patient) => {
    setSelectedPatientForConsent(patient)
    setIsOtpModalOpen(true)
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
              Manage and monitor your patients&apos; health journey
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
              {patients.filter(p => (p.criticalAlerts ?? 0) > 0).length}
            </div>
            <div className="text-sm text-gray-600">With Alerts</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {patients.length > 0 ? Math.round(patients.reduce((sum, p) => sum + (p.adherenceRate ?? 0), 0) / patients.length) : 0}%
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
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consent Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adherence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alerts
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
                                {getInitials(patient.firstName, patient.lastName)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {patient.medicalRecordNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPatientTypeBadge(patient)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.email}</div>
                        <div className="text-sm text-gray-500">{patient.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.lastVisit ? formatDate(patient.lastVisit) : 'No visits'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getConsentStatusBadge(patient)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {patient.adherenceRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.criticalAlerts === null || patient.criticalAlerts === undefined ? (
                          <span className="text-gray-400 italic text-sm">No alert data</span>
                        ) : patient.criticalAlerts > 0 ? (
                          <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm text-red-600">
                              {patient.criticalAlerts}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handlePatientClick(patient)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {getConsentActionButtons(patient, handleRequestConsent)}
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

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => {
          setIsOtpModalOpen(false)
          setSelectedPatientForConsent(null)
        }}
        patient={selectedPatientForConsent}
        onSuccess={(patient) => {
          // Refresh patient list to show updated consent status
          fetchPatients(searchTerm)
        }}
      />
    </>
  )
}