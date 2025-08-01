// types/auth.ts
export type UserRole = 
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

export interface User {
  id: string
  email: string
  role: UserRole
  account_status: AccountStatus
  first_name?: string
  last_name?: string
  middle_name?: string
  phone?: string
  date_of_birth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
  email_verified: boolean
  two_factor_enabled: boolean
  profile_picture_url?: string
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