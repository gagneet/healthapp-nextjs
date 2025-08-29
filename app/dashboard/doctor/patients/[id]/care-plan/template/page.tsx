'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  BeakerIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock care plan templates - replace with actual API calls
const mockTemplates = [
  {
    id: '1',
    name: 'Diabetes Type 2 Management',
    description: 'Comprehensive care plan for Type 2 diabetes patients including medication, lifestyle modifications, and monitoring',
    category: 'Endocrine',
    duration: '6 months',
    carePlans: 3,
    vitals: 5,
    appointments: 8,
    popularity: 95,
    lastUpdated: '2025-01-15',
    features: [
      'Blood glucose monitoring protocol',
      'HbA1c tracking schedule',
      'Medication adjustment guidelines',
      'Diet and exercise recommendations',
      'Complication screening'
    ]
  },
  {
    id: '2',
    name: 'Hypertension Management',
    description: 'Evidence-based hypertension care plan with medication protocols and lifestyle interventions',
    category: 'Cardiovascular',
    duration: '3 months',
    carePlans: 2,
    vitals: 3,
    appointments: 6,
    popularity: 88,
    lastUpdated: '2025-01-18',
    features: [
      'Blood pressure monitoring schedule',
      'Antihypertensive medication protocols',
      'Sodium restriction guidelines',
      'Exercise prescription',
      'Cardiovascular risk assessment'
    ]
  },
  {
    id: '3',
    name: 'Chronic Heart Failure',
    description: 'Comprehensive heart failure management with medication optimization and symptom monitoring',
    category: 'Cardiovascular',
    duration: '12 months',
    carePlans: 4,
    vitals: 6,
    appointments: 12,
    popularity: 82,
    lastUpdated: '2025-01-10',
    features: [
      'Fluid balance monitoring',
      'ACE inhibitor titration protocol',
      'Daily weight tracking',
      'Symptom assessment tools',
      'Exercise tolerance evaluation'
    ]
  },
  {
    id: '4',
    name: 'COPD Management',
    description: 'Chronic obstructive pulmonary disease care plan with bronchodilator therapy and pulmonary rehabilitation',
    category: 'Respiratory',
    duration: '6 months',
    carePlans: 3,
    vitals: 4,
    appointments: 8,
    popularity: 76,
    lastUpdated: '2025-01-12',
    features: [
      'Spirometry monitoring schedule',
      'Inhaler technique assessment',
      'Oxygen saturation tracking',
      'Smoking cessation support',
      'Exacerbation action plan'
    ]
  },
  {
    id: '5',
    name: 'Chronic Kidney Disease',
    description: 'CKD management plan focusing on progression prevention and complication management',
    category: 'Nephrology',
    duration: '12 months',
    carePlans: 3,
    vitals: 5,
    appointments: 10,
    popularity: 71,
    lastUpdated: '2025-01-08',
    features: [
      'eGFR monitoring protocol',
      'Mineral and bone disorder management',
      'Anemia screening and treatment',
      'Dietary protein restriction',
      'Cardiovascular risk reduction'
    ]
  },
  {
    id: '6',
    name: 'Rheumatoid Arthritis',
    description: 'RA management with disease-modifying therapy and joint function preservation',
    category: 'Rheumatology',
    duration: '6 months',
    carePlans: 4,
    vitals: 3,
    appointments: 9,
    popularity: 68,
    lastUpdated: '2025-01-05',
    features: [
      'Disease activity monitoring (DAS28)',
      'DMARD therapy protocols',
      'Joint function assessment',
      'Infection screening',
      'Bone health monitoring'
    ]
  }
]

const categories = ['All', 'Cardiovascular', 'Endocrine', 'Respiratory', 'Nephrology', 'Rheumatology', 'Neurology', 'Oncology']

export default function CarePlanTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Filter templates based on category and search
  const filteredTemplates = mockTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleCreateFromTemplate = async (templateId: string) => {
    setIsCreating(true)
    try {
      // Mock API call to create care plan from template
      console.log(`Creating care plan from template ${templateId} for patient ${patientId}`)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to the new care plan
      router.push(`/dashboard/doctor/patients/${patientId}/care-plan/123`) // Mock care plan ID
    } catch (error) {
      console.error('Error creating care plan from template:', error)
      alert('Failed to create care plan. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handlePreviewTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 90) return 'text-green-600 bg-green-100'
    if (popularity >= 80) return 'text-blue-600 bg-blue-100'
    if (popularity >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cardiovascular': return '❤️'
      case 'Endocrine': return '🩺'
      case 'Respiratory': return '🫁'
      case 'Nephrology': return '🫘'
      case 'Rheumatology': return '🦴'
      case 'Neurology': return '🧠'
      case 'Oncology': return '🎗️'
      default: return '📋'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/doctor/patients/${patientId}`}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Care Plan Templates</h1>
            <p className="text-gray-600 mt-1">
              Choose from evidence-based care plan templates to quickly create comprehensive care plans
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{getCategoryIcon(category)}</span>
                  {category}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                    <span className="text-sm text-gray-500">{template.category}</span>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPopularityColor(template.popularity)}`}>
                  {template.popularity}% used
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-3">{template.description}</p>
              
              {/* Template Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{template.carePlans}</div>
                  <div className="text-gray-500">Medications</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{template.vitals}</div>
                  <div className="text-gray-500">Vitals</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{template.appointments}</div>
                  <div className="text-gray-500">Appointments</div>
                </div>
              </div>

              {/* Key Features */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Key Features:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {template.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {template.features.length > 3 && (
                    <li className="text-gray-400 italic">+{template.features.length - 3} more features</li>
                  )}
                </ul>
              </div>

              {/* Template Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {template.duration}
                </div>
                <div>Updated {template.lastUpdated}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => handlePreviewTemplate(template.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Preview
                </button>
                <button
                  onClick={() => handleCreateFromTemplate(template.id)}
                  disabled={isCreating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  ) : (
                    <PlusIcon className="h-4 w-4 mr-1" />
                  )}
                  Use Template
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or category filter to find the templates you're looking for.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setSelectedTemplate(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Template Preview</h3>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {(() => {
                const template = mockTemplates.find(t => t.id === selectedTemplate)
                if (!template) return null

                return (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Category:</span>
                          <div className="text-gray-600">{template.category}</div>
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>
                          <div className="text-gray-600">{template.duration}</div>
                        </div>
                        <div>
                          <span className="font-medium">Popularity:</span>
                          <div className="text-gray-600">{template.popularity}%</div>
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span>
                          <div className="text-gray-600">{template.lastUpdated}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Complete Feature List:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {template.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setSelectedTemplate(null)}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleCreateFromTemplate(template.id)}
                        disabled={isCreating}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isCreating ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </div>
                        ) : (
                          'Use This Template'
                        )}
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}