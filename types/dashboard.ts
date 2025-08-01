// types/dashboard.ts
export interface Patient {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: string
  profile_picture_url?: string
  medical_record_number?: string
  last_visit?: string
  next_appointment?: string
  adherence_rate: number
  critical_alerts: number
  status: 'active' | 'inactive' | 'pending'
  created_at: string
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

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  start_date: string
  end_date?: string
  is_critical: boolean
  adherence_rate: number
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