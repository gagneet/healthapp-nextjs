'use client'

import { useState, useEffect } from 'react'
import {
  ClipboardDocumentListIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConditionsManagement() {
  const [conditions, setConditions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConditions()
  }, [])

  const fetchConditions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/conditions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status && result.payload?.data?.conditions) {
          setConditions(result.payload.data.conditions)
        }
      }
    } catch (error) {
      console.error('Error fetching conditions:', error)
    } finally {
      setLoading(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Conditions Management</h1>
        <p className="text-gray-600">Manage medical conditions used in patient care plans</p>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Predefined Conditions
              </h3>
              <p className="text-sm text-blue-700">
                The system currently uses a predefined list of medical conditions. 
                These conditions are used when creating patient care plans and medical records.
                Future versions will support custom condition management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conditions.map((condition, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">{condition}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {conditions.length === 0 && !loading && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conditions found</h3>
          <p className="mt-1 text-sm text-gray-500">Unable to load the conditions list.</p>
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
              <span>Add custom medical conditions</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Edit existing condition descriptions</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Categorize conditions by medical specialty</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
              <span>Link conditions to ICD-10 codes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}