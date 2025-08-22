'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

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
  tags: string[]
  created_at: string
  updated_at: string
  usage_count: number
  revenue_generated: number
  active_subscriptions: number
}

export default function ServiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id as string
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchService()
  }, [serviceId])

  const fetchService = async () => {
    try {
      setIsLoading(true)
      // Mock data since API doesn't exist yet
      const mockService: Service = {
        id: serviceId,
        name: 'General Consultation',
        description: 'Comprehensive medical consultation for general health concerns, symptoms assessment, and preventive care guidance. Includes physical examination, medical history review, and treatment recommendations.',
        category: 'consultation',
        duration: 30,
        amount: 150.00,
        currency: 'USD',
        requiresSubscription: false,
        isActive: true,
        tags: ['general-medicine', 'consultation', 'preventive-care'],
        created_at: '2024-01-10T09:15:00Z',
        updated_at: '2024-02-05T11:30:00Z',
        usage_count: 45,
        revenue_generated: 6750.00,
        active_subscriptions: 0
      }
      
      setService(mockService)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      try {
        // TODO: Implement delete API call
        console.log('Deleting service:', serviceId)
        router.push('/dashboard/doctor/services')
      } catch (error) {
        console.error('Error deleting service:', error)
      }
    }
  }

  const handleDuplicate = async () => {
    try {
      // TODO: Implement duplicate API call
      console.log('Duplicating service:', serviceId)
      router.push(`/dashboard/doctor/services/new?duplicate=${serviceId}`)
    } catch (error) {
      console.error('Error duplicating service:', error)
    }
  }

  const handleToggleStatus = async () => {
    try {
      // TODO: Implement status toggle API call
      console.log('Toggling service status:', serviceId)
      setService(prev => prev ? { ...prev, isActive: !prev.isActive } : null)
    } catch (error) {
      console.error('Error toggling service status:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading service</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Service not found'}</p>
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
            href="/dashboard/doctor/services"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
            <p className="text-gray-600 mt-1">
              {service.category.replace('_', ' ').toUpperCase()} • Created {formatDate(service.created_at)}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
              service.isActive 
                ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' 
                : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
            }`}
          >
            {service.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={handleDuplicate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Duplicate
          </button>
          <Link
            href={`/dashboard/doctor/services/${service.id}/edit`}
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

      {/* Service Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {service.currency} {service.revenue_generated.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Times Used</p>
                <p className="text-2xl font-bold text-gray-900">{service.usage_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{service.active_subscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-gray-900">{service.duration}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pricing & Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Base Price</label>
                  <div className="mt-1 text-3xl font-bold text-green-600">
                    {service.currency} {service.amount.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500">Per {service.duration}-minute session</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Billing Model</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      service.requiresSubscription 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {service.requiresSubscription ? 'Subscription Required' : 'One-time Payment'}
                    </span>
                  </div>
                  {service.requiresSubscription && (
                    <p className="text-sm text-gray-500 mt-2">
                      This service requires an active subscription for recurring billing.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="text-sm text-gray-600 mt-1 capitalize">
                  {service.category.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Duration</label>
                <p className="text-sm text-gray-600 mt-1">{service.duration} minutes</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    service.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {service.tags.map((tag, index) => (
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

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Bookings</span>
                <span className="text-2xl font-bold text-blue-600">{service.usage_count}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Revenue Generated</span>
                <span className="text-lg font-semibold text-green-600">
                  {service.currency} {service.revenue_generated.toLocaleString()}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-sm text-gray-600 mt-1">{formatDate(service.updated_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-600 mt-1">{formatDate(service.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href={`/dashboard/doctor/appointments/new?service=${service.id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Book Appointment
              </Link>
              
              <Link
                href={`/dashboard/doctor/subscriptions/new?service=${service.id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                style={{ display: service.requiresSubscription ? 'flex' : 'none' }}
              >
                Create Subscription
              </Link>
              
              <button
                onClick={() => console.log('Generate service report')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Generate Report
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}