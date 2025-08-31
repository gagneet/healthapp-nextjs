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

/**
 * Calculates the adherence rate from an array of records.
 * @param records An array of objects with an `isCompleted` boolean property.
 * @returns The adherence rate as a percentage (0-100).
 */
export const calculateAdherenceRate = (records: Array<{ isCompleted: boolean | null }>): number => {
  if (!records || records.length === 0) {
    return 0;
  }
  const total = records.length;
  const completed = records.filter(r => r.isCompleted).length;
  return Math.round((completed / total) * 100);
};