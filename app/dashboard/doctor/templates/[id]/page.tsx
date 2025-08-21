'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

interface Template {
  id: string
  name: string
  type: string
  description: string
  content: string
  category: string
  tags: string[]
  isActive: boolean
  created_at: string
  updated_at: string
  usage_count: number
}

export default function TemplateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  const [template, setTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      setIsLoading(true)
      // Mock data since API doesn't exist yet
      const mockTemplate: Template = {
        id: templateId,
        name: 'Diabetes Care Plan Template',
        type: 'care_plan',
        description: 'Comprehensive care plan template for diabetes management',
        content: `Patient: {{patient_name}}
Date: {{date}}
Diagnosis: Type 2 Diabetes Mellitus

CARE PLAN OBJECTIVES:
- Achieve glycemic control (HbA1c < 7%)
- Prevent diabetes complications
- Improve quality of life

MEDICATION MANAGEMENT:
- {{medication_1}} - {{dosage_1}} - {{frequency_1}}
- {{medication_2}} - {{dosage_2}} - {{frequency_2}}

MONITORING:
- Blood glucose monitoring: {{monitoring_frequency}}
- HbA1c every 3-6 months
- Annual eye examination
- Annual foot examination

LIFESTYLE MODIFICATIONS:
- Diet: {{diet_plan}}
- Exercise: {{exercise_plan}}
- Weight management target: {{weight_target}}

FOLLOW-UP:
- Next appointment: {{follow_up_date}}
- Emergency contact: {{emergency_contact}}

Provider: {{doctor_name}}
Signature: ________________
Date: {{date}}`,
        category: 'Endocrinology',
        tags: ['diabetes', 'chronic-care', 'management'],
        isActive: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:22:00Z',
        usage_count: 15
      }
      
      setTemplate(mockTemplate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        // TODO: Implement delete API call
        console.log('Deleting template:', templateId)
        router.push('/dashboard/doctor/templates')
      } catch (error) {
        console.error('Error deleting template:', error)
      }
    }
  }

  const handleDuplicate = async () => {
    try {
      // TODO: Implement duplicate API call
      console.log('Duplicating template:', templateId)
      router.push(`/dashboard/doctor/templates/new?duplicate=${templateId}`)
    } catch (error) {
      console.error('Error duplicating template:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading template</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Template not found'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/doctor/templates"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-600 mt-1">
              {template.type.replace('_', ' ').toUpperCase()} • Created {formatDate(template.created_at)}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDuplicate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Duplicate
          </button>
          <Link
            href={`/dashboard/doctor/templates/${template.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Template Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {template.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="text-sm text-gray-600 mt-1">{template.category}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="text-sm text-gray-600 mt-1 capitalize">
                  {template.type.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Times Used</span>
                <span className="text-2xl font-bold text-blue-600">{template.usage_count}</span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-sm text-gray-600 mt-1">{formatDate(template.updated_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-600 mt-1">{formatDate(template.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href={`/dashboard/doctor/patients/new?template=${template.id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Use Template
              </Link>
              
              <button
                onClick={() => navigator.clipboard.writeText(template.content)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Copy Content
              </button>
              
              <button
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Share Template
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}