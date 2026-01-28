'use client'

export const dynamic = 'force-dynamic'




/**
 * New Template Page - Doctor Dashboard
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NewTemplatePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'care_plan',
    description: '',
    content: '',
    category: '',
    tags: '',
    isActive: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // TODO: Implement template creation API call
      console.log('Creating template:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to templates list
      router.push('/dashboard/doctor/templates')
    } catch (error) {
      console.error('Error creating template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Template</h1>
            <p className="text-gray-600 mt-2">
              Create reusable templates for care plans, prescriptions, and patient instructions
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>

        {/* Template Creation Form */}
        <Card className="p-6">
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
                  placeholder="Enter template name"
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
                rows={12}
                required
                value={formData.content}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Make template active and available for use
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Template Examples */}
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold mb-4">Template Examples</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Care Plan Template Example:</h4>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
{`Patient: {{patient_name}}
Date: {{date}}
Diagnosis: {{diagnosis}}

Goals:
- {{goal_1}}
- {{goal_2}}

Interventions:
- {{intervention_1}}
- {{intervention_2}}

Follow-up: {{follow_up_date}}`}
              </pre>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Prescription Template Example:</h4>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
{`Rx for {{patient_name}}
DOB: {{patient_dob}}

{{medication_name}} {{strength}}
Take {{dosage}} {{frequency}}
Quantity: {{quantity}}
Refills: {{refills}}

Provider: {{doctor_name}}
Date: {{date}}`}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
