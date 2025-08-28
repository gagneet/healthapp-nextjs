'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Calendar,
  Clock,
  User,
  Video,
  AlertCircle,
  CheckCircle,
  Phone,
  MessageSquare
} from 'lucide-react';

interface Doctor {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  speciality?: {
    name: string;
  };
  consultation_fee: number;
}

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

interface ConsultationBookingProps {
  doctorId?: string;
  patientId: string;
  onBookingComplete: (booking: any) => void;
  onError: (error: string) => void;
}

export default function ConsultationBooking({
  doctorId,
  patientId,
  onBookingComplete,
  onError
}: ConsultationBookingProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [duration, setDuration] = useState(30);
  const [consultationType, setConsultationType] = useState<'emergency' | 'scheduled' | 'followup' | 'second_opinion'>('scheduled');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorInfo(doctorId);
    } else {
      fetchAvailableDoctors();
    }
  }, [doctorId]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate, duration]);

  const fetchDoctorInfo = async (id: string) => {
    try {
      // In real implementation, fetch doctor info from API
      // For now, mock the response
      const mockDoctor: Doctor = {
        id: id,
        user: {
          firstName: 'Dr. Emily',
          lastName: 'Rodriguez'
        },
        speciality: {
          name: 'Internal Medicine'
        },
        consultation_fee: 200
      };
      setSelectedDoctor(mockDoctor);
    } catch (error) {
      onError('Failed to fetch doctor information');
    }
  };

  const fetchAvailableDoctors = async () => {
    try {
      // Mock available doctors
      const mockDoctors: Doctor[] = [
        {
          id: 'doc1',
          user: { firstName: 'Dr. Emily', lastName: 'Rodriguez' },
          speciality: { name: 'Internal Medicine' },
          consultation_fee: 200
        },
        {
          id: 'doc2',
          user: { firstName: 'Dr. Robert', lastName: 'Smith' },
          speciality: { name: 'Cardiology' },
          consultation_fee: 250
        }
      ];
      setAvailableDoctors(mockDoctors);
    } catch (error) {
      onError('Failed to fetch available doctors');
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDoctor) return;

    setLoadingSlots(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/consultations/available-slots?doctorId=${selectedDoctor.id}&date=${selectedDate.toISOString()}&duration=${duration}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setAvailableSlots(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch slots');
      }
    } catch (error) {
      onError('Failed to fetch available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const bookConsultation = async () => {
    if (!selectedDoctor || !selectedSlot) {
      onError('Please select a doctor and time slot');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          appointmentDate: selectedSlot.startTime.toISOString(),
          duration,
          consultationType,
          priority,
          reason,
          notes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to book consultation');
      }

      const data = await response.json();
      if (data.status === 'success') {
        onBookingComplete(data.data);
      } else {
        throw new Error(data.error || 'Failed to book consultation');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to book consultation');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const isPriorityUrgent = () => {
    return consultationType === 'emergency' || priority === 'emergency' || priority === 'high';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Video Consultation</h1>
        <p className="text-gray-600">Schedule a secure video appointment with your healthcare provider</p>
      </div>

      {/* Doctor Selection */}
      {!doctorId && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="mr-2 h-5 w-5" />
            Select Doctor
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {availableDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedDoctor?.id === doctor.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedDoctor(doctor)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {doctor.user.firstName} {doctor.user.lastName}
                    </h3>
                    <p className="text-gray-600 text-sm">{doctor.speciality?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${doctor.consultation_fee}</p>
                    <p className="text-gray-500 text-sm">consultation</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedDoctor && (
        <>
          {/* Selected Doctor Info */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">
                    {selectedDoctor.user.firstName[0]}{selectedDoctor.user.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                  </h3>
                  <p className="text-blue-600">{selectedDoctor.speciality?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">${selectedDoctor.consultation_fee}</p>
                <p className="text-gray-600">per consultation</p>
              </div>
            </div>
          </Card>

          {/* Consultation Type & Duration */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Video className="mr-2 h-5 w-5" />
              Consultation Details
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Type
                </label>
                <select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="scheduled">Scheduled Appointment</option>
                  <option value="followup">Follow-up Consultation</option>
                  <option value="second_opinion">Second Opinion</option>
                  <option value="emergency">Emergency Consultation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <div className="flex space-x-4">
                {(['low', 'medium', 'high', 'emergency'] as const).map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      value={level}
                      checked={priority === level}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="mr-2"
                    />
                    <span className={`capitalize ${
                      level === 'emergency' || level === 'high' ? 'text-red-600 font-medium' : ''
                    }`}>
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          {/* Date Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Select Date
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {getNextSevenDays().map((date, index) => {
                const isSelected = selectedDate.toDateString() === date.toDateString();
                const isToday = index === 0;
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-semibold">
                      {date.getDate()}
                    </div>
                    <div className="text-xs">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Time Slot Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Available Time Slots
              {loadingSlots && <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
            </h2>
            
            {loadingSlots ? (
              <div className="text-center py-8 text-gray-500">
                Loading available slots...
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No available slots for this date</p>
                <p className="text-sm text-gray-400">Please select a different date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => slot.available && setSelectedSlot(slot)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      selectedSlot === slot
                        ? 'bg-green-500 text-white'
                        : slot.available
                        ? 'bg-green-100 hover:bg-green-200 text-green-800'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium">
                      {formatTime(slot.startTime)}
                    </div>
                    <div className="text-xs">
                      {duration} min
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Reason and Notes */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Additional Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Consultation
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Follow-up on blood pressure medication"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any symptoms, concerns, or information the doctor should know..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </Card>

          {/* Booking Summary & Confirmation */}
          {selectedSlot && (
            <Card className="p-6 border-green-200 bg-green-50">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-green-800">
                <CheckCircle className="mr-2 h-5 w-5" />
                Booking Summary
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <p><strong>Doctor:</strong> {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}</p>
                  <p><strong>Speciality:</strong> {selectedDoctor.speciality?.name}</p>
                  <p><strong>Date:</strong> {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                  <p><strong>Time:</strong> {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}</p>
                </div>
                <div className="space-y-2">
                  <p><strong>Duration:</strong> {duration} minutes</p>
                  <p><strong>Type:</strong> {consultationType.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Priority:</strong> <span className={isPriorityUrgent() ? 'text-red-600 font-medium' : ''}>
                    {priority.toUpperCase()}
                  </span></p>
                  <p><strong>Fee:</strong> <span className="text-2xl font-bold text-green-600">
                    ${selectedDoctor.consultation_fee}
                  </span></p>
                </div>
              </div>

              {isPriorityUrgent() && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Urgent Consultation</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    This consultation has been marked as {priority}. You will be contacted shortly for confirmation.
                  </p>
                </div>
              )}

              <Button
                onClick={bookConsultation}
                disabled={isLoading}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Booking Consultation...
                  </div>
                ) : (
                  <>
                    <Phone className="mr-2 h-5 w-5" />
                    Book Video Consultation - ${selectedDoctor.consultation_fee}
                  </>
                )}
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}