'use client'

import React, { useState } from 'react'
import { MapPinIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Address {
  street: string
  city: string
  state: string
  country: string
  postal_code: string
  formatted_address?: string
}

interface AddressInputWithGeocodingProps {
  address: Address
  onAddressChange: (address: Address) => void
  onGeocodeSuccess?: (geocodeData: any) => void
  onGeocodeError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export default function AddressInputWithGeocoding({
  address,
  onAddressChange,
  onGeocodeSuccess,
  onGeocodeError,
  className = '',
  disabled = false
}: AddressInputWithGeocodingProps) {
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [geocodeMessage, setGeocodeMessage] = useState<string>('')

  const handleInputChange = (field: keyof Address) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onAddressChange({
      ...address,
      [field]: e.target.value
    })
    // Reset geocode status when address changes
    setGeocodeStatus('idle')
    setGeocodeMessage('')
  }

  const handleGeocode = async () => {
    if (!address.street || !address.city) {
      setGeocodeStatus('error')
      setGeocodeMessage('Street and city are required for geocoding')
      return
    }

    setGeocoding(true)
    setGeocodeStatus('idle')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/doctors/reverse-geocode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: address
        })
      })

      const result = await response.json()

      if (result.status && response.ok) {
        setGeocodeStatus('success')
        setGeocodeMessage('Address validated successfully')
        
        if (result.payload.data.address) {
          const validatedAddress = {
            ...address,
            ...result.payload.data.address
          }
          onAddressChange(validatedAddress)
        }
        
        onGeocodeSuccess?.(result.payload.data)
      } else {
        throw new Error(result.payload?.error?.message || 'Geocoding failed')
      }
    } catch (error) {
      setGeocodeStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate address'
      setGeocodeMessage(errorMessage)
      onGeocodeError?.(errorMessage)
    } finally {
      setGeocoding(false)
    }
  }

  const getStatusIcon = () => {
    switch (geocodeStatus) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <MapPinIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (geocodeStatus) {
      case 'success':
        return 'border-green-300 bg-green-50'
      case 'error':
        return 'border-red-300 bg-red-50'
      default:
        return 'border-gray-300 bg-white'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Address Fields */}
      <div className={`p-4 rounded-lg border-2 transition-colors ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            {getStatusIcon()}
            <span className="ml-2">Clinic Address</span>
          </label>
          <button
            type="button"
            onClick={handleGeocode}
            disabled={disabled || geocoding || !address.street || !address.city}
            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors ${
              geocoding
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
            }`}
          >
            {geocoding ? (
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <MapPinIcon className="h-4 w-4 mr-1" />
            )}
            {geocoding ? 'Validating...' : 'Validate Location'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              id="street"
              value={address.street}
              onChange={handleInputChange('street')}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="123 Main Street, Suite 100"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              value={address.city}
              onChange={handleInputChange('city')}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="New York"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State/Province
            </label>
            <input
              type="text"
              id="state"
              value={address.state}
              onChange={handleInputChange('state')}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="NY"
            />
          </div>

          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <input
              type="text"
              id="postal_code"
              value={address.postal_code}
              onChange={handleInputChange('postal_code')}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="10001"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={address.country}
              onChange={handleInputChange('country')}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="United States"
            />
          </div>
        </div>

        {/* Status Message */}
        {geocodeMessage && (
          <div className={`mt-3 p-3 rounded-md ${
            geocodeStatus === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-700' 
              : 'bg-red-100 border border-red-300 text-red-700'
          }`}>
            <div className="flex items-center">
              {getStatusIcon()}
              <span className="ml-2 text-sm">{geocodeMessage}</span>
            </div>
          </div>
        )}

        {/* Formatted Address Display */}
        {address.formatted_address && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Formatted Address:</h4>
            <p className="text-sm text-blue-700">{address.formatted_address}</p>
          </div>
        )}
      </div>
    </div>
  )
}