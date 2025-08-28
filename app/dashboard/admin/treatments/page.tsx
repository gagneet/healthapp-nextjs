'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Treatment {
  id: string
  treatmentName: string
  treatmentType: string
  description?: string
  applicableConditions: string[]
  duration?: string
  frequency?: string
  dosageInfo: Record<string, any>
  category?: string
  severityLevel?: string
  sideEffects?: string[]
  contraindications?: string[]
  isActive: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export default function TreatmentsManagement() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    treatmentName: '',
    treatmentType: '',
    description: '',
    applicableConditions: [] as string[],
    duration: '',
    frequency: '',
    dosageInfo: {} as Record<string, any>,
    category: '',
    severityLevel: '',
    sideEffects: [] as string[],
    contraindications: [] as string[],
    isActive: true
  })

  const treatmentTypes = [
    'Medication', 'Physical Therapy', 'Surgery', 'Lifestyle Change', 
    'Dietary', 'Exercise', 'Counseling', 'Alternative Medicine', 'Other'
  ]

  const categories = [
    'Cardiovascular', 'Respiratory', 'Neurological', 'Gastrointestinal', 
    'Endocrine', 'Musculoskeletal', 'Dermatological', 'Psychiatric', 'Other'
  ]

  const severityLevels = ['Mild', 'Moderate', 'Severe', 'Critical']

  useEffect(() => {
    fetchTreatments()
  }, [])

  const fetchTreatments = async (search = '', type = '', category = '') => {
    try {
      setLoading(true)
      let url = '/api/admin/treatments?page=1&limit=50'
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (type) url += `&type=${encodeURIComponent(type)}`
      if (category) url += `&category=${encodeURIComponent(category)}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status && result.payload?.data?.treatments) {
          setTreatments(result.payload.data.treatments)
        }
      } else {
        console.error('Failed to fetch treatments:', response.status)
      }
    } catch (error) {
      console.error('Error fetching treatments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query)
    fetchTreatments(query, selectedType, selectedCategory)
  }, [selectedType, selectedCategory])

  const handleTypeFilter = useCallback((type: string) => {
    setSelectedType(type)
    fetchTreatments(searchTerm, type, selectedCategory)
  }, [searchTerm, selectedCategory])

  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategory(category)
    fetchTreatments(searchTerm, selectedType, category)
  }, [searchTerm, selectedType])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Treatment created successfully!')
        setShowCreateModal(false)
        resetForm()
        fetchTreatments()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to create treatment'}`)
      }
    } catch (error) {
      console.error('Error creating treatment:', error)
      alert('Error creating treatment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTreatment) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/treatments/${selectedTreatment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Treatment updated successfully!')
        setShowEditModal(false)
        setSelectedTreatment(null)
        resetForm()
        fetchTreatments()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to update treatment'}`)
      }
    } catch (error) {
      console.error('Error updating treatment:', error)
      alert('Error updating treatment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (treatment: Treatment) => {
    if (!confirm(`Are you sure you want to delete "${treatment.treatmentName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/treatments/${treatment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        alert('Treatment deleted successfully!')
        fetchTreatments()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to delete treatment'}`)
      }
    } catch (error) {
      console.error('Error deleting treatment:', error)
      alert('Error deleting treatment')
    }
  }

  const openEditModal = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setFormData({
      treatmentName: treatment.treatmentName,
      treatmentType: treatment.treatmentType,
      description: treatment.description || '',
      applicableConditions: treatment.applicableConditions || [],
      duration: treatment.duration || '',
      frequency: treatment.frequency || '',
      dosageInfo: treatment.dosageInfo || {},
      category: treatment.category || '',
      severityLevel: treatment.severityLevel || '',
      sideEffects: treatment.sideEffects || [],
      contraindications: treatment.contraindications || [],
      isActive: treatment.isActive
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      treatmentName: '',
      treatmentType: '',
      description: '',
      applicableConditions: [],
      duration: '',
      frequency: '',
      dosageInfo: {},
      category: '',
      severityLevel: '',
      sideEffects: [],
      contraindications: [],
      isActive: true
    })
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatments Management</h1>
          <p className="text-gray-600">Manage medical treatments and protocols</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Treatment
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => handleTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          {treatmentTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{treatments.length}</div>
            <div className="text-sm text-gray-600">Total Treatments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {treatments.filter(t => t.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Treatments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(treatments.map(t => t.treatmentType).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-600">Treatment Types</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {new Set(treatments.map(t => t.category).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Treatments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {treatments.map((treatment) => (
          <Card key={treatment.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CubeIcon className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">{treatment.treatmentName}</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(treatment)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(treatment)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium text-purple-600">{treatment.treatmentType}</span>
                </div>
                {treatment.category && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="text-sm font-medium">{treatment.category}</span>
                  </div>
                )}
                {treatment.duration && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium">{treatment.duration}</span>
                  </div>
                )}
                {treatment.frequency && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Frequency:</span>
                    <span className="text-sm font-medium">{treatment.frequency}</span>
                  </div>
                )}
                {treatment.severityLevel && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Severity Level:</span>
                    <span className="text-sm font-medium">{treatment.severityLevel}</span>
                  </div>
                )}
                {treatment.applicableConditions?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conditions:</span>
                    <span className="text-sm font-medium">{treatment.applicableConditions.length}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${treatment.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {treatment.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {treatment.description && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {treatment.description.substring(0, 100)}
                    {treatment.description.length > 100 ? '...' : ''}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Created: {new Date(treatment.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {treatments.length === 0 && !loading && (
        <div className="text-center py-12">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No treatments found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new treatment.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTreatment ? 'Edit Treatment' : 'Add New Treatment'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  setSelectedTreatment(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <form onSubmit={selectedTreatment ? handleEdit : handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Treatment Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.treatmentName}
                      onChange={(e) => setFormData({ ...formData, treatmentName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Treatment Type *</label>
                    <select
                      required
                      value={formData.treatmentType}
                      onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Type</option>
                      {treatmentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g., 2 weeks, 30 days"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g., Twice daily, Weekly"
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Severity Level</label>
                  <select
                    value={formData.severityLevel}
                    onChange={(e) => setFormData({ ...formData, severityLevel: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Severity Level</option>
                    {severityLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active Treatment</label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setShowEditModal(false)
                      setSelectedTreatment(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {selectedTreatment ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}