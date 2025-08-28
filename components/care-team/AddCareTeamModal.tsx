'use client'

import { useState } from 'react'
import { X, UserPlus, Shield, Phone, Mail, CheckCircle } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import toast from 'react-hot-toast'

interface AddCareTeamModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  patientName: string
  onSuccess?: () => void
}

interface DoctorInfo {
  id: string
  name: string
  email: string
  speciality: string
  phone: string
}

export default function AddCareTeamModal({ 
  isOpen, 
  onClose, 
  patientId, 
  patientName,
  onSuccess 
}: AddCareTeamModalProps) {
  const [step, setStep] = useState<'search' | 'consent' | 'verify' | 'success'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DoctorInfo[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorInfo | null>(null)
  const [patientPhone, setPatientPhone] = useState('')
  const [permissions, setPermissions] = useState<string[]>([
    'view_medical_records',
    'add_medications', 
    'schedule_appointments'
  ])
  const [otpCode, setOtpCode] = useState('')
  const [consentId, setConsentId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const availablePermissions = [
    { id: 'view_medical_records', label: 'View Medical Records', description: 'Access patient medical history' },
    { id: 'add_medications', label: 'Prescribe Medications', description: 'Add and modify medications' },
    { id: 'schedule_appointments', label: 'Schedule Appointments', description: 'Book and manage appointments' },
    { id: 'access_vital_signs', label: 'View Vital Signs', description: 'Monitor health metrics' },
    { id: 'modify_care_plans', label: 'Modify Care Plans', description: 'Update treatment plans' }
  ]

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      // TODO: Replace with actual search API
      // const response = await apiRequest.get(`/doctors/search?query=${encodeURIComponent(searchQuery)}`)
      // setSearchResults(response.payload?.data?.doctors || [])
      
      // Mock search results for development
      const mockResults: DoctorInfo[] = [
        {
          id: 'doc1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@hospital.com',
          speciality: 'Cardiologist',
          phone: '+1-555-0123'
        },
        {
          id: 'doc2', 
          name: 'Dr. Michael Chen',
          email: 'michael.chen@clinic.com',
          speciality: 'Endocrinologist',
          phone: '+1-555-0124'
        }
      ]
      setSearchResults(mockResults.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.speciality.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    } catch (error) {
      toast.error('Failed to search doctors')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDoctorSelect = (doctor: DoctorInfo) => {
    setSelectedDoctor(doctor)
    setStep('consent')
  }

  const handleRequestConsent = async () => {
    if (!selectedDoctor || !patientPhone) return

    setIsLoading(true)
    try {
      const response = await apiRequest.post(`/patients/${patientId}/consents/request`, {
        doctorId: selectedDoctor.id,
        doctor_email: selectedDoctor.email,
        doctor_name: selectedDoctor.name,
        patient_phone: patientPhone,
        consent_type: 'care_team_access',
        permissions
      })

      if ((response as any).status) {
        setConsentId((response as any).payload.data.consent_id)
        setStep('verify')
        toast.success('OTP sent to patient mobile number')
      } else {
        toast.error('Failed to send consent request')
      }
    } catch (error) {
      toast.error('Failed to send consent request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode || !consentId || !selectedDoctor) return

    setIsLoading(true)
    try {
      const response = await apiRequest.post('/patients/consents/verify', {
        consent_id: consentId,
        otp: otpCode,
        patientId: patientId,
        doctorId: selectedDoctor.id
      })

      if ((response as any).status) {
        setStep('success')
        toast.success('Care team member added successfully!')
        onSuccess?.()
      } else {
        toast.error((response as any).payload?.error?.message || 'Invalid OTP')
      }
    } catch (error) {
      toast.error('Failed to verify OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    setPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleClose = () => {
    setStep('search')
    setSearchQuery('')
    setSearchResults([])
    setSelectedDoctor(null)
    setPatientPhone('')
    setOtpCode('')
    setConsentId('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Care Team Member</h2>
            <p className="text-sm text-gray-600 mt-1">For {patientName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {['search', 'consent', 'verify', 'success'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? 'bg-blue-600 text-white' :
                  ['search', 'consent', 'verify', 'success'].indexOf(step) > index ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    ['search', 'consent', 'verify', 'success'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Search Doctor */}
          {step === 'search' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for Doctor/HSP
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter doctor name or speciality"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !searchQuery.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Search
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Search Results</h3>
                  {searchResults.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => handleDoctorSelect(doctor)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                          <p className="text-sm text-gray-600">{doctor.speciality}</p>
                          <p className="text-xs text-gray-500">{doctor.email}</p>
                        </div>
                        <UserPlus className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Consent Request */}
          {step === 'consent' && selectedDoctor && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-blue-900">Patient Consent Required</h3>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  Patient consent is required to add {selectedDoctor.name} to the care team.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Selected Doctor</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedDoctor.name}</p>
                  <p className="text-sm text-gray-600">{selectedDoctor.speciality}</p>
                  <p className="text-sm text-gray-600">{selectedDoctor.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Mobile Number *
                </label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">OTP will be sent to this number</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Permissions</h4>
                <div className="space-y-2">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={permissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">{permission.label}</span>
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRequestConsent}
                disabled={isLoading || !patientPhone}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Phone className="h-4 w-4 mr-2" />
                Send OTP to Patient
              </button>
            </div>
          )}

          {/* Step 3: OTP Verification */}
          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center">
                <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Enter Verification Code</h3>
                <p className="text-sm text-gray-600">
                  A 4-digit OTP has been sent to the patient's mobile number.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={4}
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || otpCode.length !== 4}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Verify & Add to Care Team
              </button>

              <button
                onClick={() => setStep('consent')}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back to Edit Details
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && selectedDoctor && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Care Team Updated!</h3>
                <p className="text-gray-600">
                  {selectedDoctor.name} has been successfully added to {patientName}'s care team.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg text-left">
                <h4 className="font-medium text-green-900 mb-2">Granted Permissions:</h4>
                <ul className="space-y-1">
                  {permissions.map((permId) => {
                    const perm = availablePermissions.find(p => p.id === permId)
                    return perm ? (
                      <li key={permId} className="text-sm text-green-700 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        {perm.label}
                      </li>
                    ) : null
                  })}
                </ul>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}