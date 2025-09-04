'use client'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  ClockIcon,
  CalendarIcon,
  StarIcon,
  UsersIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { userHelpers } from '@/types/auth'
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { QualificationCard } from '@/components/dashboard/QualificationCard';

type Qualification = {
  degree: string;
  institution: string;
  year: string;
  type: 'degree' | 'specialization' | 'continuing_education';
  honors?: string;
  duration?: string;
  credits?: string;
};

type Certification = {
  name: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
};

interface DoctorProfile {
  id: string;
  doctorId: string;
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
    emailVerified: Date | null;
    firstName: string;
    lastName: string;
    fullName: string;
    profilePictureUrl: string;
    emailVerifiedLegacy: boolean;
    middleName: string;
    phone: string;
    dateOfBirth: Date;
    gender: string;
    accountStatus: string;
    timezone: string;
    locale: string;
    lastLoginAt: Date;
  };
  professional: {
    practiceName: string;
    medicalLicenseNumber: string;
    yearsOfExperience: number;
    consultationFee: number;
    specialty: {
      id: string;
      name: string;
      description: string;
    } | null;
    organization: {
      id: string;
      name: string;
      type: string;
      contactInfo: any;
    } | null;
    qualificationDetails: Array<{
        degree: string;
        institution: string;
        year: string;
        type: 'degree' | 'specialization' | 'continuing_education';
        honors?: string;
        duration?: string;
        credits?: string;
    }>;
    biography?: string;
    practiceAddress: any;
    boardCertifications: Array<{
      name: string;
      issuer?: string;
      issueDate?: string;
      expiryDate?: string;
      credentialId?: string;
    }>;
    languagesSpoken: string[];
  };
  statistics: {
    totalPatients: number;
    recentAppointments: number;
    appointmentCompletionRate: number;
    accountCreated: Date;
    lastUpdated: Date;
    averageRating: number | null;
  };
  settings: {
      notificationPreferences: any;
      availabilitySchedule: any;
  };
}

export default function DoctorProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValues, setTempValues] = useState<any>({})
  
  // Modal states for the new sections
  const [showAddQualificationModal, setShowAddQualificationModal] = useState(false)
  const [showAddCertificationModal, setShowAddCertificationModal] = useState(false)
  const [showAddClinicModal, setShowAddClinicModal] = useState(false)

  useEffect(() => {
    fetchDoctorProfile()
  }, [])

  const fetchDoctorProfile = async () => {
    try {
      const response = await apiRequest.get('/doctors/profile')
      if ((response as any).status && (response as any).payload?.data) {
        setProfile((response as any).payload.data)
      }
    } catch (error) {
      console.error('Failed to fetch doctor profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditField = (field: string, currentValue: any) => {
    setEditingField(field)
    setTempValues({ [field]: currentValue })
  }

  const handleSaveField = async (field: string, valueToSave?: any) => {
    try {
      const fieldParts = field.split('.');
      const updateData: any = {};
      let currentLevel = updateData;
      const value = valueToSave !== undefined ? valueToSave : tempValues[field];

      fieldParts.forEach((part, index) => {
        if (index === fieldParts.length - 1) {
          currentLevel[part] = value;
        } else {
          currentLevel[part] = {};
          currentLevel = currentLevel[part];
        }
      });

      const response = await apiRequest.put('/doctors/profile', updateData);
      
      if ((response as any).status) {
        setProfile(prev => {
          if (!prev) return null;

          // Deep copy to avoid direct state mutation
          const newProfile = structuredClone(prev);

          let currentLevel = newProfile;
          fieldParts.forEach((part:string, index:number) => {
            if (index === fieldParts.length - 1) {
              currentLevel[part] = value;
            } else {
              currentLevel = currentLevel[part];
            }
          });

          return newProfile;
        })
        setEditingField(null)
        setTempValues({})
        toast.success('Profile updated successfully')
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setTempValues({})
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('profile_image', file)

    try {
      const response = await apiRequest.post('/doctors/profile/images', formData)
      
      if ((response as any).status && (response as any).payload?.data?.imageUrl) {
        setProfile(prev => prev ? { ...prev, user: { ...prev.user, image: (response as any).payload.data.imageUrl } } : null)
        toast.success('Profile image updated successfully')
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast.error('Failed to upload image')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No profile found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please complete your profile setup to get started.
        </p>
      </div>
    )
  }

  const EditableField = ({ 
    field, 
    value, 
    type = 'text', 
    multiline = false,
    options = null 
  }: { 
    field: string
    value: any
    type?: string
    multiline?: boolean
    options?: Array<{ value: string; label: string }> | null
  }) => {
    const isEditing = editingField === field

    return (
      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex-1 flex items-center space-x-2">
            {options ? (
              <select
                value={tempValues[field] || value}
                onChange={(e) => setTempValues({ ...tempValues, [field]: e.target.value })}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : multiline ? (
              <textarea
                value={tempValues[field] || value}
                onChange={(e) => setTempValues({ ...tempValues, [field]: e.target.value })}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <input
                type={type}
                value={tempValues[field] || value}
                onChange={(e) => setTempValues({ ...tempValues, [field]: e.target.value })}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            )}
            <button
              onClick={() => handleSaveField(field)}
              className="p-1 text-green-600 hover:text-green-800"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 text-red-600 hover:text-red-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <span className="text-gray-900">{value || 'Not specified'}</span>
            <button
              onClick={() => handleEditField(field, value)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  const AddQualificationModal = ({
    isOpen,
    onClose,
    onSave,
  }: {
    isOpen: boolean
    onClose: () => void
    onSave: (qualification: Qualification) => void
  }) => {
    const [degree, setDegree] = useState('')
    const [institution, setInstitution] = useState('')
    const [year, setYear] = useState('')
    const [type, setType] = useState<'degree' | 'specialization' | 'continuing_education'>('degree')

    if (!isOpen) return null

    const handleSave = () => {
      onSave({ degree, institution, year, type })
      onClose()
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Add Qualification</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={type}
                onChange={(e) => {
                  const value = e.target.value;
                  if (
                    value === 'degree' ||
                    value === 'specialization' ||
                    value === 'continuing_education'
                  ) {
                    setType(value);
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="degree">Medical Degree</option>
                <option value="specialization">Specialization / Residency</option>
                <option value="continuing_education">Continuing Education</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Degree/Title</label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  const AddCertificationModal = ({
    isOpen,
    onClose,
    onSave,
  }: {
    isOpen: boolean
    onClose: () => void
    onSave: (certification: Certification) => void
  }) => {
    const [name, setName] = useState('')
    const [issuer, setIssuer] = useState('')
    const [issueDate, setIssueDate] = useState('')

    if (!isOpen) return null

    const handleSave = () => {
      onSave({ name, issuer, issueDate })
      onClose()
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Add Certification</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Issuer</label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AddQualificationModal
        isOpen={showAddQualificationModal}
        onClose={() => setShowAddQualificationModal(false)}
        onSave={(newQualification) => {
          const updatedQualifications = [...(profile?.professional.qualificationDetails || []), newQualification];
          handleSaveField('professional.qualificationDetails', updatedQualifications);
          setShowAddQualificationModal(false);
        }}
      />
      <AddCertificationModal
        isOpen={showAddCertificationModal}
        onClose={() => setShowAddCertificationModal(false)}
        onSave={(newCertification) => {
          const updatedCertifications = [...(profile?.professional.boardCertifications || []), newCertification];
          handleSaveField('professional.boardCertifications', updatedCertifications);
          setShowAddCertificationModal(false);
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center">
              {profile.user.image ? (
                <img
                  src={profile.user.image}
                  alt={userHelpers.getDisplayName(user)}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-12 w-12 text-white" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 cursor-pointer hover:bg-blue-600">
              <CameraIcon className="h-4 w-4 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              Dr. {profile.user.name}
            </h1>
            <p className="text-blue-100">{profile.professional.specialty?.name || 'Specialty not specified'}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center">
                <StarIcon className="h-4 w-4 text-yellow-300 mr-1" />
                <span>{profile.statistics.averageRating ? profile.statistics.averageRating.toString() : '0.0'}</span>
              </div>
              <div className="flex items-center">
                <UsersIcon className="h-4 w-4 text-blue-200 mr-1" />
                <span>{profile.statistics.totalPatients} patients</span>
              </div>
              <div className="flex items-center">
                <BriefcaseIcon className="h-4 w-4 text-blue-200 mr-1" />
                <span>{profile.professional.yearsOfExperience} years experience</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-900">{user?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              <EditableField field="professional.medicalLicenseNumber" value={profile.professional.medicalLicenseNumber} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <EditableField field="professional.yearsOfExperience" value={profile.professional.yearsOfExperience} type="number" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultation Fee (₹)
              </label>
              <EditableField field="professional.consultationFee" value={profile.professional.consultationFee} type="number" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Practice Name
              </label>
              <EditableField field="professional.practiceName" value={profile.professional.practiceName || ''} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <EditableField field="professional.biography" value={profile.professional.biography || ''} multiline />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Contact & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                <EditableField field="user.phone" value={profile.user.phone || ''} type="tel" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Practice Address
              </label>
              <EditableField field="professional.practiceAddress" value={typeof profile.professional.practiceAddress === 'string' ? profile.professional.practiceAddress : JSON.stringify(profile.professional.practiceAddress || {})} multiline />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {(profile.professional.languagesSpoken || []).map((language, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Education & Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Education & Qualifications
              </div>
              <button 
                onClick={() => setShowAddQualificationModal(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Degrees */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Medical Degrees</h4>
                <div className="space-y-3">
                  {(profile.professional.qualificationDetails || []).filter(q => q.type === 'degree').map((edu, index) => (
                    <QualificationCard key={index} {...edu} onEdit={() => {}} />
                  ))}
                </div>
              </div>

              {/* Specializations */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Specializations & Residencies</h4>
                <div className="space-y-3">
                  {(profile.professional.qualificationDetails || []).filter(q => q.type === 'specialization').map((spec, index) => (
                    <QualificationCard key={index} {...spec} onEdit={() => {}} />
                  ))}
                </div>
              </div>

              {/* Continuing Education */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Continuing Education & Training</h4>
                <div className="space-y-3">
                  {(profile.professional.qualificationDetails || []).filter(q => q.type === 'continuing_education').map((edu, index) => (
                    <QualificationCard key={index} {...edu} onEdit={() => {}} />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Certifications & Licenses
              </div>
              <button 
                onClick={() => setShowAddCertificationModal(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(profile.professional.boardCertifications || []).map((cert, index) => (
                <div key={index} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{cert.name}</h4>
                      {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                      {cert.issueDate && <p className="text-xs text-gray-500">Issued: {formatDate(cert.issueDate)}</p>}
                      {cert.expiryDate && <p className="text-xs text-gray-500">Expires: {formatDate(cert.expiryDate)}</p>}
                      {cert.credentialId && (
                        <p className="text-xs text-gray-400 mt-1">ID: {cert.credentialId}</p>
                      )}
                    </div>
                    <button className="text-green-600 hover:text-green-700 p-1">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(!profile.professional.boardCertifications || profile.professional.boardCertifications.length === 0) && (
                <div className="text-center py-4">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No certifications added</h3>
                  <p className="mt-1 text-sm text-gray-500">Add your board certifications and licenses.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clinic & Practice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                Clinic & Practice Details
              </div>
              <button 
                onClick={() => setShowAddClinicModal(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Clinic
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Primary Clinic */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Primary Practice</h4>
                <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {profile.professional.practiceName || profile.professional.organization?.name || 'Practice Name Not Set'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {typeof profile.professional.practiceAddress === 'string' 
                          ? profile.professional.practiceAddress 
                          : profile.professional.practiceAddress?.street || 'Address not provided'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Primary
                        </span>
                        {profile.professional.consultationFee && (
                          <span className="text-xs text-gray-500">
                            Fee: ₹{profile.professional.consultationFee}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 p-1">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Associated Clinics/Hospitals */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Associated Clinics & Hospitals</h4>
                <div className="space-y-3">
                  {/* This would come from a clinics relationship in the future */}
                  {profile.professional.associatedClinics?.map((clinic, index) => (
                    <div key={index} className="border-l-4 border-gray-400 bg-gray-50 p-4 rounded-r-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{clinic.name}</h4>
                          <p className="text-sm text-gray-600">{clinic.address}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">Type: {clinic.type}</span>
                            <span className="text-xs text-gray-500">
                              Schedule: {clinic.schedule || 'Not specified'}
                            </span>
                          </div>
                        </div>
                        <button className="text-gray-600 hover:text-gray-700 p-1">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4">
                      <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No additional clinics</h3>
                      <p className="mt-1 text-sm text-gray-500">Add other clinics or hospitals where you practice.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Practice Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Practice Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years of Experience
                    </label>
                    <EditableField 
                      field="professional.yearsOfExperience" 
                      value={profile.professional.yearsOfExperience} 
                      type="number" 
                    />
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical License Number
                    </label>
                    <EditableField 
                      field="professional.medicalLicenseNumber" 
                      value={profile.professional.medicalLicenseNumber} 
                    />
                  </div>

                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Consultation Fee (₹)
                    </label>
                    <EditableField 
                      field="professional.consultationFee" 
                      value={profile.professional.consultationFee} 
                      type="number" 
                    />
                  </div>

                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialty
                    </label>
                    <span className="text-gray-900">
                      {profile.professional.specialty?.name || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Availability Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Availability Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {Object.entries(profile.settings.availabilitySchedule || {}).map(([day, schedule]) => (
              <div key={day} className="border rounded-lg p-3">
                <h4 className="font-medium text-gray-900 capitalize">{day}</h4>
                {schedule?.available ? (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      {schedule.start} - {schedule.end}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                      Available
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                    Not Available
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}