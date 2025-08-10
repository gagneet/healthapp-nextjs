'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

interface Prescription {
  id: string
  prescription_number: string
  doctor_name: string
  doctor_speciality: string
  prescribed_date: string
  medications: {
    name: string
    dosage: string
    frequency: string
    quantity: string
    instructions: string
  }[]
  diagnosis: string
  notes?: string
  status: 'active' | 'expired' | 'filled'
  valid_until: string
  pharmacy?: {
    name: string
    address: string
    phone: string
  }
}

export default function PrescriptionsPage() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'filled'>('all')

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/prescriptions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPrescriptions(data.payload?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (filter === 'all') return true
    return prescription.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'filled':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpiringSoon = (validUntil: string) => {
    const expiryDate = new Date(validUntil)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="w-8 h-8 mr-3 text-blue-600" />
            My Prescriptions
          </h1>
          <p className="text-gray-600 mt-1">View and manage your medical prescriptions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['all', 'active', 'expired', 'filled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  filter === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status} ({prescriptions.filter(p => status === 'all' || p.status === status).length})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'active' 
                ? 'You have no active prescriptions at this time.'
                : `No ${filter} prescriptions found.`}
            </p>
          </div>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <div key={prescription.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          Prescription #{prescription.prescription_number}
                        </h3>
                        <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                          {prescription.status}
                        </span>
                        {isExpiringSoon(prescription.valid_until) && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Expires Soon
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Dr. {prescription.doctor_name} ({prescription.doctor_speciality})
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Prescribed: {new Date(prescription.prescribed_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Valid Until:</span> {new Date(prescription.valid_until).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Medications */}
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Medications:</h4>
                      <div className="space-y-2">
                        {prescription.medications.map((medication, index) => (
                          <div key={index} className="bg-gray-50 rounded-md p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{medication.name}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="mr-4">Dosage: {medication.dosage}</span>
                                  <span className="mr-4">Frequency: {medication.frequency}</span>
                                  <span>Quantity: {medication.quantity}</span>
                                </div>
                                {medication.instructions && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Instructions:</span> {medication.instructions}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pharmacy Info */}
                    {prescription.pharmacy && (
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Pharmacy:</h4>
                        <div className="text-sm text-gray-600">
                          <div>{prescription.pharmacy.name}</div>
                          <div>{prescription.pharmacy.address}</div>
                          <div>{prescription.pharmacy.phone}</div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {prescription.notes && (
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Notes:</h4>
                        <p className="text-sm text-gray-600">{prescription.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => setSelectedPrescription(prescription)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <button className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center">
                      <PrinterIcon className="w-4 h-4 mr-1" />
                      Print
                    </button>
                    <button className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex items-center">
                      <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-gray-900">
                Prescription Details - #{selectedPrescription.prescription_number}
              </h3>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Header Info */}
              <div className="border-b border-gray-200 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Prescribing Doctor</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> Dr. {selectedPrescription.doctor_name}</div>
                      <div><span className="font-medium">Speciality:</span> {selectedPrescription.doctor_speciality}</div>
                      <div><span className="font-medium">Date Prescribed:</span> {new Date(selectedPrescription.prescribed_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Prescription Info</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Number:</span> {selectedPrescription.prescription_number}</div>
                      <div><span className="font-medium">Status:</span> 
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs ${getStatusColor(selectedPrescription.status)}`}>
                          {selectedPrescription.status}
                        </span>
                      </div>
                      <div><span className="font-medium">Valid Until:</span> {new Date(selectedPrescription.valid_until).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medications Detail */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Prescribed Medications</h4>
                <div className="space-y-4">
                  {selectedPrescription.medications.map((medication, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="text-lg font-medium text-gray-900 mb-2">{medication.name}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="font-medium">Dosage:</span> {medication.dosage}</div>
                        <div><span className="font-medium">Frequency:</span> {medication.frequency}</div>
                        <div><span className="font-medium">Quantity:</span> {medication.quantity}</div>
                      </div>
                      {medication.instructions && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Instructions:</span>
                          <p className="mt-1 text-gray-600">{medication.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center">
                <PrinterIcon className="w-4 h-4 mr-2" />
                Print Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}