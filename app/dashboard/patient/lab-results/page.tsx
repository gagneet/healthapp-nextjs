'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { BeakerIcon } from '@heroicons/react/24/outline'

interface LabOrderSummary {
  id: string
  orderNumber: string
  status: string
  orderedTests: unknown
  orderDate: string
  expectedResultDate?: string | null
  resultsAvailable: boolean
  criticalValues: boolean
  doctor?: { name: string; specialty: string } | null
  resultsCount: number
}

interface LabResultDetail {
  id: string
  testName: string
  testCode?: string | null
  resultValue?: string | null
  resultUnit?: string | null
  referenceRange?: string | null
  abnormalFlag?: string | null
  criticalFlag: boolean
  resultDate: string
  comments?: string | null
}

interface LabOrderDetail extends LabOrderSummary {
  results: LabResultDetail[]
}

export default function PatientLabResultsPage() {
  const [orders, setOrders] = useState<LabOrderSummary[]>([])
  const [selectedOrder, setSelectedOrder] = useState<LabOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/lab-orders')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load lab orders')
      }
      setOrders(data.payload?.data || [])
    } catch (err) {
      console.error('Failed to load lab orders:', err)
      setError('Unable to load lab orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetail = async (orderId: string) => {
    setDetailLoading(true)
    try {
      const response = await fetch(`/api/patient/lab-orders/${orderId}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load lab results')
      }
      setSelectedOrder(data.payload?.data || null)
    } catch (err) {
      console.error('Failed to load lab order detail:', err)
      setError('Unable to load lab results')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
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
        <button onClick={fetchOrders} className="mt-3 text-sm text-blue-600 hover:text-blue-700">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-4">
          <BeakerIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Lab Orders</h2>
        </div>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">No lab orders available.</p>
          ) : (
            orders.map((order) => (
              <button
                key={order.id}
                onClick={() => fetchOrderDetail(order.id)}
                className={`w-full text-left border rounded-md p-3 hover:border-blue-400 transition ${selectedOrder?.id === order.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                <p className="text-xs text-gray-600">Status: {order.status}</p>
                <p className="text-xs text-gray-400">Results: {order.resultsCount}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
        {selectedOrder ? (
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-semibold text-gray-900">Order {selectedOrder.orderNumber}</h3>
              <p className="text-xs text-gray-500">Doctor: {selectedOrder.doctor?.name || 'Unknown'}</p>
            </div>
            {detailLoading ? (
              <p className="text-sm text-gray-500">Loading results...</p>
            ) : selectedOrder.results.length === 0 ? (
              <p className="text-sm text-gray-500">No results available yet.</p>
            ) : (
              <div className="space-y-3">
                {selectedOrder.results.map((result) => (
                  <div key={result.id} className="border rounded-md p-3">
                    <p className="text-sm font-medium text-gray-900">{result.testName}</p>
                    <p className="text-xs text-gray-600">Result: {result.resultValue} {result.resultUnit}</p>
                    {result.referenceRange && (
                      <p className="text-xs text-gray-400">Range: {result.referenceRange}</p>
                    )}
                    {result.abnormalFlag && (
                      <p className="text-xs text-red-600">Flag: {result.abnormalFlag}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            Select a lab order to view results.
          </div>
        )}
      </div>
    </div>
  )
}
