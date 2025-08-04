'use client'

import { useState, useEffect } from 'react'
import {
  CogIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TreatmentsManagement() {
  const [treatments, setTreatments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTreatments()
  }, [])

  const fetchTreatments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/treatments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status && result.payload?.data?.treatments) {
          setTreatments(result.payload.data.treatments)
        }
      }
    } catch (error) {
      console.error('Error fetching treatments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTreatmentIcon = (treatment: string) => {
    switch (treatment.toLowerCase()) {
      case 'medication':
        return '💊'
      case 'surgery':
        return '🏥'
      case 'hip replacement':
        return '🦴'
      case 'chemotherapy':
        return '🧪'
      case 'diet & nutrition':
        return '🥗'
      case 'exercise & lifestyle':
        return '🏃'
      case 'saline':
        return '💧'
      default:
        return '⚕️'
    }
  }

  const getTreatmentDescription = (treatment: string) => {
    switch (treatment.toLowerCase()) {
      case 'medication':
        return 'Pharmaceutical treatment with prescribed drugs'
      case 'surgery':
        return 'Surgical intervention and procedures'
      case 'hip replacement':
        return 'Orthopedic hip joint replacement surgery'
      case 'chemotherapy':
        return 'Cancer treatment using chemical substances'
      case 'diet & nutrition':
        return 'Nutritional therapy and dietary management'
      case 'exercise & lifestyle':
        return 'Physical therapy and lifestyle modifications'
      case 'saline':
        return 'Saline solution administration'
      case 'other':
        return 'Other treatment methods not listed above'
      default:
        return 'Medical treatment option'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Treatments Management</h1>
        <p className="text-gray-600">Manage treatment options available for patient care plans</p>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-purple-900 mb-1">
                Predefined Treatment Options
              </h3>
              <p className="text-sm text-purple-700">
                The system currently uses a predefined list of treatment options. 
                These treatments are used when creating patient care plans and prescribing medical interventions.
                Future versions will support custom treatment management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {treatments.map((treatment, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="text-2xl mr-4 mt-1">
                  {getTreatmentIcon(treatment)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {treatment}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getTreatmentDescription(treatment)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {treatments.length === 0 && !loading && (
        <div className="text-center py-12">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No treatments found</h3>
          <p className="mt-1 text-sm text-gray-500">Unable to load the treatments list.</p>
        </div>
      )}

      {/* Future Enhancement Card */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">
            Future Enhancements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Add custom treatment options</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Edit treatment descriptions and protocols</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Categorize treatments by medical specialty</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Link treatments to medical guidelines</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Set treatment contraindications and warnings</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}