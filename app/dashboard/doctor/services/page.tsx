'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import {
  PlusIcon,
  CreditCardIcon,
  BanknotesIcon,
  UserGroupIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { formatDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface Service {
  id: string
  name: string
  description: string
  type: 'CONSULTATION' | 'CARE_PLAN' | 'MONITORING' | 'THERAPY' | 'WELLNESS'
  pricing_model: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  price: number
  currency: string
  duration_days?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  features: string[]
  target_conditions?: string[]
}

interface Subscription {
  id: string
  service_id: string
  service_name: string
  patientId: string
  patient_name: string
  status: 'ACTIVE' | 'PENDING' | 'CANCELLED' | 'EXPIRED' | 'PAUSED'
  startDate: string
  endDate?: string
  next_billing_date?: string
  total_paid: number
  createdAt: string
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Comprehensive Diabetes Management',
    description: 'Complete diabetes care including medication management, glucose monitoring, and lifestyle coaching.',
    type: 'CARE_PLAN',
    pricing_model: 'MONTHLY',
    price: 299.99,
    currency: 'USD',
    duration_days: 90,
    isActive: true,
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z',
    features: [
      '24/7 Glucose monitoring alerts',
      'Weekly virtual consultations',
      'Personalized meal planning',
      'Medication adherence tracking',
      'Emergency on-call support'
    ],
    target_conditions: ['Type 2 Diabetes', 'Pre-diabetes', 'Metabolic Syndrome']
  },
  {
    id: '2',
    name: 'Hypertension Control Program',
    description: 'Specialized program for blood pressure management with continuous monitoring and lifestyle modifications.',
    type: 'MONITORING',
    pricing_model: 'MONTHLY',
    price: 199.99,
    currency: 'USD',
    duration_days: 60,
    isActive: true,
    createdAt: '2025-01-08T11:15:00Z',
    updatedAt: '2025-01-22T10:45:00Z',
    features: [
      'Daily BP monitoring reminders',
      'Bi-weekly check-ins',
      'Medication optimization',
      'Dietary consultation',
      'Exercise program'
    ],
    target_conditions: ['Hypertension', 'Cardiovascular Disease']
  },
  {
    id: '3',
    name: 'Virtual Consultation Package',
    description: 'Flexible virtual consultation sessions for ongoing care and follow-ups.',
    type: 'CONSULTATION',
    pricing_model: 'ONE_TIME',
    price: 150.00,
    currency: 'USD',
    isActive: true,
    createdAt: '2025-01-05T16:30:00Z',
    updatedAt: '2025-01-18T09:20:00Z',
    features: [
      '45-minute consultation',
      'Digital prescription',
      'Care plan review',
      'Follow-up recommendations',
      'Secure messaging for 7 days'
    ]
  },
  {
    id: '4',
    name: 'Wellness Optimization Program',
    description: 'Comprehensive wellness program focusing on preventive care and lifestyle optimization.',
    type: 'WELLNESS',
    pricing_model: 'QUARTERLY',
    price: 799.99,
    currency: 'USD',
    duration_days: 90,
    isActive: true,
    createdAt: '2025-01-12T14:20:00Z',
    updatedAt: '2025-01-25T11:10:00Z',
    features: [
      'Comprehensive health assessment',
      'Personalized wellness plan',
      'Monthly progress reviews',
      '24/7 health coaching',
      'Wearable device integration',
      'Nutritional guidance'
    ]
  },
  {
    id: '5',
    name: 'Post-Surgery Recovery Support',
    description: 'Specialized recovery program for post-operative patients with comprehensive monitoring.',
    type: 'THERAPY',
    pricing_model: 'ONE_TIME',
    price: 599.99,
    currency: 'USD',
    duration_days: 30,
    isActive: false,
    createdAt: '2023-12-20T10:45:00Z',
    updatedAt: '2025-01-15T13:25:00Z',
    features: [
      'Daily recovery check-ins',
      'Pain management support',
      'Wound care monitoring',
      'Physical therapy coordination',
      'Emergency contact access'
    ]
  }
]

const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    service_id: '1',
    service_name: 'Comprehensive Diabetes Management',
    patientId: 'p1',
    patient_name: 'John Doe',
    status: 'ACTIVE',
    startDate: '2025-01-15T00:00:00Z',
    endDate: '2025-04-15T00:00:00Z',
    next_billing_date: '2025-02-15T00:00:00Z',
    total_paid: 599.97,
    createdAt: '2025-01-15T09:30:00Z'
  },
  {
    id: '2',
    service_id: '2',
    service_name: 'Hypertension Control Program',
    patientId: 'p2',
    patient_name: 'Jane Smith',
    status: 'ACTIVE',
    startDate: '2025-01-20T00:00:00Z',
    endDate: '2025-03-20T00:00:00Z',
    next_billing_date: '2025-02-20T00:00:00Z',
    total_paid: 399.98,
    createdAt: '2025-01-20T14:15:00Z'
  },
  {
    id: '3',
    service_id: '3',
    service_name: 'Virtual Consultation Package',
    patientId: 'p3',
    patient_name: 'Michael Johnson',
    status: 'PENDING',
    startDate: '2025-01-25T00:00:00Z',
    total_paid: 0,
    createdAt: '2025-01-25T11:45:00Z'
  }
]

const serviceTypes = [
  { value: 'ALL', label: 'All Services' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'CARE_PLAN', label: 'Care Plan' },
  { value: 'MONITORING', label: 'Monitoring' },
  { value: 'THERAPY', label: 'Therapy' },
  { value: 'WELLNESS', label: 'Wellness' },
]

const revenueData = [
  { month: 'Oct', revenue: 4500, subscriptions: 12 },
  { month: 'Nov', revenue: 5200, subscriptions: 15 },
  { month: 'Dec', revenue: 6800, subscriptions: 19 },
  { month: 'Jan', revenue: 7200, subscriptions: 22 },
]

const subscriptionStatusData = [
  { status: 'Active', count: 18, color: '#10B981' },
  { status: 'Pending', count: 4, color: '#F59E0B' },
  { status: 'Expired', count: 2, color: '#6B7280' },
]

export default function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>(mockServices)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions)
  const [selectedTab, setSelectedTab] = useState<'services' | 'subscriptions' | 'analytics'>('services')
  const [selectedServiceType, setSelectedServiceType] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const filteredServices = services.filter(service => 
    selectedServiceType === 'ALL' || service.type === selectedServiceType
  )

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'CONSULTATION':
        return 'bg-blue-100 text-blue-800'
      case 'CARE_PLAN':
        return 'bg-green-100 text-green-800'
      case 'MONITORING':
        return 'bg-yellow-100 text-yellow-800'
      case 'THERAPY':
        return 'bg-purple-100 text-purple-800'
      case 'WELLNESS':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      case 'PAUSED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleServiceStatus = (serviceId: string) => {
    setServices(services.map(s => 
      s.id === serviceId ? { ...s, isActive: !s.isActive } : s
    ))
  }

  const deleteService = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      setServices(services.filter(s => s.id !== serviceId))
    }
  }

  const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.total_paid, 0)
  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length
  const avgRevenuePerSubscription = activeSubscriptions > 0 ? totalRevenue / subscriptions.length : 0

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
          <h1 className="text-3xl font-bold text-gray-900">Services & Subscriptions</h1>
          <p className="text-gray-600 mt-1">
            Manage your healthcare services, pricing, and patient subscriptions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/doctor/services/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Service
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{activeSubscriptions}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-3xl font-bold text-gray-900">
                  {services.filter(s => s.isActive).length}
                </p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${avgRevenuePerSubscription.toLocaleString()}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'services', label: 'Services', count: services.length },
            { key: 'subscriptions', label: 'Subscriptions', count: subscriptions.length },
            { key: 'analytics', label: 'Analytics', count: null },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'services' && (
        <div className="space-y-6">
          {/* Service Type Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by type:</label>
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {serviceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className={`relative ${!service.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                        {service.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceTypeColor(service.type)}`}>
                          {service.type.replace('_', ' ')}
                        </span>
                        {!service.isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {service.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        ${service.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        {service.pricing_model.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                    {service.duration_days && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">{service.duration_days} days</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircleIcon className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {service.features.length > 3 && (
                        <li className="text-blue-600">+{service.features.length - 3} more features</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/doctor/services/${service.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    <Link
                      href={`/dashboard/doctor/services/${service.id}/edit`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteService(service.id)}
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
        </div>
      )}

      {selectedTab === 'subscriptions' && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.patient_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subscription.service_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>Start: {formatDate(subscription.startDate)}</div>
                        {subscription.endDate && (
                          <div>End: {formatDate(subscription.endDate)}</div>
                        )}
                        {subscription.next_billing_date && (
                          <div className="text-blue-600">
                            Next: {formatDate(subscription.next_billing_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${subscription.total_paid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-yellow-600 hover:text-yellow-900">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue ($)" />
                  <Line type="monotone" dataKey="subscriptions" stroke="#10B981" name="Subscriptions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subscription Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subscriptionStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}