'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ShieldCheckIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { apiRequest } from '@/lib/api'
import { Patient } from '@/types/dashboard'

interface OtpVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
  onSuccess: (patient: Patient) => void
}

interface OtpResponse {
  otp_generated?: boolean
  otp_exists?: boolean
  expires_at?: string
  remaining_time?: number
  delivery_methods?: string[]
  delivery_status?: {
    sms_sent: boolean
    email_sent: boolean
    overall_success: boolean
  }
}

export default function OtpVerificationModal({
  isOpen,
  onClose,
  patient,
  onSuccess
}: OtpVerificationModalProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [otpResponse, setOtpResponse] = useState<OtpResponse | null>(null)
  const [canResend, setCanResend] = useState(false)
  
  // Refs for OTP inputs
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ]

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('request')
      setOtp(['', '', '', ''])
      setError(null)
      setSuccess(false)
      setTimeRemaining(300)
      setCanResend(false)
      setOtpResponse(null)
    }
  }, [isOpen, patient])

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (step === 'verify' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            setCanResend(true)
            return 0
          }
          return time - 1
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [step, timeRemaining])

  // Auto-focus next OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      
      // Auto-focus next input
      if (value && index < 3) {
        otpRefs[index + 1]?.current?.focus()
      }
      
      // Auto-submit if all digits entered
      if (newOtp.every(digit => digit) && newOtp.join('').length === 4) {
        handleVerifyOtp()
      }
    }
  }

  // Handle backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1]?.current?.focus()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const maskContactInfo = (info: string, type: 'phone' | 'email') => {
    if (!info) return 'Not provided'
    
    if (type === 'phone') {
      return info.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
    } else {
      const [name, domain] = info.split('@')
      if (name && domain) {
        return `${name.charAt(0)}${'*'.repeat(name.length - 1)}@${domain}`
      }
    }
    return info
  }

  const handleRequestOtp = async () => {
    if (!patient?.assignment_id) {
      setError('Assignment ID not found')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiRequest.post(`/consent/${patient.id}/request-otp`, {
        assignment_id: patient.assignment_id
      })

      if ((response as any).status) {
        setOtpResponse((response as any).payload.data)
        setStep('verify')
        setTimeRemaining(300) // Reset timer
        setCanResend(false)
        
        // Focus first OTP input
        setTimeout(() => otpRefs[0]?.current?.focus(), 100)
      } else {
        setError((response as any).payload?.error?.message || 'Failed to send OTP')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 4) {
      setError('Please enter the complete 4-digit OTP')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiRequest.post(`/consent/${patient!.id}/verify-otp`, {
        otp_code: otpCode,
        assignment_id: patient!.assignment_id
      })

      if ((response as any).status && (response as any).payload?.data?.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess(patient!)
          onClose()
        }, 2000)
      } else {
        setError((response as any).payload?.error?.message || 'Invalid OTP')
        // Clear OTP inputs on error
        setOtp(['', '', '', ''])
        otpRefs[0]?.current?.focus()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP')
      setOtp(['', '', '', ''])
      otpRefs[0]?.current?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setCanResend(false)
    setTimeRemaining(300)
    setOtp(['', '', '', ''])
    await handleRequestOtp()
  }

  if (!isOpen || !patient) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {step === 'request' && (
            <>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ShieldCheckIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Request Patient Consent
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You need patient consent to access <strong>{patient.first_name} {patient.last_name}&apos;s</strong> medical records.
                      </p>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">OTP will be sent to:</h4>
                        <div className="space-y-2">
                          {patient.phone && (
                            <div className="flex items-center text-sm text-blue-800">
                              <PhoneIcon className="h-4 w-4 mr-2" />
                              <span>{maskContactInfo(patient.phone, 'phone')}</span>
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center text-sm text-blue-800">
                              <EnvelopeIcon className="h-4 w-4 mr-2" />
                              <span>{maskContactInfo(patient.email, 'email')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {patient.same_provider && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md">
                          <p className="text-xs text-green-800">
                            <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                            <strong>Same Provider:</strong> This consent process is required for cross-doctor access within your organization.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={handleRequestOtp}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                    {success ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    {success ? 'Consent Granted!' : 'Enter Verification Code'}
                  </h3>
                  
                  {!success && (
                    <>
                      <p className="text-sm text-gray-500 mb-4">
                        Enter the 4-digit OTP sent to patient&apos;s registered contacts
                      </p>
                      
                      {/* OTP Input */}
                      <div className="flex justify-center space-x-3 mb-4">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={otpRefs[index]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            disabled={isLoading || success}
                          />
                        ))}
                      </div>
                      
                      {/* Timer */}
                      <div className="flex items-center justify-center mb-4">
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className={`text-sm ${timeRemaining <= 60 ? 'text-red-600' : 'text-gray-600'}`}>
                          {timeRemaining > 0 ? `Expires in ${formatTime(timeRemaining)}` : 'OTP Expired'}
                        </span>
                      </div>
                      
                      {/* Delivery Status */}
                      {otpResponse?.delivery_status && (
                        <div className="text-left mb-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Delivery Status:</h4>
                          <div className="space-y-1">
                            <div className="flex items-center text-xs">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              <span className={otpResponse.delivery_status.sms_sent ? 'text-green-600' : 'text-red-600'}>
                                SMS: {otpResponse.delivery_status.sms_sent ? 'Sent' : 'Failed'}
                              </span>
                            </div>
                            <div className="flex items-center text-xs">
                              <EnvelopeIcon className="h-3 w-3 mr-1" />
                              <span className={otpResponse.delivery_status.email_sent ? 'text-green-600' : 'text-red-600'}>
                                Email: {otpResponse.delivery_status.email_sent ? 'Sent' : 'Failed'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {success && (
                    <div className="text-center">
                      <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <p className="text-green-600 font-medium mb-2">Consent verification successful!</p>
                      <p className="text-sm text-gray-500">
                        You now have access to {patient.first_name} {patient.last_name}&apos;s medical records.
                      </p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 rounded-md">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {!success && (
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  {canResend ? (
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleResendOtp}
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading || otp.join('').length !== 4}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                      onClick={handleVerifyOtp}
                    >
                      {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}