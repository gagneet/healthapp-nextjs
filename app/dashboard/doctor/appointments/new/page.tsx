'use client'

export const dynamic = 'force-dynamic'




/**
 * New Appointment Page - Doctor Dashboard
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NewAppointmentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentType: 'consultation',
    date: '',
    time: '',
    duration: '30',
    reason: '',
    notes: '',
    isUrgent: false,
    reminder: true,
    location: 'office'
  })

  useEffect(() => {
    // TODO: Fetch patient list
    setPatients([])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // TODO: Implement appointment creation API call
      console.log('Creating appointment:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to appointments list
      router.push('/dashboard/doctor/calendar')
    } catch (error) {
      console.error('Error creating appointment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  // Generate time slots
  const timeSlots = []
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeSlots.push(time)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule New Appointment</h1>
            <p className="text-gray-600 mt-2">
              Schedule a new appointment with your patients
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>

        {/* Appointment Creation Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient *
                </label>
                <select
                  id="patientId"
                  name="patientId"
                  required
                  value={formData.patientId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a patient...</option>
                  <option value="patient-1">John Doe</option>
                  <option value="patient-2">Jane Smith</option>
                  <option value="patient-3">Bob Johnson</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Don't see your patient? <button type="button" className="text-blue-600 hover:underline">Add new patient</button>
                </p>
              </div>
              
              <div>
                <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type *
                </label>
                <select
                  id="appointmentType"
                  name="appointmentType"
                  required
                  value={formData.appointmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="checkup">Routine Checkup</option>
                  <option value="procedure">Procedure</option>
                  <option value="emergency">Emergency</option>
                  <option value="telemedicine">Telemedicine</option>
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <select
                  id="time"
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select time...</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="office">Office Visit</option>
                <option value="telemedicine">Telemedicine (Video Call)</option>
                <option value="home">Home Visit</option>
                <option value="hospital">Hospital</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Reason for Visit */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit *
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={3}
                required
                value={formData.reason}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the primary reason for this appointment"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes or special instructions"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isUrgent"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                  className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="isUrgent" className="text-sm font-medium text-gray-700">
                  Mark as urgent appointment
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="reminder"
                  name="reminder"
                  checked={formData.reminder}
                  onChange={handleChange}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="reminder" className="text-sm font-medium text-gray-700">
                  Send reminder to patient (24 hours before)
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.patientId || !formData.date || !formData.time}
                className="min-w-[140px]"
              >
                {isLoading ? 'Scheduling...' : 'Schedule Appointment'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Schedule</h3>
            <p className="text-sm text-gray-600 mb-3">
              Schedule for existing care plan patients
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Care Plans
            </Button>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Recurring Appointments</h3>
            <p className="text-sm text-gray-600 mb-3">
              Set up weekly or monthly recurring visits
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Create Recurring
            </Button>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Emergency Slot</h3>
            <p className="text-sm text-gray-600 mb-3">
              Schedule emergency appointment for today
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Emergency Booking
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
