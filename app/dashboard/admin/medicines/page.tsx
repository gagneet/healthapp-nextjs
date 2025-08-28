'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Medicine {
  id: string
  name: string
  type: string
  description?: string
  details?: Record<string, any>
  publicMedicine: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function MedicinesManagement() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    strengthMg: '',
    category: '',
    manufacturer: '',
    description: '',
    publicMedicine: true,
    isActive: true
  })

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async (search = '') => {
    try {
      setLoading(true)
      let url = '/api/admin/medicines?page=1&limit=50'
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
        if (result.status && result.payload?.data?.medicines) {
          // New API returns array directly
          setMedicines(result.payload.data.medicines as Medicine[])
        }
      }
    } catch (error) {
      console.error('Error fetching medicines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query)
    fetchMedicines(query)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Medicine created successfully!')
        setShowCreateModal(false)
        setFormData({
          name: '',
          type: '',
          strengthMg: '',
          category: '',
          manufacturer: '',
          description: '',
          publicMedicine: true,
          isActive: true
        })
        fetchMedicines()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to create medicine'}`)
      }
    } catch (error) {
      console.error('Error creating medicine:', error)
      alert('Error creating medicine')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMedicine) return

    try {
      const response = await fetch(`/api/admin/medicines/${selectedMedicine.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Medicine updated successfully!')
        setShowEditModal(false)
        setSelectedMedicine(null)
        fetchMedicines()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to update medicine'}`)
      }
    } catch (error) {
      console.error('Error updating medicine:', error)
      alert('Error updating medicine')
    }
  }

  const handleDelete = async (medicine: Medicine) => {
    if (!confirm(`Are you sure you want to delete ${medicine.name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/medicines/${medicine.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        alert('Medicine deleted successfully!')
        fetchMedicines()
      } else {
        const error = await response.json()
        alert(`Error: ${error.payload?.error?.message || 'Failed to delete medicine'}`)
      }
    } catch (error) {
      console.error('Error deleting medicine:', error)
      alert('Error deleting medicine')
    }
  }

  const openEditModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    setFormData({
      name: medicine.name,
      type: medicine.type,
      strengthMg: medicine.details?.strengthMg || '',
      category: medicine.details?.category || '',
      manufacturer: medicine.details?.manufacturer || '',
      description: medicine.description || '',
      publicMedicine: medicine.publicMedicine,
      isActive: medicine.isActive
    })
    setShowEditModal(true)
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
          <h1 className="text-2xl font-bold text-gray-900">Medicines Management</h1>
          <p className="text-gray-600">Manage system medicines and medications</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Medicine
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Medicines List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicines.map((medicine) => (
          <Card key={medicine.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BeakerIcon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{medicine.name}</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(medicine)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(medicine)}
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
                  <span className="text-sm font-medium">{medicine.type}</span>
                </div>
                {medicine.details?.strengthMg && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Strength:</span>
                    <span className="text-sm font-medium">{medicine.details.strengthMg}mg</span>
                  </div>
                )}
                {medicine.details?.category && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="text-sm font-medium">{medicine.details.category}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Public:</span>
                  <span className={`text-sm font-medium ${medicine.publicMedicine ? 'text-green-600' : 'text-red-600'}`}>
                    {medicine.publicMedicine ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${medicine.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {medicine.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {medicine.description && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {medicine.description.substring(0, 80)}
                    {medicine.description.length > 80 ? '...' : ''}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {medicines.length === 0 && !loading && (
        <div className="text-center py-12">
          <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new medicine.</p>
        </div>
      )}

      {/* Create Medicine Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Medicine</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <input
                    type="text"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Strength (mg)</label>
                  <input
                    type="text"
                    value={formData.strengthMg}
                    onChange={(e) => setFormData({ ...formData, strengthMg: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.publicMedicine}
                      onChange={(e) => setFormData({ ...formData, publicMedicine: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Public Medicine</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Active Medicine</label>
                  </div>
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

      {/* Edit Medicine Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Medicine</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <input
                    type="text"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Strength (mg)</label>
                  <input
                    type="text"
                    value={formData.strengthMg}
                    onChange={(e) => setFormData({ ...formData, strengthMg: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.publicMedicine}
                      onChange={(e) => setFormData({ ...formData, publicMedicine: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Public Medicine</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Active Medicine</label>
                  </div>
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
    </div>
  )
}