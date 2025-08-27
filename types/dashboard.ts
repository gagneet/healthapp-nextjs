// types/dashboard.ts

export type ConsentStatus = 
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'REQUESTED'
  | 'GRANTED'
  | 'DENIED'
  | 'EXPIRED'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  mobileNumber?: string
  dateOfBirth?: string
  gender?: string
  profilePictureUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface Patient {
  id: string
  userId: string
  organizationId?: string
  medicalRecordNumber?: string
  patientId?: string
  
  patientType?: 'M' | 'R'
  patientTypeLabel?: string
  accessType?: 'primary' | 'secondary'
  requiresConsent?: boolean
  consentStatus?: ConsentStatus
  accessGranted?: boolean
  canView?: boolean
  sameProvider?: boolean
  assignmentId?: string
  assignmentReason?: string
  specialtyFocus?: string[]
  primaryDoctorProvider?: string
  secondaryDoctorProvider?: string
  emergencyContacts?: Array<{
    name: string
    relationship: string
    phone: string
    email?: string
    primary?: boolean
  }>
  insuranceInformation?: Record<string, any>
  medicalHistory?: Array<{
    condition: string
    diagnosedDate?: string
    status: 'active' | 'resolved' | 'chronic'
    notes?: string
  }>
  allergies?: Array<{
    name: string
    allergen: string
    reaction?: string
    severity: 'mild' | 'moderate' | 'severe'
  }>
  currentMedications?: Array<Record<string, any>>
  heightCm?: number
  weightKg?: number
  bloodType?: string
  primaryLanguage?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  riskFactors?: Array<string>
  communicationPreferences?: {
    preferredContactMethod: 'email' | 'phone' | 'sms'
    appointmentReminders: boolean
    medicationReminders: boolean
    healthTips: boolean
    researchParticipation: boolean
    language: string
    timeZone: string
  }
  privacySettings?: {
    shareWithFamily: boolean
    shareForResearch: boolean
    marketingCommunications: boolean
    dataSharingConsent: boolean
    providerDirectoryListing: boolean
  }
  primaryCareDoctorId?: string
  primaryCareHspId?: string
  careCoordinatorId?: string
  careCoordinatorType?: 'doctor' | 'hsp'
  overallAdherenceScore?: number
  lastAdherenceCalculation?: string
  totalAppointments?: number
  missedAppointments?: number
  lastVisitDate?: string
  nextAppointmentDate?: string
  bmi?: number
  isActive?: boolean
  requiresInterpreter?: boolean
  hasMobilityIssues?: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  linkedProviderId?: string
  providerLinkedAt?: string
  providerConsentGiven?: boolean
  providerConsentGivenAt?: string
  providerConsentMethod?: 'sms' | 'email' | 'in_person' | 'phone' | 'automatic'
  user?: User
  assignedDoctor?: string
  assignedHsp?: string
  department?: string
  
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  adherenceRate?: number
  criticalAlerts?: number
  status?: string
  lastVisit?: string
  nextAppointment?: string
  profilePictureUrl?: string
}

export interface AdherenceMetrics {
  overallRate: number
  medications: number
  appointments: number
  vitals: number
  diet: number
  exercise: number
  lastUpdated: string
}

export interface DashboardStats {
  totalPatients: number
  activePatients: number
  criticalAlerts: number
  appointmentsToday: number
  medicationAdherence: number
  vitalReadingsPending: number
}

export interface CriticalAlert {
  id: string
  patientId: string
  patientName: string
  type: 'medication' | 'vital' | 'appointment' | 'symptom'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  createdAt: string
  acknowledged: boolean
}

export interface RecentActivity {
  id: string
  patientId: string
  patientName: string
  type: 'medication' | 'vital' | 'appointment' | 'symptom' | 'care_plan'
  action: string
  timestamp: string
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface CarePlan {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  priority: 'critical' | 'high' | 'medium' | 'low'
  startDate: string
  endDate?: string
  medicationsCount: number
  vitalsCount: number
  appointmentsCount: number
}

export interface Medicine {
  id: string
  name: string
  genericName?: string
  brandNames: string[]
  strength?: string
  form: string
  routeOfAdministration: string[]
  therapeuticClass?: string
  contraindications: string[]
  sideEffects: string[]
  interactions: string[]
  storageInstructions?: string
  isPrescription: boolean
  controlledSubstance?: boolean
  createdAt: string
  updatedAt: string
}

export interface Medication {
  id: string
  participantId: string
  organizerType?: 'doctor' | 'patient' | 'care_taker' | 'hsp' | 'provider' | 'admin'
  organizerId: string
  medicineId: string
  description?: string
  startDate?: string
  endDate?: string
  rrRule?: string
  details: {
    dosage?: string
    frequency?: string
    instructions?: string
    route?: string
    [key: string]: any
  }
  frequency?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  medicine?: Medicine
  name?: string
  dosage?: string
  isCritical?: boolean
  adherenceRate?: number
  lastTaken?: string
  nextDue?: string
}

export interface VitalReading {
  id: string
  type: string
  value: number
  unit: string
  readingTime: string
  isFlagged: boolean
  normalRange: {
    min?: number
    max?: number
  }
}

export interface Appointment {
  id: string
  title: string
  type: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  isVirtual: boolean
  notes?: string
}

export interface Symptom {
  id: string
  name: string
  severity: number
  description?: string
  onsetTime?: string
  recordedAt: string
  bodyLocation?: Record<string, any>
}

export interface MedicationLog {
  id: string
  medicationId: string
  patientId: string
  scheduledAt: string
  takenAt?: string
  dosageTaken?: string
  notes?: string
  adherenceStatus: 'taken' | 'missed' | 'late' | 'partial'
  reminderSent: boolean
  createdAt: string
  updatedAt: string
  medication?: Medication
  patient?: Patient
}

export interface PatientAlert {
  id: string
  patientId: string
  alertType: 'medication' | 'vital' | 'appointment' | 'symptom' | 'system'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  actionRequired: boolean
  acknowledged: boolean
  acknowledgedAt?: string
  acknowledgedBy?: string
  resolved: boolean
  resolvedAt?: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
  patient?: Patient
}

export interface DashboardMetric {
  id: string
  entityType: 'patient' | 'doctor' | 'organization' | 'system'
  entityId: string
  metricType: string
  metricData: Record<string, any>
  calculatedAt: string
  validUntil?: string
  createdAt: string
  updatedAt: string
}

export interface PatientProviderConsentHistory {
  id: string
  patientId: string
  previousProviderId?: string
  newProviderId: string
  doctorId?: string
  hspId?: string
  consentRequired: boolean
  consentRequested: boolean
  consentRequestedAt?: string
  consentGiven: boolean
  consentGivenAt?: string
  consentMethod?: 'sms' | 'email' | 'in_person' | 'phone' | 'automatic'
  consentToken?: string
  consentTokenExpiresAt?: string
  consentVerified: boolean
  consentDenied: boolean
  consentDeniedAt?: string
  reason?: string
  initiatedBy?: string
  status: 'pending' | 'consent_requested' | 'approved' | 'denied' | 'expired' | 'completed'
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ProviderChangeHistory {
  id: string
  practitionerType: 'doctor' | 'hsp'
  practitionerId: string
  previousProviderId?: string
  newProviderId: string
  changeDate: string
  affectedPatientsCount: number
  consentRequiredCount: number
  consentObtainedCount: number
  reason?: string
  status: 'active' | 'processing' | 'completed'
  createdAt: string
  updatedAt: string
}