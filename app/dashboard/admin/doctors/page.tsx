'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Doctor {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  mobile_number?: string
  medical_license_number: string
  specialties: string[]
  years_of_experience?: number
  is_verified: boolean
  practice_name?: string
  created_at: string
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      setIsLoading(true)
      // This would be replaced with actual API call
      // const response = await fetch('/api/admin/doctors')
      // const data = await response.json()
      
      // Mock data for demonstration
      setTimeout(() => {
        setDoctors([
          {
            id: '1',
            user_id: '1',
            first_name: 'Dr. John',
            last_name: 'Doe',
            email: 'doctor@healthapp.com',
            mobile_number: '+1234567890',
            medical_license_number: 'LIC-12345-TEST',
            specialties: ['general medicine'],
            years_of_experience: 10,
            is_verified: true,
            practice_name: 'Dr. John Doe Family Practice',
            created_at: '2024-01-01T00:00:00Z'
          }
        ])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
      toast.error('Failed to fetch doctors')
      setIsLoading(false)
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.medical_license_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateDoctor = () => {
    setShowCreateModal(true)
  }

  const handleEditDoctor = (doctorId: string) => {
    toast.info('Edit functionality will be implemented')
  }

  const handleDeleteDoctor = async (doctorId: string) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      try {
        // This would be replaced with actual API call
        // await fetch(`/api/admin/doctors/${doctorId}`, { method: 'DELETE' })
        
        setDoctors(doctors.filter(d => d.id !== doctorId))
        toast.success('Doctor deleted successfully')
      } catch (error) {
        console.error('Failed to delete doctor:', error)
        toast.error('Failed to delete doctor')
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
      toast.success('Doctor verified successfully')
    } catch (error) {
      console.error('Failed to verify doctor:', error)
      toast.error('Failed to verify doctor')
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
        <Button onClick={handleCreateDoctor} className="flex items-center gap-2">
          <UserPlusIcon className="h-4 w-4" />
          Add New Doctor
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search doctors by name, email, or license number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                {doctors.filter(d => d.is_verified).length} Verified
              </Badge>
              <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                <XCircleIcon className="h-3 w-3 mr-1" />
                {doctors.filter(d => !d.is_verified).length} Pending
              </Badge>
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
                        {doctor.first_name[0]}{doctor.last_name[0]}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {doctor.first_name} {doctor.last_name}
                        </h3>
                        {doctor.is_verified ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Pending Verification
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>{doctor.email}</span>
                        </div>
                        {doctor.mobile_number && (
                          <div className="flex items-center space-x-1">
                            <PhoneIcon className="h-4 w-4" />
                            <span>{doctor.mobile_number}</span>
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
                      <Button
                        onClick={() => handleVerifyDoctor(doctor.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    )}
                    <Button
                      onClick={() => handleEditDoctor(doctor.id)}
                      size="sm"
                      variant="outline"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteDoctor(doctor.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Doctor Modal - Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Doctor</h2>
            <p className="text-gray-600 mb-4">Create doctor functionality will be implemented here.</p>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={() => setShowCreateModal(false)}>
                Create Doctor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}