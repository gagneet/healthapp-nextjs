/**
 * Type definitions for NextAuth.js with Healthcare Management Platform extensions
 * Auth.js v5 compatible with backward compatibility for legacy fields
 * Migration-safe: supports both new and legacy field names during transition
 */

import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

// Healthcare user roles
type HealthcareRole = "DOCTOR" | "HSP" | "PATIENT" | "SYSTEM_ADMIN" | "HOSPITAL_ADMIN" | "CAREGIVER"

// Healthcare account status
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DEACTIVATED"

// Healthcare profile data types
interface DoctorProfile {
  id: string
  doctorId: string
  medical_license_number: string
  speciality_id: string | null
  years_of_experience: number | null
  consultation_fee: number | null
  clinic_address: any
  organization_id: string | null
}

interface PatientProfile {
  id: string
  patientId: string | null
  medical_record_number: string | null
  primary_doctor_id: string | null
  height: number | null
  weight: number | null
  blood_type: string | null
}

interface HSPProfile {
  id: string
  hsp_id: string
  hsp_type: string
  license_number: string | null
  years_of_experience: number | null
  certifications: any
  organization_id: string | null
}

interface ProviderProfile {
  id: string
  organization_id: string | null
  provider_type: string | null
  license_number: string | null
}

type HealthcareProfileData = DoctorProfile | PatientProfile | HSPProfile | ProviderProfile | null

declare module "next-auth" {
  /**
   * Extended User interface for healthcare management - Auth.js v5 compatible
   */
  interface User extends DefaultUser {
    // ✅ Auth.js v5 standard fields
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    emailVerified?: Date | null
    
    // ✅ Healthcare-specific fields
    role: HealthcareRole
    businessId?: string | null
    profileId?: string | null
    accountStatus: AccountStatus
    organizationId?: string | null
    profileData?: HealthcareProfileData
    
    // ✅ Healthcare business logic permissions
    canPrescribeMedication: boolean
    canAccessPatientData: boolean
    canManageProviders: boolean
    canViewAllPatients: boolean
    
    // ✅ LEGACY FIELDS - Keep for backward compatibility during transition
    /** @deprecated Use name instead */
    full_name?: string
    /** @deprecated Use image instead */
    profile_picture_url?: string
    /** @deprecated Use name.split(' ')[0] instead */
    first_name?: string
    /** @deprecated Use name.split(' ').slice(1).join(' ') instead */
    last_name?: string
    
    // Audit trail
    lastLoginAt?: Date | null
  }

  /**
   * Extended Session interface for healthcare management - Auth.js v5 compatible
   */
  interface Session extends DefaultSession {
    user: {
      // ✅ Auth.js v5 standard fields
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      emailVerified?: Date | null
      
      // ✅ Healthcare-specific extensions
      role: HealthcareRole
      businessId?: string | null
      profileId?: string | null
      accountStatus: AccountStatus
      organizationId?: string | null
      profileData?: HealthcareProfileData
      
      // ✅ Healthcare business logic flags
      canPrescribeMedication: boolean
      canAccessPatientData: boolean
      canManageProviders: boolean
      canViewAllPatients: boolean
      
      // ✅ LEGACY FIELDS - Keep for backward compatibility during transition
      /** @deprecated Use name instead */
      full_name?: string
      /** @deprecated Use image instead */
      profile_picture_url?: string
      /** @deprecated Use name.split(' ')[0] instead */
      first_name?: string
      /** @deprecated Use name.split(' ').slice(1).join(' ') instead */
      last_name?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT interface for healthcare management - Auth.js v5 compatible
   */
  interface JWT {
    // ✅ Auth.js v5 standard fields
    id?: string
    name?: string | null
    email?: string | null
    picture?: string | null
    
    // ✅ Healthcare-specific fields
    role?: HealthcareRole
    businessId?: string | null
    profileId?: string | null
    accountStatus?: AccountStatus
    organizationId?: string | null
    profileData?: HealthcareProfileData
    canPrescribeMedication?: boolean
    canAccessPatientData?: boolean
    canManageProviders?: boolean
    canViewAllPatients?: boolean
    
    // ✅ Session management
    lastActivity?: number
    
    // Standard JWT fields
    sub?: string
    iat?: number
    exp?: number
    jti?: string
  }
}

// Healthcare-specific error types
export interface HealthcareAuthError {
  type: "ACCOUNT_INACTIVE" | "ROLE_MISMATCH" | "PROFILE_INCOMPLETE" | "PERMISSION_DENIED"
  message: string
  details?: any
}

// Permission checking utility types
export interface HealthcarePermissions {
  canPrescribeMedication: boolean
  canAccessPatientData: boolean
  canManageProviders: boolean
  canViewAllPatients: boolean
  canAddMedications: boolean
  canViewVitals: boolean
  canScheduleAppointments: boolean
  canManageCareTeam: boolean
}

// Business logic validation types
export interface BusinessLogicValidation {
  doctorCanManagePatient: (doctorId: string, patientId: string) => boolean
  hspCanAccessPatient: (hspId: string, patientId: string) => boolean
  providerCanManageDoctor: (providerId: string, doctorId: string) => boolean
  patientCanViewOwnData: (userId: string, patientId: string) => boolean
}