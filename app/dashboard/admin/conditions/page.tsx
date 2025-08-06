'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Condition {
  basic_info: {
    id: string
    diagnosis_name: string
    category: string
    symptoms: string[]
    severity_indicators: any
    common_age_groups: string[]
    gender_specific: string
    is_active: boolean
  }
  metadata: {
    created_by?: string
    created_at: string
    updated_at: string
  }
}

export default function ConditionsManagement() {
  const [conditions, setConditions] = useState<Condition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null)
  const [formData, setFormData] = useState({
    diagnosis_name: '',
    category: '',
    symptoms: '',
    severity_indicators: '',
    common_age_groups: '',
    gender_specific: 'both'
  })

  useEffect(() => {
    fetchConditions()
  }, [])

  const fetchConditions = async (search = '') => {
    try {
      setLoading(true)
      let url = '/api/admin/conditions?page=1&limit=50'
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status && result.payload?.data?.conditions) {
          const conditionsArray = Object.values(result.payload.data.conditions)
          setConditions(conditionsArray as Condition[])
        }
      }
    } catch (error) {
      console.error('Error fetching conditions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query)
    fetchConditions(query)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/conditions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...formData,
          symptoms: formData.symptoms.split(',').map(s => s.trim()),
          common_age_groups: formData.common_age_groups.split(',').map(s => s.trim()),
          severity_indicators: formData.severity_indicators ? JSON.parse(formData.severity_indicators) : {}
        })
      })

      if (response.ok) {
        alert('Condition created successfully!')
        setShowCreateModal(false)
        setFormData({
          diagnosis_name: '',
          category: '',
          symptoms: '',
          severity_indicators: '',
          common_age_groups: '',
          gender_specific: 'both'
        })
        fetchConditions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to create condition'}`)
      }
    } catch (error) {
      console.error('Error creating condition:', error)
      alert('Error creating condition')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCondition) return

    try {
      const response = await fetch(`/api/admin/conditions/${selectedCondition.basic_info.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...formData,
          symptoms: formData.symptoms.split(',').map(s => s.trim()),
          common_age_groups: formData.common_age_groups.split(',').map(s => s.trim()),
          severity_indicators: formData.severity_indicators ? JSON.parse(formData.severity_indicators) : {},
          is_active: true
        })
      })

      if (response.ok) {
        alert('Condition updated successfully!')
        setShowEditModal(false)
        setSelectedCondition(null)
        fetchConditions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to update condition'}`)
      }
    } catch (error) {
      console.error('Error updating condition:', error)
      alert('Error updating condition')
    }
  }

  const handleDelete = async (condition: Condition) => {
    if (!confirm(`Are you sure you want to delete ${condition.basic_info.diagnosis_name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/conditions/${condition.basic_info.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        alert('Condition deleted successfully!')
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
      diagnosis_name: condition.basic_info.diagnosis_name,
      category: condition.basic_info.category,
      symptoms: Array.isArray(condition.basic_info.symptoms) ? condition.basic_info.symptoms.join(', ') : '',
      severity_indicators: JSON.stringify(condition.basic_info.severity_indicators || {}),
      common_age_groups: Array.isArray(condition.basic_info.common_age_groups) ? condition.basic_info.common_age_groups.join(', ') : '',
      gender_specific: condition.basic_info.gender_specific
    })
    setShowEditModal(true)
  }

  const openViewModal = (condition: Condition) => {
    setSelectedCondition(condition)
    setShowViewModal(true)
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
          <h1 className="text-2xl font-bold text-gray-900">Conditions Management</h1>
          <p className="text-gray-600">Manage medical conditions and symptoms database</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Condition
        </button>
      </div>

      {/* Search */}
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
      </div>

      {/* Conditions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {conditions.map((condition) => (
          <Card key={condition.basic_info.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{condition.basic_info.diagnosis_name}</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openViewModal(condition)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
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
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm font-medium">{condition.basic_info.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Symptoms:</span>
                  <span className="text-sm font-medium">
                    {Array.isArray(condition.basic_info.symptoms) ? condition.basic_info.symptoms.length : 0} listed
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Age Groups:</span>
                  <span className="text-sm font-medium">
                    {Array.isArray(condition.basic_info.common_age_groups) ? condition.basic_info.common_age_groups.join(', ') : 'All'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gender:</span>
                  <span className="text-sm font-medium">{condition.basic_info.gender_specific}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {conditions.length === 0 && !loading && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conditions found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new condition.</p>
        </div>
      )}

      {/* Create Condition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Condition</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis Name</label>
                  <input
                    type="text"
                    required
                    value={formData.diagnosis_name}
                    onChange={(e) => setFormData({ ...formData, diagnosis_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Symptoms (comma-separated)</label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Common Age Groups (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.common_age_groups}
                    onChange={(e) => setFormData({ ...formData, common_age_groups: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="children, adults, elderly"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender Specific</label>
                  <select
                    value={formData.gender_specific}
                    onChange={(e) => setFormData({ ...formData, gender_specific: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="both">Both</option>
                    <option value="male_predominant">Male Predominant</option>
                    <option value="female_predominant">Female Predominant</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Condition Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Condition</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis Name</label>
                  <input
                    type="text"
                    required
                    value={formData.diagnosis_name}
                    onChange={(e) => setFormData({ ...formData, diagnosis_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Symptoms (comma-separated)</label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Common Age Groups (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.common_age_groups}
                    onChange={(e) => setFormData({ ...formData, common_age_groups: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender Specific</label>
                  <select
                    value={formData.gender_specific}
                    onChange={(e) => setFormData({ ...formData, gender_specific: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="both">Both</option>
                    <option value="male_predominant">Male Predominant</option>
                    <option value="female_predominant">Female Predominant</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Condition Modal */}
      {showViewModal && selectedCondition && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Condition Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCondition.basic_info.diagnosis_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCondition.basic_info.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Symptoms</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {Array.isArray(selectedCondition.basic_info.symptoms) ? (
                      <ul className="list-disc list-inside space-y-1">
                        {selectedCondition.basic_info.symptoms.map((symptom, index) => (
                          <li key={index}>{symptom}</li>
                        ))}
                      </ul>
                    ) : 'No symptoms listed'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Common Age Groups</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {Array.isArray(selectedCondition.basic_info.common_age_groups) 
                      ? selectedCondition.basic_info.common_age_groups.join(', ')
                      : 'All age groups'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender Specific</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCondition.basic_info.gender_specific}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}