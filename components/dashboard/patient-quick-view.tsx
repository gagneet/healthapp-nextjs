'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Link from 'next/link'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckIcon,
  CalendarIcon,
  BeakerIcon,
  HeartIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline'
import { Patient } from '@/types/dashboard'
import { formatDate, formatDateTime, getInitials, getAdherenceColor } from '@/lib/utils'

interface PatientQuickViewProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  patient: Patient | null
}

interface MissedItem {
  id: string
  type: 'medication' | 'vital' | 'appointment' | 'diet' | 'workout'
  name: string
  dueTime: string
  severity: 'critical' | 'important' | 'normal'
  description?: string
}

interface CurrentMedication {
  id: string
  name: string
  dosage: string
  nextDue: string
  isOverdue: boolean
  reminderTime: string
}

// Mock data - replace with actual API calls
const mockMissedItems: MissedItem[] = [
  {
    id: '1',
    type: 'medication',
    name: 'Lisinopril 10mg',
    dueTime: '2024-01-22T08:00:00Z',
    severity: 'critical',
    description: 'Blood pressure medication - daily dose'
  },
  {
    id: '2',
    type: 'vital',
    name: 'Blood Pressure Reading',
    dueTime: '2024-01-22T09:00:00Z',
    severity: 'important',
    description: 'Morning BP check'
  },
  {
    id: '3',
    type: 'diet',
    name: 'Low Sodium Breakfast',
    dueTime: '2024-01-22T07:30:00Z',
    severity: 'normal',
    description: 'Heart-healthy breakfast plan'
  },
  {
    id: '4',
    type: 'workout',
    name: '30-min Walk',
    dueTime: '2024-01-21T18:00:00Z',
    severity: 'important',
    description: 'Evening cardio exercise'
  },
]

const mockCurrentMedications: CurrentMedication[] = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    nextDue: '2024-01-23T08:00:00Z',
    isOverdue: false,
    reminderTime: '8:00 AM daily'
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    nextDue: '2024-01-22T20:00:00Z',
    isOverdue: true,
    reminderTime: '8:00 AM & 8:00 PM daily'
  },
  {
    id: '3',
    name: 'Atorvastatin',
    dosage: '20mg',
    nextDue: '2024-01-23T22:00:00Z',
    isOverdue: false,
    reminderTime: '10:00 PM daily'
  },
]

const upcomingAppointments = [
  {
    id: '1',
    title: 'Follow-up Consultation',
    date: '2024-02-01T10:00:00Z',
    type: 'in-person'
  },
  {
    id: '2',
    title: 'Blood Work Review',
    date: '2024-01-25T14:00:00Z',
    type: 'virtual'
  },
]

function getTypeIcon(type: string) {
  switch (type) {
    case 'medication':
      return Square3Stack3DIcon
    case 'vital':
      return HeartIcon
    case 'appointment':
      return CalendarIcon
    case 'diet':
      return BeakerIcon
    case 'workout':
      return ClockIcon
    default:
      return ExclamationTriangleIcon
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 border-red-200 text-red-900'
    case 'important':
      return 'bg-yellow-50 border-yellow-200 text-yellow-900'
    default:
      return 'bg-blue-50 border-blue-200 text-blue-900'
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'important':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

export default function PatientQuickView({ isOpen, setIsOpen, patient }: PatientQuickViewProps) {
  if (!patient) return null

  const criticalMissed = mockMissedItems.filter(item => item.severity === 'critical')
  const nonCriticalMissed = mockMissedItems.filter(item => item.severity !== 'critical')

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-blue-600 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {getInitials(patient.first_name, patient.last_name)}
                            </span>
                          </div>
                          <div>
                            <Dialog.Title className="text-lg font-medium text-white">
                              {patient.first_name} {patient.last_name}
                            </Dialog.Title>
                            <p className="text-sm text-blue-100">
                              {patient.medical_record_number}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded-md bg-blue-600 text-blue-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                          onClick={() => setIsOpen(false)}
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative flex-1 px-4 py-6 sm:px-6">
                      {/* Patient Stats */}
                      <div className="mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500">Adherence Rate</p>
                            <p className={`text-lg font-bold ${
                              patient.adherence_rate >= 85 ? 'text-green-600' : 
                              patient.adherence_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {patient.adherence_rate}%
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500">Critical Alerts</p>
                            <p className="text-lg font-bold text-red-600">{patient.critical_alerts}</p>
                          </div>
                        </div>
                      </div>

                      {/* Critical Missed Items */}
                      {criticalMissed.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-red-700 mb-3 flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                            Critical Missed ({criticalMissed.length})
                          </h3>
                          <div className="space-y-2">
                            {criticalMissed.map((item) => {
                              const Icon = getTypeIcon(item.type)
                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded-lg border ${getSeverityColor(item.severity)}`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-2">
                                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs opacity-75">
                                          Missed: {formatDateTime(item.dueTime)}
                                        </p>
                                        {item.description && (
                                          <p className="text-xs opacity-75 mt-1">{item.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Non-Critical Missed Items */}
                      {nonCriticalMissed.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            Other Missed ({nonCriticalMissed.length})
                          </h3>
                          <div className="space-y-2">
                            {nonCriticalMissed.map((item) => {
                              const Icon = getTypeIcon(item.type)
                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded-lg border ${getSeverityColor(item.severity)}`}
                                >
                                  <div className="flex items-start space-x-2">
                                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getSeverityBadge(item.severity)}`}>
                                          {item.severity}
                                        </span>
                                      </div>
                                      <p className="text-xs opacity-75">
                                        Missed: {formatDateTime(item.dueTime)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Current Medications */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <Square3Stack3DIcon className="h-4 w-4 mr-2" />
                          Current Medications
                        </h3>
                        <div className="space-y-2">
                          {mockCurrentMedications.map((med) => (
                            <div
                              key={med.id}
                              className={`p-3 rounded-lg border ${
                                med.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {med.name} {med.dosage}
                                  </p>
                                  <p className="text-xs text-gray-500">{med.reminderTime}</p>
                                </div>
                                <div className="text-right">
                                  {med.isOverdue ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Overdue
                                    </span>
                                  ) : (
                                    <p className="text-xs text-gray-500">
                                      Next: {formatDateTime(med.nextDue)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Upcoming Appointments */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Upcoming Appointments
                        </h3>
                        <div className="space-y-2">
                          {upcomingAppointments.map((appointment) => (
                            <div key={appointment.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{appointment.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatDateTime(appointment.date)}
                                  </p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                  appointment.type === 'virtual' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {appointment.type}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="space-y-3">
                          <Link
                            href={`/dashboard/doctor/patients/${patient.id}`}
                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => setIsOpen(false)}
                          >
                            View Full Patient Details
                          </Link>
                          <button
                            type="button"
                            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Send Reminder
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}