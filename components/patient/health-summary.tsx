'use client'

import { BeakerIcon, HeartIcon, ScaleIcon, SunIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

interface HealthMetric {
  id: string
  name: string
  value: string
  unit: string
  status: 'normal' | 'warning' | 'critical'
  lastUpdated: string
  icon: React.ComponentType<any>
}

interface HealthSummaryProps {
  patientId?: string
}

export default function HealthSummary({ patientId }: HealthSummaryProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock health metrics - replace with actual API call
    const mockMetrics: HealthMetric[] = [
      {
        id: '1',
        name: 'Blood Pressure',
        value: '120/80',
        unit: 'mmHg',
        status: 'normal',
        lastUpdated: '2025-01-15T10:30:00Z',
        icon: HeartIcon
      },
      {
        id: '2',
        name: 'Weight',
        value: '165',
        unit: 'lbs',
        status: 'normal',
        lastUpdated: '2025-01-14T08:00:00Z',
        icon: ScaleIcon
      },
      {
        id: '3',
        name: 'Temperature',
        value: '98.6',
        unit: '°F',
        status: 'normal',
        lastUpdated: '2025-01-13T14:15:00Z',
        icon: SunIcon
      },
      {
        id: '4',
        name: 'Blood Glucose',
        value: '95',
        unit: 'mg/dL',
        status: 'normal',
        lastUpdated: '2025-01-15T07:00:00Z',
        icon: BeakerIcon
      }
    ]

    setTimeout(() => {
      setMetrics(mockMetrics)
      setIsLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-24"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const MetricIcon = typeof metric.icon === 'function' ? metric.icon : HeartIcon

        if (MetricIcon !== metric.icon) {
          console.warn('HealthSummary metric icon invalid:', metric)
        }

        return (
          <div key={metric.id} className={`p-4 rounded-lg border-2 ${getStatusColor(metric.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <MetricIcon className="h-6 w-6" />
              <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(metric.status)}`}>
                {metric.status}
              </span>
            </div>
            
            <div className="mb-1">
              <div className="text-2xl font-bold text-gray-900">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600">
                {metric.unit}
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              <div className="font-medium">{metric.name}</div>
              <div>{formatLastUpdated(metric.lastUpdated)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
