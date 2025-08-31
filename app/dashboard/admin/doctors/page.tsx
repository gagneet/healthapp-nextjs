'use client'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Doctor {
  id: string
  userId: string
  firstName: string
  middle_name?: string
  lastName: string
  full_name: string
  email: string
  mobileNumber?: string
  gender?: string
  medical_license_number: string
  npi_number?: string
  speciality_id?: string
  specialities?: any
  specialties: string[]
  sub_specialties?: string[]
  years_of_experience?: number
  qualification_details?: any[]
  medical_school?: string
  boardCertifications?: string[]
  residency_programs?: string[]
  registration_details?: any
  subscription_details?: any
  razorpay_account_id?: string
  consultation_fee?: number
  practice_name?: string
  practice_address?: any
  practice_phone?: string
  languages_spoken?: string[]
  capabilities?: string[]
  availability_schedule?: any
  notification_preferences?: any
  is_verified: boolean
  email_verified?: boolean
  account_status?: string
  is_available_online?: boolean
  createdAt: string
  updatedAt?: string
}

interface Speciality {
  id: string
  name: string
  description?: string
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialities, setSpecialities] = useState<Speciality[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDoctors()
    fetchSpecialities()
  }, [])

  const fetchDoctors = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/doctors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      const data = await response.json()
      
      if (data.status) {
        // Convert the doctors object to array with null safety
        // Note: basic_info should always exist if doctor profile is complete
        // This defensive check prevents crashes from incomplete doctor profiles
        const doctorsArray = Object.values(data.payload.data.doctors).map((doctor: any) => {
          const basicInfo = doctor.basic_info || {}
          
          // Log warning if basic_info is missing (should be rare)
          if (!doctor.basic_info) {
            console.warn(`Doctor profile incomplete - missing basic_info for doctor ID: ${doctor.id}`)
          }
          
          return {
            id: basicInfo.id || doctor.id || '',
            userId: basicInfo.userId || basicInfo.id || doctor.userId || '',
            firstName: basicInfo.firstName || '',
            lastName: basicInfo.lastName || '',
            full_name: `${basicInfo.firstName || ''} ${basicInfo.lastName || ''}`.trim() || 'Incomplete Profile',
            email: basicInfo.email || doctor.email || '',
            mobileNumber: basicInfo.mobileNumber || doctor.mobileNumber || '',
            medical_license_number: basicInfo.medical_license_number || 'N/A',
            specialties: basicInfo.specialty ? [basicInfo.specialty] : [],
            years_of_experience: basicInfo.years_of_experience || 0,
            is_verified: basicInfo.verification_status === 'verified',
            practice_name: basicInfo.practice_name || '',
            account_status: basicInfo.account_status || 'pending',
            createdAt: basicInfo.createdAt || new Date().toISOString()
          }
        })
        setDoctors(doctorsArray)
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
      setDoctors([])
      setIsLoading(false)
    }
  }

  const fetchSpecialities = async () => {
    try {
      const response = await fetch('/api/specialities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      const data = await response.json()
      if (data.status && data.payload.data) {
        setSpecialities(data.payload.data)
      }
    } catch (error) {
      console.error('Failed to fetch specialities:', error)
      setSpecialities([])
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.medical_license_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateDoctor = () => {
    setSelectedDoctor(null)
    setShowCreateModal(true)
  }

  const handleEditDoctor = async (doctorId: string) => {
    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      const data = await response.json()
      
      if (data.status) {
        setSelectedDoctor(data.payload.data.profile)
        setShowEditModal(true)
      }
    } catch (error) {
      console.error('Failed to fetch doctor details:', error)
      alert('Failed to fetch doctor details')
    }
  }

  const handleDeleteDoctor = async (doctorId: string) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      try {
        // This would be replaced with actual API call
        // await fetch(`/api/admin/doctors/${doctorId}`, { method: 'DELETE' })
        
        setDoctors(doctors.filter(d => d.id !== doctorId))
        alert('Doctor deleted successfully')
      } catch (error) {
        console.error('Failed to delete doctor:', error)
        alert('Failed to delete doctor')
      }
    }
  }

  const handleVerifyDoctor = async (doctorId: string) => {
    try {
      // This would be replaced with actual API call
      // await fetch(`/api/admin/doctors/${doctorId}/verify`, { method: 'POST' })
      
      setDoctors(doctors.map(d => 
        d.id === doctorId ? { ...d, is_verified: true } : d
      ))
      alert('Doctor verified successfully')
    } catch (error) {
      console.error('Failed to verify doctor:', error)
      alert('Failed to verify doctor')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-gray-600">Manage doctor accounts and verification</p>
        </div>
        <button
          onClick={handleCreateDoctor}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlusIcon className="h-4 w-4" />
          Add New Doctor
        </button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name, email, or license number..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-3 py-1 text-sm text-green-600 border border-green-200 rounded-full">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                {doctors.filter(d => d.is_verified).length} Verified
              </div>
              <div className="flex items-center px-3 py-1 text-sm text-yellow-600 border border-yellow-200 rounded-full">
                <XCircleIcon className="h-3 w-3 mr-1" />
                {doctors.filter(d => !d.is_verified).length} Pending
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctors List */}
      <div className="grid gap-4">
        {filteredDoctors.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No doctors found</p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding a new doctor'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">
                        {doctor.firstName[0]}{doctor.lastName[0]}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {doctor.firstName} {doctor.lastName}
                        </h3>
                        {doctor.is_verified ? (
                          <div className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 border border-green-200 rounded-full">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Verified
                          </div>
                        ) : (
                          <div className="flex items-center px-2 py-1 text-xs text-yellow-600 border border-yellow-200 rounded-full">
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Pending Verification
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>{doctor.email}</span>
                        </div>
                        {doctor.mobileNumber && (
                          <div className="flex items-center space-x-1">
                            <PhoneIcon className="h-4 w-4" />
                            <span>{doctor.mobileNumber}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <span>License: {doctor.medical_license_number}</span>
                        {doctor.specialties && doctor.specialties.length > 0 && (
                          <span className="ml-4">
                            Specialties: {doctor.specialties.join(', ')}
                          </span>
                        )}
                        {doctor.years_of_experience && (
                          <span className="ml-4">
                            Experience: {doctor.years_of_experience} years
                          </span>
                        )}
                      </div>
                      
                      {doctor.practice_name && (
                        <div className="text-sm text-gray-500">
                          Practice: {doctor.practice_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!doctor.is_verified && (
                      <button
                        onClick={() => handleVerifyDoctor(doctor.id)}
                        className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => handleEditDoctor(doctor.id)}
                      className="flex items-center px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(doctor.id)}
                      className="flex items-center px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Doctor Modal */}
      {(showCreateModal || showEditModal) && (
        <DoctorFormModal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false)
            setShowEditModal(false)
            setSelectedDoctor(null)
          }}
          doctor={selectedDoctor}
          specialities={specialities}
          onSubmit={async (doctorData) => {
            setIsSubmitting(true)
            try {
              const url = selectedDoctor 
                ? `/api/admin/doctors/${selectedDoctor.id}`
                : '/api/admin/doctors'
              const method = selectedDoctor ? 'PUT' : 'POST'
              
              const response = await fetch(url, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(doctorData)
              })
              
              const data = await response.json()
              
              if (data.status) {
                alert(selectedDoctor ? 'Doctor updated successfully' : 'Doctor created successfully')
                setShowCreateModal(false)
                setShowEditModal(false)
                setSelectedDoctor(null)
                fetchDoctors()
              } else {
                alert(data.payload?.error?.message || 'Failed to save doctor')
              }
            } catch (error) {
              console.error('Failed to save doctor:', error)
              alert('Failed to save doctor')
            } finally {
              setIsSubmitting(false)
            }
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}

// Comprehensive Doctor Form Modal Component
interface DoctorFormModalProps {
  isOpen: boolean
  onClose: () => void
  doctor: Doctor | null
  specialities: Speciality[]
  onSubmit: (doctorData: any) => Promise<void>
  isSubmitting: boolean
}

function DoctorFormModal({ isOpen, onClose, doctor, specialities, onSubmit, isSubmitting }: DoctorFormModalProps) {
  const [formData, setFormData] = useState({
    // Basic Information
    full_name: '',
    firstName: '',
    middle_name: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    gender: '',
    password: '',
    
    // Professional Details
    medical_license_number: '',
    npi_number: '',
    speciality_id: '',
    specialties: [] as string[],
    sub_specialties: [] as string[],
    years_of_experience: 0,
    
    // Qualification Details
    medical_school: '',
    boardCertifications: [] as string[],
    residency_programs: [] as string[],
    
    // Subscription Details
    razorpay_account_id: '',
    consultation_fee: 0,
    
    // Practice Information
    practice_name: '',
    practice_phone: '',
    languages_spoken: ['en'],
    
    // Initial Clinic Information
    clinic_name: '',
    clinic_phone: '',
    clinic_email: '',
  })

  useEffect(() => {
    if (doctor) {
      setFormData({
        full_name: doctor.full_name || '',
        firstName: doctor.firstName || '',
        middle_name: doctor.middle_name || '',
        lastName: doctor.lastName || '',
        email: doctor.email || '',
        mobileNumber: doctor.mobileNumber || '',
        gender: doctor.gender || '',
        password: '', // Never pre-fill password
        medical_license_number: doctor.medical_license_number || '',
        npi_number: doctor.npi_number || '',
        speciality_id: doctor.speciality_id || '',
        specialties: doctor.specialties || [],
        sub_specialties: doctor.sub_specialties || [],
        years_of_experience: doctor.years_of_experience || 0,
        medical_school: doctor.medical_school || '',
        boardCertifications: doctor.boardCertifications || [],
        residency_programs: doctor.residency_programs || [],
        razorpay_account_id: doctor.razorpay_account_id || '',
        consultation_fee: doctor.consultation_fee || 0,
        practice_name: doctor.practice_name || '',
        practice_phone: doctor.practice_phone || '',
        languages_spoken: doctor.languages_spoken || ['en'],
        clinic_name: '',
        clinic_phone: '',
        clinic_email: '',
      })
    } else {
      // Reset form for new doctor
      setFormData({
        full_name: '',
        firstName: '',
        middle_name: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        gender: '',
        password: '',
        medical_license_number: '',
        npi_number: '',
        speciality_id: '',
        specialties: [],
        sub_specialties: [],
        years_of_experience: 0,
        medical_school: '',
        boardCertifications: [],
        residency_programs: [],
        razorpay_account_id: '',
        consultation_fee: 0,
        practice_name: '',
        practice_phone: '',
        languages_spoken: ['en'],
        clinic_name: '',
        clinic_phone: '',
        clinic_email: '',
      })
    }
  }, [doctor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {doctor ? 'Edit Doctor' : 'Add New Doctor'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              {!doctor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Leave empty for system-generated password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">If left empty, a temporary password will be generated</p>
                </div>
              )}
            </div>

            {/* Professional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical License Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.medical_license_number}
                    onChange={(e) => setFormData({...formData, medical_license_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NPI Number</label>
                  <input
                    type="text"
                    value={formData.npi_number}
                    onChange={(e) => setFormData({...formData, npi_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Speciality</label>
                  <select
                    value={formData.speciality_id}
                    onChange={(e) => setFormData({...formData, speciality_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Speciality</option>
                    {specialities.map((spec) => (
                      <option key={spec.id} value={spec.id}>{spec.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({...formData, years_of_experience: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Practice Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Practice Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Practice Name</label>
                  <input
                    type="text"
                    value={formData.practice_name}
                    onChange={(e) => setFormData({...formData, practice_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Practice Phone</label>
                  <input
                    type="tel"
                    value={formData.practice_phone}
                    onChange={(e) => setFormData({...formData, practice_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({...formData, consultation_fee: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical School</label>
                  <input
                    type="text"
                    value={formData.medical_school}
                    onChange={(e) => setFormData({...formData, medical_school: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Initial Clinic Information (for new doctors only) */}
            {!doctor && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Initial Clinic Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                    <input
                      type="text"
                      value={formData.clinic_name}
                      onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Phone</label>
                    <input
                      type="tel"
                      value={formData.clinic_phone}
                      onChange={(e) => setFormData({...formData, clinic_phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Email</label>
                    <input
                      type="email"
                      value={formData.clinic_email}
                      onChange={(e) => setFormData({...formData, clinic_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {doctor ? 'Update Doctor' : 'Create Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
