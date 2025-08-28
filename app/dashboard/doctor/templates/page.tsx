'use client'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { formatDate } from '@/lib/utils'

interface CareplanTemplate {
  id: string
  name: string
  description: string
  category: 'CHRONIC_DISEASE' | 'PREVENTIVE' | 'ACUTE' | 'REHABILITATION' | 'WELLNESS'
  duration_days: number
  isActive: boolean
  created_by: string
  created_at: string
  updated_at: string
  usage_count: number
  components: {
    care_plans: number
    vitals: number
    appointments: number
    exercises: number
    dietary_guidelines: number
  }
}

const mockTemplates: CareplanTemplate[] = [
  {
    id: '1',
    name: 'Hypertension Management',
    description: 'Comprehensive care plan for managing high blood pressure with medication adherence, lifestyle modifications, and regular monitoring.',
    category: 'CHRONIC_DISEASE',
    duration_days: 90,
    isActive: true,
    created_by: 'Dr. Sarah Johnson',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-20T14:30:00Z',
    usage_count: 45,
    components: {
      care_plans: 3,
      vitals: 2,
      appointments: 4,
      exercises: 2,
      dietary_guidelines: 1
    }
  },
  {
    id: '2',
    name: 'Type 2 Diabetes Control',
    description: 'Evidence-based diabetes management including glucose monitoring, medication schedules, and nutritional guidance.',
    category: 'CHRONIC_DISEASE',
    duration_days: 180,
    isActive: true,
    created_by: 'Dr. Michael Chen',
    created_at: '2025-01-10T09:15:00Z',
    updated_at: '2025-01-22T11:45:00Z',
    usage_count: 32,
    components: {
      care_plans: 2,
      vitals: 3,
      appointments: 6,
      exercises: 3,
      dietary_guidelines: 2
    }
  },
  {
    id: '3',
    name: 'Post-Operative Recovery',
    description: 'Standard post-surgical care plan with pain management, wound care, and progressive rehabilitation.',
    category: 'REHABILITATION',
    duration_days: 30,
    isActive: true,
    created_by: 'Dr. Emily Rodriguez',
    created_at: '2025-01-08T16:20:00Z',
    updated_at: '2025-01-18T09:10:00Z',
    usage_count: 28,
    components: {
      care_plans: 4,
      vitals: 1,
      appointments: 3,
      exercises: 1,
      dietary_guidelines: 0
    }
  },
  {
    id: '4',
    name: 'Annual Wellness Check',
    description: 'Preventive care template for routine health screenings and wellness assessments.',
    category: 'PREVENTIVE',
    duration_days: 365,
    isActive: true,
    created_by: 'Dr. Sarah Johnson',
    created_at: '2025-01-05T13:45:00Z',
    updated_at: '2025-01-15T10:20:00Z',
    usage_count: 67,
    components: {
      care_plans: 0,
      vitals: 4,
      appointments: 2,
      exercises: 1,
      dietary_guidelines: 1
    }
  },
  {
    id: '5',
    name: 'Cardiac Rehabilitation',
    description: 'Comprehensive cardiac recovery program with exercise therapy, medication management, and lifestyle counseling.',
    category: 'REHABILITATION',
    duration_days: 120,
    isActive: false,
    created_by: 'Dr. David Williams',
    created_at: '2023-12-20T11:30:00Z',
    updated_at: '2025-01-12T15:15:00Z',
    usage_count: 15,
    components: {
      care_plans: 5,
      vitals: 3,
      appointments: 8,
      exercises: 4,
      dietary_guidelines: 2
    }
  },
]

const categories = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'CHRONIC_DISEASE', label: 'Chronic Disease' },
  { value: 'PREVENTIVE', label: 'Preventive Care' },
  { value: 'ACUTE', label: 'Acute Care' },
  { value: 'REHABILITATION', label: 'Rehabilitation' },
  { value: 'WELLNESS', label: 'Wellness' },
]

export default function CareplanTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<CareplanTemplate[]>(mockTemplates)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'ALL' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CHRONIC_DISEASE':
        return 'bg-red-100 text-red-800'
      case 'PREVENTIVE':
        return 'bg-green-100 text-green-800'
      case 'ACUTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'REHABILITATION':
        return 'bg-blue-100 text-blue-800'
      case 'WELLNESS':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || category
  }

  const duplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      const newTemplate: CareplanTemplate = {
        ...template,
        id: `${Date.now()}`,
        name: `${template.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0
      }
      setTemplates([newTemplate, ...templates])
    }
  }

  const toggleTemplateStatus = (templateId: string) => {
    setTemplates(templates.map(t => 
      t.id === templateId ? { ...t, isActive: !t.isActive } : t
    ))
  }

  const deleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      setTemplates(templates.filter(t => t.id !== templateId))
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Care Plan Templates</h1>
          <p className="text-gray-600 mt-1">
            Create and manage reusable care plan templates for efficient patient care.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/doctor/templates/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Template
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                <p className="text-3xl font-bold text-gray-900">{templates.length}</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Templates</p>
                <p className="text-3xl font-bold text-gray-900">
                  {templates.filter(t => t.isActive).length}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-3xl font-bold text-gray-900">
                  {templates.reduce((sum, t) => sum + t.usage_count, 0)}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Used</p>
                <p className="text-lg font-bold text-gray-900">
                  {templates.sort((a, b) => b.usage_count - a.usage_count)[0]?.name || 'N/A'}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className={`relative ${!template.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                    {template.name}
                  </CardTitle>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {!template.isActive && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {template.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium">{template.duration_days} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Usage:</span>
                  <span className="font-medium">{template.usage_count} times</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Components:</span>
                  <span className="font-medium">
                    {Object.values(template.components).reduce((sum, count) => sum + count, 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-semibold text-blue-700">{template.components.care_plans}</div>
                  <div className="text-blue-600">Medications</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-semibold text-green-700">{template.components.vitals}</div>
                  <div className="text-green-600">Vitals</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="font-semibold text-purple-700">{template.components.appointments}</div>
                  <div className="text-purple-600">Appointments</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>Created: {formatDate(template.created_at)}</span>
                <span>By: {template.created_by}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  href={`/dashboard/doctor/templates/${template.id}`}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Link>
                <Link
                  href={`/dashboard/doctor/templates/${template.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Link>
                <button
                  onClick={() => duplicateTemplate(template.id)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Duplicate"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'ALL' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first care plan template.'
              }
            </p>
            {!searchTerm && selectedCategory === 'ALL' && (
              <div className="mt-6">
                <Link
                  href="/dashboard/doctor/templates/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Template
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}