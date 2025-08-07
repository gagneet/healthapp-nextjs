// types/dashboard.ts

export type ConsentStatus = 
  | 'not_required' 
  | 'pending' 
  | 'requested' 
  | 'granted' 
  | 'denied' 
  | 'expired'

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: string
  profile_picture_url?: string
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  user_id: string
  organization_id?: string
  medical_record_number?: string
  patient_id?: string
  
  // Consent workflow fields
  patient_type?: 'M' | 'R' // Main/Primary or Referred/Secondary
  patient_type_label?: string
  access_type?: 'primary' | 'secondary'
  requires_consent?: boolean
  consent_status?: ConsentStatus
  access_granted?: boolean
  can_view?: boolean
  same_provider?: boolean
  assignment_id?: string
  assignment_reason?: string
  specialty_focus?: string[]
  primary_doctor_provider?: string
  secondary_doctor_provider?: string
  emergency_contacts: Array<{
    name: string
    relationship: string
    phone: string
    email?: string
    primary?: boolean
  }>
  insurance_information: Record<string, any>
  medical_history: Array<{
    condition: string
    diagnosed_date?: string
    status: 'active' | 'resolved' | 'chronic'
    notes?: string
  }>
  allergies: Array<{
    name: string
    allergen: string
    reaction?: string
    severity: 'mild' | 'moderate' | 'severe'
  }>
  current_medications: Array<Record<string, any>>
  height_cm?: number
  weight_kg?: number
  blood_type?: string
  primary_language: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: Array<string>
  communication_preferences: {
    preferred_contact_method: 'email' | 'phone' | 'sms'
    appointment_reminders: boolean
    medication_reminders: boolean
    health_tips: boolean
    research_participation: boolean
    language: string
    time_zone: string
  }
  privacy_settings: {
    share_with_family: boolean
    share_for_research: boolean
    marketing_communications: boolean
    data_sharing_consent: boolean
    provider_directory_listing: boolean
  }
  primary_care_doctor_id?: string
  primary_care_hsp_id?: string
  care_coordinator_id?: string
  care_coordinator_type?: 'doctor' | 'hsp'
  overall_adherence_score?: number
  last_adherence_calculation?: string
  total_appointments: number
  missed_appointments: number
  last_visit_date?: string
  next_appointment_date?: string
  bmi?: number
  is_active: boolean
  requires_interpreter: boolean
  has_mobility_issues: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  // Provider linkage and consent tracking
  linked_provider_id?: string
  provider_linked_at?: string
  provider_consent_given: boolean
  provider_consent_given_at?: string
  provider_consent_method?: 'sms' | 'email' | 'in_person' | 'phone' | 'automatic'
  // Navigation/computed fields for frontend
  user?: User
  assigned_doctor?: string
  assigned_hsp?: string
  department?: string
  
  // Legacy fields for compatibility
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  adherence_rate?: number
  critical_alerts?: number
  status?: string
  last_visit?: string
  next_appointment?: string
}

export interface AdherenceMetrics {
  overall_rate: number
  medications: number
  appointments: number
  vitals: number
  diet: number
  exercise: number
  last_updated: string
}

export interface DashboardStats {
  total_patients: number
  active_patients: number
  critical_alerts: number
  appointments_today: number
  medication_adherence: number
  vital_readings_pending: number
}

export interface CriticalAlert {
  id: string
  patient_id: string
  patient_name: string
  type: 'medication' | 'vital' | 'appointment' | 'symptom'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  created_at: string
  acknowledged: boolean
}

export interface RecentActivity {
  id: string
  patient_id: string
  patient_name: string
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
  start_date: string
  end_date?: string
  medications_count: number
  vitals_count: number
  appointments_count: number
}

export interface Medicine {
  id: string
  name: string
  generic_name?: string
  brand_names: string[]
  strength?: string
  form: string
  route_of_administration: string[]
  therapeutic_class?: string
  contraindications: string[]
  side_effects: string[]
  interactions: string[]
  storage_instructions?: string
  is_prescription: boolean
  controlled_substance?: boolean
  created_at: string
  updated_at: string
}

export interface Medication {
  id: string
  participant_id: string
  organizer_type?: 'doctor' | 'patient' | 'care_taker' | 'hsp' | 'provider' | 'admin'
  organizer_id: string
  medicine_id: string
  description?: string
  start_date?: string
  end_date?: string
  rr_rule?: string
  details: {
    dosage?: string
    frequency?: string
    instructions?: string
    route?: string
    [key: string]: any
  }
  frequency?: string // Virtual field from details.frequency
  created_at: string
  updated_at: string
  deleted_at?: string
  // Relations for frontend
  medicine?: Medicine
  // Computed fields for compatibility
  name?: string
  dosage?: string
  is_critical?: boolean
  adherence_rate?: number
  last_taken?: string
  next_due?: string
}

export interface VitalReading {
  id: string
  type: string
  value: number
  unit: string
  reading_time: string
  is_flagged: boolean
  normal_range: {
    min?: number
    max?: number
  }
}

export interface Appointment {
  id: string
  title: string
  type: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  is_virtual: boolean
  notes?: string
}

export interface Symptom {
  id: string
  name: string
  severity: number
  description?: string
  onset_time?: string
  recorded_at: string
  body_location?: Record<string, any>
}

export interface MedicationLog {
  id: string
  medication_id: string
  patient_id: string
  scheduled_at: string
  taken_at?: string
  dosage_taken?: string
  notes?: string
  adherence_status: 'taken' | 'missed' | 'late' | 'partial'
  reminder_sent: boolean
  created_at: string
  updated_at: string
  // Relations
  medication?: Medication
  patient?: Patient
}

export interface PatientAlert {
  id: string
  patient_id: string
  alert_type: 'medication' | 'vital' | 'appointment' | 'symptom' | 'system'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  action_required: boolean
  acknowledged: boolean
  acknowledged_at?: string
  acknowledged_by?: string
  resolved: boolean
  resolved_at?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
}

export interface DashboardMetric {
  id: string
  entity_type: 'patient' | 'doctor' | 'organization' | 'system'
  entity_id: string
  metric_type: string
  metric_data: Record<string, any>
  calculated_at: string
  valid_until?: string
  created_at: string
  updated_at: string
}

export interface PatientProviderConsentHistory {
  id: string
  patient_id: string
  previous_provider_id?: string
  new_provider_id: string
  doctor_id?: string
  hsp_id?: string
  consent_required: boolean
  consent_requested: boolean
  consent_requested_at?: string
  consent_given: boolean
  consent_given_at?: string
  consent_method?: 'sms' | 'email' | 'in_person' | 'phone' | 'automatic'
  consent_token?: string
  consent_token_expires_at?: string
  consent_verified: boolean
  consent_denied: boolean
  consent_denied_at?: string
  reason?: string
  initiated_by?: string
  status: 'pending' | 'consent_requested' | 'approved' | 'denied' | 'expired' | 'completed'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProviderChangeHistory {
  id: string
  practitioner_type: 'doctor' | 'hsp'
  practitioner_id: string
  previous_provider_id?: string
  new_provider_id: string
  change_date: string
  affected_patients_count: number
  consent_required_count: number
  consent_obtained_count: number
  reason?: string
  status: 'active' | 'processing' | 'completed'
  created_at: string
  updated_at: string
}