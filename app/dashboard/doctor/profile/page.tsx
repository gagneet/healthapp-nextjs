'use client'

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
  UsersIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DoctorProfile {
  id: string
  user_id: string
  speciality_id: string
  medical_license_number: string
  years_of_experience: number
  qualification_details: Array<{
    degree: string
    institution: string
    year: string
  }>
  bio?: string
  consultation_fee: number
  availability_schedule: {
    monday?: { start: string; end: string; available: boolean }
    tuesday?: { start: string; end: string; available: boolean }
    wednesday?: { start: string; end: string; available: boolean }
    thursday?: { start: string; end: string; available: boolean }
    friday?: { start: string; end: string; available: boolean }
    saturday?: { start: string; end: string; available: boolean }
    sunday?: { start: string; end: string; available: boolean }
  }
  practice_address: object | string
  board_certifications: string[]
  languages_spoken: string[]
  profile_picture_url: string
  average_rating: number | null
  total_patients: number
  speciality: {
    id: string
    name: string
    description: string
  } | null
  mobile_number?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  email?: string
}

export default function DoctorProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValues, setTempValues] = useState<any>({})

  useEffect(() => {
    fetchDoctorProfile()
  }, [])

  const fetchDoctorProfile = async () => {
    try {
      const response = await apiRequest.get('/doctors/profile')
      if ((response as any).status && (response as any).payload?.data?.profile) {
        setProfile((response as any).payload.data.profile)
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
      const response = await apiRequest.put('/doctors/profile', {
        [field]: tempValues[field]
      })
      
      if ((response as any).status) {
        setProfile(prev => prev ? { ...prev, [field]: tempValues[field] } : null)
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
      const response = await apiRequest.post('/doctors/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if ((response as any).status && (response as any).payload?.data?.imageUrl) {
        setProfile(prev => prev ? { ...prev, profile_picture_url: (response as any).payload.data.imageUrl } : null)
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
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt="Profile"
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
              Dr. {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-blue-100">{profile.speciality?.name || 'Specialty not specified'}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center">
                <StarIcon className="h-4 w-4 text-yellow-300 mr-1" />
                <span>{profile.average_rating ? profile.average_rating.toString() : '0.0'}</span>
              </div>
              <div className="flex items-center">
                <UsersIcon className="h-4 w-4 text-blue-200 mr-1" />
                <span>{profile.total_patients} patients</span>
              </div>
              <div className="flex items-center">
                <BriefcaseIcon className="h-4 w-4 text-blue-200 mr-1" />
                <span>{profile.years_of_experience} years experience</span>
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
              <EditableField field="medical_license_number" value={profile.medical_license_number} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <EditableField field="years_of_experience" value={profile.years_of_experience} type="number" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultation Fee (₹)
              </label>
              <EditableField field="consultation_fee" value={profile.consultation_fee} type="number" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <EditableField field="bio" value={profile.bio || ''} multiline />
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
                <EditableField field="mobile_number" value={(profile as any).mobile_number || user?.mobile_number} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Practice Address
              </label>
              <EditableField field="practice_address" value={typeof profile.practice_address === 'string' ? profile.practice_address : JSON.stringify(profile.practice_address || {})} multiline />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {(profile.languages_spoken || []).map((language, index) => (
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

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(profile.qualification_details || []).map((edu, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                  <p className="text-sm text-gray-600">{edu.institution}</p>
                  <p className="text-xs text-gray-500">{edu.year}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(profile.board_certifications || []).map((cert, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900">{cert}</h4>
                </div>
              ))}
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
            {Object.entries(profile.availability_schedule || {}).map(([day, schedule]) => (
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