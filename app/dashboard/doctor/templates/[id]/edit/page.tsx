'use client'

export const dynamic = 'force-dynamic'




import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Template {
  id: string
  name: string
  type: string
  description: string
  content: string
  category: string
  tags: string
  isActive: boolean
}

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Template>({
    id: '',
    name: '',
    type: 'care_plan',
    description: '',
    content: '',
    category: '',
    tags: '',
    isActive: true
  })

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      setIsLoading(true)
      // Mock data since API doesn't exist yet
      const mockTemplate = {
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
        tags: 'diabetes, chronic-care, management',
        isActive: true
      }
      
      setFormData(mockTemplate)
    } catch (error) {
      console.error('Error fetching template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // TODO: Implement template update API call
      console.log('Updating template:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to template details
      router.push(`/dashboard/doctor/templates/${templateId}`)
    } catch (error) {
      console.error('Error updating template:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/doctor/templates/${templateId}`}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Template</h1>
            <p className="text-gray-600 mt-1">
              Modify your template content and settings
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type *
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="care_plan">Care Plan Template</option>
                  <option value="prescription">Prescription Template</option>
                  <option value="instruction">Patient Instruction Template</option>
                  <option value="assessment">Assessment Template</option>
                  <option value="discharge">Discharge Summary Template</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Cardiology, Diabetes, General"
                />
              </div>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the template purpose"
              />
            </div>

            {/* Template Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Template Content *
              </label>
              <textarea
                id="content"
                name="content"
                rows={20}
                required
                value={formData.content}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter the template content. You can use placeholders like {{patient_name}}, {{date}}, {{diagnosis}}, etc."
              />
              <p className="text-sm text-gray-500 mt-2">
                Use placeholders like {'{{patient_name}}'}, {'{{date}}'}, {'{{diagnosis}}'} for dynamic content
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Template is active and available for use
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link
                href={`/dashboard/doctor/templates/${templateId}`}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Template Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Template Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {formData.content || 'Template content will appear here...'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
