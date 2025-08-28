'use client'

import { useState, useEffect } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  UsersIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Department {
  id: string
  name: string
  description: string
  head_doctor: string
  location: string
  phone: string
  email: string
  staff_count: number
  patient_count: number
  status: 'active' | 'inactive'
  createdAt: string
}

interface OrganizationSettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  logo_url?: string
  timezone: string
  business_hours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
}

// Mock data - replace with actual API calls
const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Cardiology',
    description: 'Heart and cardiovascular system care',
    head_doctor: 'Dr. Sarah Johnson',
    location: 'Building A, Floor 3',
    phone: '+1-555-0301',
    email: 'cardiology@metrogeneral.com',
    staff_count: 12,
    patient_count: 89,
    status: 'active',
    createdAt: '2023-01-15',
  },
  {
    id: '2',
    name: 'Endocrinology',
    description: 'Hormone and metabolic disorders',
    head_doctor: 'Dr. Michael Chen',
    location: 'Building B, Floor 2',
    phone: '+1-555-0302',
    email: 'endocrinology@metrogeneral.com',
    staff_count: 8,
    patient_count: 67,
    status: 'active',
    createdAt: '2023-02-10',
  },
  {
    id: '3',
    name: 'Internal Medicine',
    description: 'General adult medicine and primary care',
    head_doctor: 'Dr. David Williams',
    location: 'Building A, Floor 1',
    phone: '+1-555-0303',
    email: 'internal@metrogeneral.com',
    staff_count: 15,
    patient_count: 102,
    status: 'active',
    createdAt: '2023-01-01',
  },
  {
    id: '4',
    name: 'Neurology',
    description: 'Brain and nervous system disorders',
    head_doctor: 'Dr. Jennifer Garcia',
    location: 'Building C, Floor 4',
    phone: '+1-555-0304',
    email: 'neurology@metrogeneral.com',
    staff_count: 6,
    patient_count: 34,
    status: 'active',
    createdAt: '2023-03-20',
  },
  {
    id: '5',
    name: 'Orthopedics',
    description: 'Bone, joint, and muscle care',
    head_doctor: 'Dr. Robert Martinez',
    location: 'Building B, Floor 3',
    phone: '+1-555-0305',
    email: 'orthopedics@metrogeneral.com',
    staff_count: 10,
    patient_count: 28,
    status: 'active',
    createdAt: '2023-04-05',
  },
]

const mockOrgSettings: OrganizationSettings = {
  name: 'Metro General Hospital',
  address: '123 Healthcare Drive, Medical City, MC 12345',
  phone: '+1-555-0100',
  email: 'info@metrogeneral.com',
  website: 'https://www.metrogeneral.com',
  timezone: 'America/New_York',
  business_hours: {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: false },
  },
}

interface DepartmentModalProps {
  isOpen: boolean
  department: Department | null
  onClose: () => void
  onSave: (department: Partial<Department>) => void
}

function DepartmentModal({ isOpen, department, onClose, onSave }: DepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    head_doctor: '',
    location: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description,
        head_doctor: department.head_doctor,
        location: department.location,
        phone: department.phone,
        email: department.email,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        head_doctor: '',
        location: '',
        phone: '',
        email: '',
      })
    }
  }, [department])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {department ? 'Edit Department' : 'Add New Department'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Head Doctor
                      </label>
                      <input
                        type="text"
                        value={formData.head_doctor}
                        onChange={(e) => setFormData({ ...formData, head_doctor: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
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
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {department ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function OrganizationsPage() {
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>(mockOrgSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [activeTab, setActiveTab] = useState<'departments' | 'settings'>('departments')

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const handleAddDepartment = () => {
    setSelectedDepartment(null)
    setIsDepartmentModalOpen(true)
  }

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department)
    setIsDepartmentModalOpen(true)
  }

  const handleSaveDepartment = (departmentData: Partial<Department>) => {
    if (selectedDepartment) {
      // Update existing department
      setDepartments(prev => prev.map(dept => 
        dept.id === selectedDepartment.id 
          ? { ...dept, ...departmentData }
          : dept
      ))
    } else {
      // Add new department
      const { id: _, ...deptDataWithoutId } = departmentData as Department;
      const newDepartment: Department = {
        id: Date.now().toString(),
        ...deptDataWithoutId,
        staff_count: 0,
        patient_count: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      setDepartments(prev => [...prev, newDepartment])
    }
  }

  const handleDeleteDepartment = (departmentId: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      setDepartments(prev => prev.filter(dept => dept.id !== departmentId))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization Management</h1>
            <p className="text-gray-600 mt-1">
              Manage departments and organizational settings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('departments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'departments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Organization Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            {/* Department Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{departments.length}</div>
                <div className="text-sm text-gray-600">Total Departments</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">
                  {departments.reduce((sum, dept) => sum + dept.staff_count, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Staff</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-green-600">
                  {departments.reduce((sum, dept) => sum + dept.patient_count, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Patients</div>
              </div>
            </div>

            {/* Departments List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Departments</CardTitle>
                <button
                  onClick={handleAddDepartment}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Department
                </button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {departments.map((department) => (
                    <div key={department.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mr-3" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                            <p className="text-sm text-gray-500">{department.description}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditDepartment(department)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(department.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <UsersIcon className="h-4 w-4 mr-2" />
                          Head: {department.head_doctor}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          {department.location}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          {department.phone}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          {department.email}
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Staff: {department.staff_count}</span>
                            <span className="text-gray-600">Patients: {department.patient_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {departments.length === 0 && (
                  <div className="text-center py-12">
                    <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No departments</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new department.</p>
                    <div className="mt-6">
                      <button
                        onClick={handleAddDepartment}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Department
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Organization Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  Organization Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={orgSettings.name}
                        onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={orgSettings.website}
                        onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={orgSettings.address}
                      onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={orgSettings.phone}
                        onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={orgSettings.email}
                        onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={orgSettings.timezone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, timezone: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Settings
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Department Modal */}
      <DepartmentModal
        isOpen={isDepartmentModalOpen}
        department={selectedDepartment}
        onClose={() => setIsDepartmentModalOpen(false)}
        onSave={handleSaveDepartment}
      />
    </>
  )
}