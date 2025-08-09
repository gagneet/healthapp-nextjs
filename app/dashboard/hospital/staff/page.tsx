'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, getInitials, getStatusColor } from '@/lib/utils'

// Mock data - replace with actual API calls
const mockStaff = [
  {
    id: '1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@metrogeneral.com',
    phone: '+1-555-0101',
    role: 'DOCTOR',
    specialty: 'Cardiology',
    department: 'Cardiology',
    patients_count: 45,
    status: 'active',
    last_login: '2024-01-22T08:30:00Z',
    joined_date: '2023-03-15',
    license_number: 'MD123456',
  },
  {
    id: '2',
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'michael.chen@metrogeneral.com',
    phone: '+1-555-0102',
    role: 'DOCTOR',
    specialty: 'Endocrinology',
    department: 'Endocrinology',
    patients_count: 38,
    status: 'active',
    last_login: '2024-01-22T07:45:00Z',
    joined_date: '2023-06-20',
    license_number: 'MD789012',
  },
  {
    id: '3',
    first_name: 'Emma',
    last_name: 'Davis',
    email: 'emma.davis@metrogeneral.com',
    phone: '+1-555-0103',
    role: 'HSP',
    specialty: 'Registered Nurse',
    department: 'Cardiology',
    patients_assigned: 12,
    status: 'active',
    last_login: '2024-01-22T06:15:00Z',
    joined_date: '2023-08-10',
    license_number: 'RN345678',
  },
  {
    id: '4',
    first_name: 'James',
    last_name: 'Wilson',
    email: 'james.wilson@metrogeneral.com',
    phone: '+1-555-0104',
    role: 'HSP',
    specialty: 'Clinical Pharmacist',
    department: 'Pharmacy',
    patients_assigned: 8,
    status: 'active',
    last_login: '2024-01-22T08:00:00Z',
    joined_date: '2023-09-05',
    license_number: 'PharmD901234',
  },
  {
    id: '5',
    first_name: 'Lisa',
    last_name: 'Rodriguez',
    email: 'lisa.rodriguez@metrogeneral.com',
    phone: '+1-555-0105',
    role: 'DOCTOR',
    specialty: 'Internal Medicine',
    department: 'Internal Medicine',
    patients_count: 0,
    status: 'pending',
    last_login: null,
    joined_date: '2024-01-20',
    license_number: 'MD567890',
  },
]

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: 'DOCTOR' | 'HSP'
  specialty: string
  department: string
  patients_count?: number
  patients_assigned?: number
  status: 'active' | 'inactive' | 'pending'
  last_login: string | null
  joined_date: string
  license_number: string
}

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  confirmVariant: 'danger' | 'success'
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmationModal({ isOpen, title, message, confirmText, confirmVariant, onConfirm, onCancel }: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                confirmVariant === 'danger' ? 'bg-red-100' : 'bg-green-100'
              } sm:mx-0 sm:h-10 sm:w-10`}>
                {confirmVariant === 'danger' ? (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                ) : (
                  <CheckIcon className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                confirmVariant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff as StaffMember[])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    confirmVariant: 'danger' | 'success'
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    onConfirm: () => {},
  })

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleApproveStaff = (staffId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Staff Member',
      message: 'Are you sure you want to approve this staff member? They will gain access to the system.',
      confirmText: 'Approve',
      confirmVariant: 'success',
      onConfirm: () => {
        setStaff(prev => prev.map(member => 
          member.id === staffId 
            ? { ...member, status: 'active' as const }
            : member
        ))
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleDeactivateStaff = (staffId: string) => {
    const staffMember = staff.find(member => member.id === staffId)
    const isDeactivating = staffMember?.status === 'active'
    
    setConfirmModal({
      isOpen: true,
      title: isDeactivating ? 'Deactivate Staff Member' : 'Activate Staff Member',
      message: isDeactivating 
        ? 'Are you sure you want to deactivate this staff member? They will lose access to the system.'
        : 'Are you sure you want to activate this staff member? They will regain access to the system.',
      confirmText: isDeactivating ? 'Deactivate' : 'Activate',
      confirmVariant: isDeactivating ? 'danger' : 'success',
      onConfirm: () => {
        setStaff(prev => prev.map(member => 
          member.id === staffId 
            ? { ...member, status: isDeactivating ? 'inactive' as const : 'active' as const }
            : member
        ))
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleDeleteStaff = (staffId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Staff Member',
      message: 'Are you sure you want to permanently delete this staff member? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: () => {
        setStaff(prev => prev.filter(member => member.id !== staffId))
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
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
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1">
              Manage doctors and healthcare service providers
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/dashboard/hospital/staff/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Staff Member
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="DOCTOR">Doctors</option>
                  <option value="HSP">Healthcare Providers</option>
                </select>
                <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
                <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {staff.filter(s => s.role === 'DOCTOR').length}
            </div>
            <div className="text-sm text-gray-600">Doctors</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {staff.filter(s => s.role === 'HSP').length}
            </div>
            <div className="text-sm text-gray-600">Healthcare Providers</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {staff.filter(s => s.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {staff.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
        </div>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role & Specialty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {getInitials(member.first_name, member.last_name)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.role === 'DOCTOR' ? 'Dr. ' : ''}{member.first_name} {member.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                            <div className="text-xs text-gray-400">{member.license_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {member.role === 'DOCTOR' ? 'Doctor' : 'Healthcare Provider'}
                        </div>
                        <div className="text-sm text-gray-500">{member.specialty}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.role === 'DOCTOR' ? member.patients_count : member.patients_assigned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.last_login ? formatDate(member.last_login) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {member.status === 'pending' && (
                            <button
                              onClick={() => handleApproveStaff(member.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          <Link
                            href={`/dashboard/hospital/staff/${member.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          
                          {member.status !== 'pending' && (
                            <button
                              onClick={() => handleDeactivateStaff(member.id)}
                              className={member.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                              title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {member.status === 'active' ? (
                                <XMarkIcon className="h-4 w-4" />
                              ) : (
                                <CheckIcon className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteStaff(member.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your search criteria.'
                    : 'Get started by adding a new staff member.'}
                </p>
                {(!searchTerm && roleFilter === 'all' && statusFilter === 'all') && (
                  <div className="mt-6">
                    <Link
                      href="/dashboard/hospital/staff/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Staff Member
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  )
}