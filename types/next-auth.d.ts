/**
 * Type definitions for NextAuth.js with Healthcare Management Platform extensions
 * Extends default NextAuth types to include healthcare-specific properties
 */

import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

// Healthcare user roles
type HealthcareRole = "DOCTOR" | "HSP" | "PATIENT" | "SYSTEM_ADMIN" | "HOSPITAL_ADMIN" | "CAREGIVER"

// Healthcare account status
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DEACTIVATED"

// Healthcare profile data types
interface DoctorProfile {
  id: string
  doctor_id: string
  medical_license_number: string
  speciality_id: string | null
  years_of_experience: number | null
  consultation_fee: number | null
  clinic_address: any
  organization_id: string | null
}

interface PatientProfile {
  id: string
  patient_id: string | null
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
   * Extended User interface for healthcare management
   */
  interface User extends DefaultUser {
    id: string
    role: HealthcareRole
    businessId: string | null
    profileId: string | null
    accountStatus: AccountStatus
    organizationId: string | null
    profileData: HealthcareProfileData
    emailVerified: boolean | null
    
    // Healthcare business logic permissions
    canPrescribeMedication: boolean
    canAccessPatientData: boolean
    canManageProviders: boolean
    canViewAllPatients: boolean
    
    // Audit trail
    lastLoginAt: Date | null
  }

  /**
   * Extended Session interface for healthcare management
   */
  interface Session extends DefaultSession {
    user: {
      id: string
      role: HealthcareRole
      businessId: string | null
      profileId: string | null
      accountStatus: AccountStatus
      organizationId: string | null
      profileData: HealthcareProfileData
      
      // Healthcare business logic permissions
      canPrescribeMedication: boolean
      canAccessPatientData: boolean
      canManageProviders: boolean
      canViewAllPatients: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT interface for healthcare management
   */
  interface JWT extends DefaultJWT {
    role: HealthcareRole
    businessId: string | null
    profileId: string | null
    accountStatus: AccountStatus
    organizationId: string | null
    profileData: HealthcareProfileData
    
    // Healthcare business logic permissions
    canPrescribeMedication: boolean
    canAccessPatientData: boolean
    canManageProviders: boolean
    canViewAllPatients: boolean
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