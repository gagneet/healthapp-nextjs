'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { AcademicCapIcon } from '@heroicons/react/24/outline'

interface EducationContent {
  id: string
  title: string
  summary?: string | null
  category: string
  contentType: string
  difficulty: string
}

export default function PatientEducationPage() {
  const [content, setContent] = useState<EducationContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/education')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load education content')
      }
      setContent(data.payload?.data || [])
    } catch (err) {
      console.error('Failed to load education content:', err)
      setError('Unable to load education content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchContent} className="mt-3 text-sm text-blue-600 hover:text-blue-700">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <AcademicCapIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Education</h1>
      </div>

      {content.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          No educational content available.
        </div>
      ) : (
        <div className="grid gap-3">
          {content.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500">{item.category} · {item.contentType} · {item.difficulty}</p>
              {item.summary && <p className="text-xs text-gray-600 mt-1">{item.summary}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
