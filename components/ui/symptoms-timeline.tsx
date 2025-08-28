'use client'

import { useState } from 'react'
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Symptom {
  id: string
  name: string
  severity: number
  x: number
  y: number
  description?: string
  onset_time: string
  recordedAt: string
  body_part?: string
  status?: 'active' | 'resolved' | 'improving' | 'worsening'
}

interface SymptomsTimelineProps {
  symptoms: Symptom[]
  onSymptomClick?: (symptom: Symptom) => void
  highlightedSymptom?: string | null
}

export default function SymptomsTimeline({ 
  symptoms = [], 
  onSymptomClick,
  highlightedSymptom = null
}: SymptomsTimelineProps) {
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | '24h' | '7d' | '30d'>('all')

  // Sort symptoms by date (most recent first)
  const sortedSymptoms = [...symptoms].sort((a, b) => 
    new Date(b.onset_time).getTime() - new Date(a.onset_time).getTime()
  )

  // Filter symptoms by date range
  const getFilteredSymptoms = () => {
    const now = new Date()
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }

    if (selectedDateRange === 'all') return sortedSymptoms

    const cutoff = new Date(now.getTime() - ranges[selectedDateRange])
    return sortedSymptoms.filter(symptom => 
      new Date(symptom.onset_time) >= cutoff
    )
  }

  const filteredSymptoms = getFilteredSymptoms()

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-500'
    if (severity >= 5) return 'bg-orange-500'
    if (severity >= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'Severe'
    if (severity >= 5) return 'Moderate'
    if (severity >= 3) return 'Mild'
    return 'Minimal'
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'improving': return 'bg-blue-100 text-blue-800'
      case 'worsening': return 'bg-red-100 text-red-800'
      case 'active':
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupSymptomsByDate = () => {
    const groups: { [key: string]: Symptom[] } = {}
    
    filteredSymptoms.forEach(symptom => {
      const date = new Date(symptom.onset_time).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(symptom)
    })

    return groups
  }

  const symptomGroups = groupSymptomsByDate()

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Symptoms Timeline</h3>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'All' },
            { key: '24h', label: '24h' },
            { key: '7d', label: '7d' },
            { key: '30d', label: '30d' }
          ].map(range => (
            <button
              key={range.key}
              onClick={() => setSelectedDateRange(range.key as any)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedDateRange === range.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-96 overflow-y-auto space-y-4">
        {Object.keys(symptomGroups).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No symptoms recorded for the selected time period</p>
          </div>
        ) : (
          Object.entries(symptomGroups).map(([date, daySymptoms]) => (
            <div key={date} className="relative">
              {/* Date Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 pb-2 mb-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  <span className="ml-2 text-xs text-gray-500">
                    ({daySymptoms.length} symptom{daySymptoms.length !== 1 ? 's' : ''})
                  </span>
                </h4>
              </div>

              {/* Timeline Items */}
              <div className="space-y-3 relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {daySymptoms.map((symptom, index) => {
                  const isHighlighted = highlightedSymptom === symptom.id
                  
                  return (
                    <div
                      key={symptom.id}
                      className={`relative pl-10 cursor-pointer transition-all duration-200 ${
                        isHighlighted 
                          ? 'bg-blue-50 -mx-2 px-2 py-2 rounded-lg border border-blue-200' 
                          : 'hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg'
                      }`}
                      onClick={() => onSymptomClick?.(symptom)}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                        getSeverityColor(symptom.severity)
                      } ${isHighlighted ? 'ring-2 ring-blue-400' : ''}`}></div>

                      {/* Symptom content */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h5 className={`font-medium ${
                                isHighlighted ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {symptom.name}
                              </h5>
                              {symptom.body_part && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {symptom.body_part}
                                </span>
                              )}
                            </div>
                            
                            {symptom.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {symptom.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{formatDateTime(symptom.onset_time)}</span>
                              {symptom.status && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  getStatusColor(symptom.status)
                                }`}>
                                  {symptom.status}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Severity indicator */}
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">
                                {getSeverityLabel(symptom.severity)}
                              </span>
                              <div className="flex items-center">
                                {symptom.severity >= 8 && (
                                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-gray-900 mt-1">
                              {symptom.severity}/10
                            </div>
                            
                            {/* Severity bar */}
                            <div className="flex space-x-0.5 mt-1">
                              {[...Array(10)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 h-2 rounded-sm ${
                                    i < symptom.severity 
                                      ? getSeverityColor(symptom.severity)
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {filteredSymptoms.length}
            </div>
            <div className="text-xs text-gray-500">Total Symptoms</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {filteredSymptoms.filter(s => s.severity >= 8).length}
            </div>
            <div className="text-xs text-gray-500">Severe</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {filteredSymptoms.filter(s => s.status === 'resolved').length}
            </div>
            <div className="text-xs text-gray-500">Resolved</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {filteredSymptoms.filter(s => s.status === 'active').length}
            </div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
        </div>
      </div>
    </div>
  )
}