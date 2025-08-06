'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  PlusIcon, 
  MapPinIcon, 
  PhoneIcon, 
  GlobeAltIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import AddressInputWithGeocoding from '@/components/forms/AddressInputWithGeocoding'

interface Clinic {
  id: string
  name: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postal_code: string
    formatted_address?: string
  }
  phone?: string
  email?: string
  website?: string
  consultation_fee?: number
  operating_hours?: object
  services_offered?: string[]
  is_primary: boolean
  is_active: boolean
  latitude?: number
  longitude?: number
  location_verified: boolean
  location_accuracy?: string
  created_at: string
  updated_at: string
}

export default function ClinicsPage() {
  const { user } = useAuth()
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      formatted_address: ''
    },
    phone: '',
    email: '',
    website: '',
    consultation_fee: '',
    operating_hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '14:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: true }
    },
    services_offered: [] as string[],
    is_primary: false
  })
  const [formLoading, setFormLoading] = useState(false)

  // Fetch clinics
  const fetchClinics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/doctors/clinics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (result.status) {
        setClinics(result.payload.data.clinics || [])
      } else {
        throw new Error(result.payload?.error?.message || 'Failed to fetch clinics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clinics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClinics()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setFormLoading(true)
      const token = localStorage.getItem('token')
      
      const submitData = {
        ...formData,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
        services_offered: formData.services_offered.filter(service => service.trim() !== '')
      }

      const url = editingClinic ? `/api/doctors/clinics/${editingClinic.id}` : '/api/doctors/clinics'
      const method = editingClinic ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()
      
      if (result.status) {
        await fetchClinics() // Refresh clinics list
        resetForm()
        setShowAddForm(false)
        setEditingClinic(null)
      } else {
        throw new Error(result.payload?.error?.message || 'Failed to save clinic')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save clinic')
    } finally {
      setFormLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        formatted_address: ''
      },
      phone: '',
      email: '',
      website: '',
      consultation_fee: '',
      operating_hours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '10:00', close: '14:00', closed: false },
        sunday: { open: '10:00', close: '14:00', closed: true }
      },
      services_offered: [],
      is_primary: false
    })
  }

  // Edit clinic
  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic)
    setFormData({
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone || '',
      email: clinic.email || '',
      website: clinic.website || '',
      consultation_fee: clinic.consultation_fee?.toString() || '',
      operating_hours: clinic.operating_hours || formData.operating_hours,
      services_offered: clinic.services_offered || [],
      is_primary: clinic.is_primary
    })
    setShowAddForm(true)
  }

  // Delete clinic
  const handleDelete = async (clinicId: string) => {
    if (!confirm('Are you sure you want to delete this clinic?')) return

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/doctors/clinics/${clinicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (result.status) {
        await fetchClinics() // Refresh clinics list
      } else {
        throw new Error(result.payload?.error?.message || 'Failed to delete clinic')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete clinic')
    }
  }

  // Geocode clinic manually
  const handleGeocode = async (clinicId: string) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/doctors/clinics/${clinicId}/geocode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (result.status) {
        await fetchClinics() // Refresh clinics list
      } else {
        throw new Error(result.payload?.error?.message || 'Failed to geocode address')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to geocode address')
    }
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Clinic Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your clinic locations and practice information
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => {
              resetForm()
              setEditingClinic(null)
              setShowAddForm(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Clinic
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingClinic ? 'Edit Clinic' : 'Add New Clinic'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. Smith Family Practice"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1-555-123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="info@clinic.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.clinic.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Fee ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150.00"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_primary}
                      onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Primary Clinic</span>
                  </label>
                </div>
              </div>

              {/* Address with Geo-location */}
              <AddressInputWithGeocoding
                address={formData.address}
                onAddressChange={(address) => setFormData({ ...formData, address })}
                onGeocodeSuccess={(data) => {
                  console.log('Geocoding success:', data)
                }}
                onGeocodeError={(error) => {
                  console.error('Geocoding error:', error)
                }}
              />

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingClinic(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : editingClinic ? 'Update Clinic' : 'Create Clinic'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Clinics List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clinics.map((clinic) => (
          <Card key={clinic.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    {clinic.name}
                    {clinic.is_primary && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Primary
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center mt-1">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                    {clinic.location_verified ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-600">
                      {clinic.location_verified ? 'Location Verified' : 'Location Not Verified'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(clinic)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(clinic.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Address */}
              <div>
                <p className="text-sm text-gray-900">
                  {clinic.address.street}
                </p>
                <p className="text-sm text-gray-600">
                  {clinic.address.city}, {clinic.address.state} {clinic.address.postal_code}
                </p>
                {clinic.address.country && (
                  <p className="text-sm text-gray-600">{clinic.address.country}</p>
                )}
              </div>

              {/* Contact Info */}
              {clinic.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{clinic.phone}</span>
                </div>
              )}

              {clinic.website && (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <a 
                    href={clinic.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {clinic.website}
                  </a>
                </div>
              )}

              {/* Consultation Fee */}
              {clinic.consultation_fee && (
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    Consultation Fee: ${clinic.consultation_fee}
                  </span>
                </div>
              )}

              {/* Location Actions */}
              {!clinic.location_verified && clinic.address.street && (
                <div className="pt-3 border-t">
                  <button
                    onClick={() => handleGeocode(clinic.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    Verify Location
                  </button>
                </div>
              )}

              {/* Coordinates Display */}
              {clinic.latitude && clinic.longitude && (
                <div className="text-xs text-gray-500">
                  Coordinates: {clinic.latitude}, {clinic.longitude}
                  {clinic.location_accuracy && (
                    <span className="ml-2">({clinic.location_accuracy})</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {clinics.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clinics</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new clinic.</p>
          <div className="mt-6">
            <button
              onClick={() => {
                resetForm()
                setEditingClinic(null)
                setShowAddForm(true)
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Clinic
            </button>
          </div>
        </div>
      )}
    </div>
  )
}