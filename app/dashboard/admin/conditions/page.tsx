'use client'

export const dynamic = 'force-dynamic'





import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Condition {
  id: string
  diagnosisName: string
  symptoms: Record<string, any>
  category?: string
  severityIndicators: Record<string, any>
  commonAgeGroups: string[]
  genderSpecific?: string
  isActive: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export default function ConditionsManagement() {
  const [conditions, setConditions] = useState<Condition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    diagnosisName: '',
    category: '',
    symptoms: {} as Record<string, any>,
    severityIndicators: {} as Record<string, any>,
    commonAgeGroups: [] as string[],
    genderSpecific: '',
    isActive: true
  })

  const categories = [
    'Cardiovascular', 'Respiratory', 'Neurological', 'Gastrointestinal', 
    'Endocrine', 'Musculoskeletal', 'Dermatological', 'Psychiatric', 'Other'
  ]

  const ageGroups = [
    'Infant (0-1)', 'Toddler (1-3)', 'Child (3-12)', 'Adolescent (12-18)', 
    'Adult (18-65)', 'Senior (65+)'
  ]

  useEffect(() => {
    fetchConditions()
  }, [])

  const fetchConditions = async (search = '', category = '') => {
    try {
      setLoading(true)
      let url = '/api/admin/conditions?page=1&limit=50'
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (category) url += `&category=${encodeURIComponent(category)}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status && result.payload?.data?.conditions) {
          setConditions(result.payload.data.conditions)
        }
      } else {
        console.error('Failed to fetch conditions:', response.status)
      }
    } catch (error) {
      console.error('Error fetching conditions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query)
    fetchConditions(query, selectedCategory)
  }, [selectedCategory])

  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategory(category)
    fetchConditions(searchTerm, category)
  }, [searchTerm])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/conditions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Medical condition created successfully!')
        setShowCreateModal(false)
        resetForm()
        fetchConditions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to create condition'}`)
      }
    } catch (error) {
      console.error('Error creating condition:', error)
      alert('Error creating condition')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCondition) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/conditions/${selectedCondition.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Medical condition updated successfully!')
        setShowEditModal(false)
        setSelectedCondition(null)
        resetForm()
        fetchConditions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to update condition'}`)
      }
    } catch (error) {
      console.error('Error updating condition:', error)
      alert('Error updating condition')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (condition: Condition) => {
    if (!confirm(`Are you sure you want to delete "${condition.diagnosisName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/conditions/${condition.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        alert('Medical condition deleted successfully!')
        fetchConditions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to delete condition'}`)
      }
    } catch (error) {
      console.error('Error deleting condition:', error)
      alert('Error deleting condition')
    }
  }

  const openEditModal = (condition: Condition) => {
    setSelectedCondition(condition)
    setFormData({
      diagnosisName: condition.diagnosisName,
      category: condition.category || '',
      symptoms: condition.symptoms || {},
      severityIndicators: condition.severityIndicators || {},
      commonAgeGroups: condition.commonAgeGroups || [],
      genderSpecific: condition.genderSpecific || '',
      isActive: condition.isActive
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      diagnosisName: '',
      category: '',
      symptoms: {},
      severityIndicators: {},
      commonAgeGroups: [],
      genderSpecific: '',
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
          <h1 className="text-2xl font-bold text-gray-900">Medical Conditions Management</h1>
          <p className="text-gray-600">Manage medical conditions and diagnoses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Condition
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conditions..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{conditions.length}</div>
            <div className="text-sm text-gray-600">Total Conditions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {conditions.filter(c => c.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Conditions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(conditions.map(c => c.category).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Conditions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {conditions.map((condition) => (
          <Card key={condition.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HeartIcon className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg">{condition.diagnosisName}</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(condition)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(condition)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {condition.category && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="text-sm font-medium text-blue-600">{condition.category}</span>
                  </div>
                )}
                {condition.commonAgeGroups?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Age Groups:</span>
                    <span className="text-sm font-medium">{condition.commonAgeGroups.join(', ')}</span>
                  </div>
                )}
                {condition.genderSpecific && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gender Specific:</span>
                    <span className="text-sm font-medium capitalize">{condition.genderSpecific}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${condition.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {condition.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Created: {new Date(condition.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {conditions.length === 0 && !loading && (
        <div className="text-center py-12">
          <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conditions found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new medical condition.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedCondition ? 'Edit Medical Condition' : 'Add New Medical Condition'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  setSelectedCondition(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={selectedCondition ? handleEdit : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Diagnosis Name *</label>
                <input
                  type="text"
                  required
                  value={formData.diagnosisName}
                  onChange={(e) => setFormData({ ...formData, diagnosisName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

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
                <label className="block text-sm font-medium text-gray-700">Common Age Groups</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {ageGroups.map(group => (
                    <label key={group} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.commonAgeGroups.includes(group)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              commonAgeGroups: [...formData.commonAgeGroups, group]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              commonAgeGroups: formData.commonAgeGroups.filter(g => g !== group)
                            })
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">{group}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender Specific</label>
                <select
                  value={formData.genderSpecific}
                  onChange={(e) => setFormData({ ...formData, genderSpecific: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any Gender</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Active Condition</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    setSelectedCondition(null)
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
                  {selectedCondition ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
