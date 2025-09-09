import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getInitials(firstName?: string, lastName?: string) {
  if (!firstName && !lastName) return 'U'
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}

export function getAdherenceColor(percentage: number) {
  if (percentage >= 90) return 'text-green-600 bg-green-100'
  if (percentage >= 70) return 'text-yellow-600 bg-yellow-100'
  return 'text-red-600 bg-red-100'
}

export function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return 'text-red-600 bg-red-100'
    case 'high':
      return 'text-orange-600 bg-orange-100'
    case 'medium':
      return 'text-yellow-600 bg-yellow-100'
    case 'low':
      return 'text-green-600 bg-green-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'scheduled':
      return 'text-green-600 bg-green-100'
    case 'pending':
    case 'in_progress':
      return 'text-yellow-600 bg-yellow-100'
    case 'cancelled':
    case 'missed':
    case 'expired':
      return 'text-red-600 bg-red-100'
    case 'paused':
    case 'inactive':
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-blue-600 bg-blue-100'
  }
}

// Validation functions for health data
export function validateCalories(calories: number | null | undefined): boolean {
  if (calories === null || calories === undefined) return true // Allow null/undefined
  return calories >= 0 && calories <= 9999.99
}

export function validateCaloriesBurned(caloriesBurned: number | null | undefined): boolean {
  if (caloriesBurned === null || caloriesBurned === undefined) return true // Allow null/undefined
  return caloriesBurned >= 0 && caloriesBurned <= 9999.99
}

export function getCaloriesValidationError(calories: number | null | undefined, fieldName = 'Calories'): string | null {
  if (calories === null || calories === undefined) return null
  if (calories < 0) return `${fieldName} cannot be negative`
  if (calories > 9999.99) return `${fieldName} cannot exceed 9,999.99`
  return null
}

// Appointment status validation
export const VALID_APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'no-show'] as const
export type AppointmentStatus = typeof VALID_APPOINTMENT_STATUSES[number]

export function validateAppointmentStatus(status: string | undefined | null): status is AppointmentStatus {
  if (!status) return false
  return VALID_APPOINTMENT_STATUSES.includes(status.toLowerCase() as AppointmentStatus)
}

export function sanitizeAppointmentStatus(status: string | undefined | null): AppointmentStatus {
  if (validateAppointmentStatus(status)) {
    return status.toLowerCase() as AppointmentStatus
  }
  return 'scheduled' // Default fallback
}