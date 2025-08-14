/**
 * Healthcare Auth Types - Auth.js v5 Compatible
 * Migration-safe: supports both new and legacy field names during transition
 */

export type HealthcareRole = 
  | 'SYSTEM_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DOCTOR'
  | 'HSP'
  | 'NURSE'
  | 'PATIENT'
  | 'CAREGIVER'

export type AccountStatus = 
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED'

// ✅ Unified user type with Auth.js v5 compatibility
export interface HealthcareUser {
  // Auth.js v5 standard fields
  id: string
  name: string | null
  email: string | null
  image: string | null
  emailVerified: Date | null
  
  // Healthcare-specific fields
  role: HealthcareRole
  businessId: string | null
  profileId: string | null
  accountStatus: AccountStatus
  organizationId: string | null
  profileData: any
  
  // Healthcare permissions
  canPrescribeMedication: boolean
  canAccessPatientData: boolean
  canManageProviders: boolean
  canViewAllPatients: boolean
}

// ✅ Legacy compatibility fields
export interface LegacyUserFields {
  /** @deprecated Use name instead */
  full_name?: string
  /** @deprecated Use image instead */
  profile_picture_url?: string
  /** @deprecated Use name.split(' ')[0] instead */
  first_name?: string
  /** @deprecated Use name.split(' ').slice(1).join(' ') instead */
  last_name?: string
  /** @deprecated Use emailVerified instead */
  email_verified?: boolean
}

// ✅ Combined type for transition period
export type TransitionUser = HealthcareUser & LegacyUserFields

// ✅ Helper functions for backward compatibility
export const userHelpers = {
  // Get display name with fallback
  getDisplayName: (user: TransitionUser | null): string => {
    if (!user) return 'User'
    return user.name || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'User'
  },
  
  // Get profile image with fallback
  getProfileImage: (user: TransitionUser | null): string | null => {
    if (!user) return null
    return user.image || user.profile_picture_url || null
  },
  
  // Get first name with fallback
  getFirstName: (user: TransitionUser | null): string => {
    if (!user) return 'User'
    return user.first_name || user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User'
  },
  
  // Get last name with fallback
  getLastName: (user: TransitionUser | null): string => {
    if (!user) return ''
    return user.last_name || user.name?.split(' ').slice(1).join(' ') || ''
  },
  
  // Check if email is verified
  isEmailVerified: (user: TransitionUser | null): boolean => {
    if (!user) return false
    return !!user.emailVerified || !!user.email_verified
  }
}

// ✅ Legacy interface for backward compatibility
export interface User extends LegacyUserFields {
  id: string
  email: string
  role: HealthcareRole
  account_status: AccountStatus
  middle_name?: string
  phone?: string
  date_of_birth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
  two_factor_enabled: boolean
  timezone: string
  locale: string
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  role: UserRole
  first_name: string
  last_name: string
  phone?: string
  organization_code?: string
  terms_accepted: boolean
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    token: string
    expires_in: number
  }
  message?: string
  errors?: Record<string, string[]>
}