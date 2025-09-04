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
    }>;
    biography?: string;
    practiceAddress: any;
    boardCertifications: string[];
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

  const handleSaveField = async (field: string) => {
    try {
      const fieldParts = field.split('.');
      const updateData: any = {};
      let currentLevel = updateData;

      fieldParts.forEach((part, index) => {
        if (index === fieldParts.length - 1) {
          currentLevel[part] = tempValues[field];
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
              currentLevel[part] = tempValues[field];
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

  return (
    <div className="space-y-8">
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
            <div className="space-y-3">
              {(profile.professional.qualificationDetails || []).length > 0 ? (
                (profile.professional.qualificationDetails || []).map((edu, index) => (
                  <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        <p className="text-xs text-gray-500">{edu.year}</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 p-1">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No qualifications added</h3>
                  <p className="mt-1 text-sm text-gray-500">Add your degrees and other qualifications.</p>
                </div>
              )}
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
              {(profile.professional.boardCertifications || []).map((certification, index) => (
                <div key={index} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{certification}</h4>
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

              {/* Associated Clinics/Hospitals - This section is removed as the data is not available in the API */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Associated Clinics & Hospitals</h4>
                <div className="text-center py-4 border rounded-lg">
                  <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No additional clinics</h3>
                  <p className="mt-1 text-sm text-gray-500">This feature is not yet available.</p>
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