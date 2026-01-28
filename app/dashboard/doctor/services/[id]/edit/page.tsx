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

interface Service {
  id: string
  name: string
  description: string
  category: string
  duration: number
  amount: number
  currency: string
  requiresSubscription: boolean
  isActive: boolean
  tags: string
}

export default function EditServicePage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Service>({
    id: '',
    name: '',
    description: '',
    category: 'consultation',
    duration: 30,
    amount: 0,
    currency: 'USD',
    requiresSubscription: false,
    isActive: true,
    tags: ''
  })

  useEffect(() => {
    fetchService()
  }, [serviceId])

  const fetchService = async () => {
    try {
      setIsLoading(true)
      // Mock data since API doesn't exist yet
      const mockService = {
        id: serviceId,
        name: 'General Consultation',
        description: 'Comprehensive medical consultation for general health concerns, symptoms assessment, and preventive care guidance. Includes physical examination, medical history review, and treatment recommendations.',
        category: 'consultation',
        duration: 30,
        amount: 150.00,
        currency: 'USD',
        requiresSubscription: false,
        isActive: true,
        tags: 'general-medicine, consultation, preventive-care'
      }
      
      setFormData(mockService)
    } catch (error) {
      console.error('Error fetching service:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // TODO: Implement service update API call
      console.log('Updating service:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to service details
      router.push(`/dashboard/doctor/services/${serviceId}`)
    } catch (error) {
      console.error('Error updating service:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseFloat(value) || 0 : value
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
            href={`/dashboard/doctor/services/${serviceId}`}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
            <p className="text-gray-600 mt-1">
              Modify your service details and settings
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
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
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="procedure">Medical Procedure</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="therapy">Therapy</option>
                  <option value="chronic_care">Chronic Care Management</option>
                  <option value="telemedicine">Telemedicine</option>
                </select>
              </div>
            </div>

            {/* Pricing and Duration */}
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  required
                  min="5"
                  max="480"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Service Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this service includes, its benefits, and any special requirements..."
              />
            </div>

            {/* Tags */}
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
              <p className="text-sm text-gray-500 mt-1">
                Tags help patients and staff find services more easily
              </p>
            </div>

            {/* Service Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresSubscription"
                  name="requiresSubscription"
                  checked={formData.requiresSubscription}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requiresSubscription" className="text-sm font-medium text-gray-700">
                  Requires subscription for recurring payment
                </label>
              </div>

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
                  Service is active and available for booking
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link
                href={`/dashboard/doctor/services/${serviceId}`}
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

      {/* Service Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Service Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {formData.name || 'Service Name'}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {formData.category.replace('_', ' ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formData.currency} {formData.amount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {formData.duration} minutes
                </div>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              {formData.description || 'Service description will appear here...'}
            </p>
            {formData.tags && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex space-x-2">
              {formData.requiresSubscription && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Subscription Required
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                formData.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
