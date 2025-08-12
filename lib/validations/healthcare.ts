/**
 * Healthcare Data Validation Schemas
 * Zod validation schemas for healthcare management platform following medical standards
 */

import { z } from "zod"

// Healthcare User Roles
export const HealthcareRole = z.enum([
  "DOCTOR",
  "HSP", 
  "PATIENT",
  "SYSTEM_ADMIN",
  "HOSPITAL_ADMIN"
])

export const AccountStatus = z.enum([
  "ACTIVE",
  "INACTIVE", 
  "SUSPENDED",
  "PENDING_VERIFICATION"
])

// User Authentication Schemas
export const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: HealthcareRole.optional()
})

export const SignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: HealthcareRole,
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format").optional(),
  dateOfBirth: z.string().pipe(z.coerce.date()).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Patient Management Schemas
export const PatientSchema = z.object({
  // User Information
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
  dateOfBirth: z.string().pipe(z.coerce.date({ message: "Invalid date of birth" })),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  
  // Medical Information
  height: z.number().min(20).max(300).optional(), // cm
  weight: z.number().min(1).max(1000).optional(), // kg
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  
  // Healthcare Provider Assignment
  primaryDoctorId: z.string().uuid("Invalid doctor ID").optional(),
  
  // Medical History
  medicalHistory: z.array(z.object({
    condition: z.string(),
    diagnosedDate: z.string().pipe(z.coerce.date()).optional(),
    status: z.enum(["ACTIVE", "RESOLVED", "CHRONIC"]).default("ACTIVE")
  })).default([]),
  
  // Allergies
  allergies: z.array(z.object({
    allergen: z.string(),
    severity: z.enum(["MILD", "MODERATE", "SEVERE"]),
    reaction: z.string().optional()
  })).default([]),
  
  // Emergency Contact
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
    email: z.string().email().optional()
  }).optional(),
  
  // Insurance Details
  insuranceDetails: z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    groupNumber: z.string().optional()
  }).optional()
})

export const UpdatePatientSchema = PatientSchema.partial().omit({ email: true })

// Doctor Management Schemas
export const DoctorSchema = z.object({
  // User Information
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
  
  // Professional Information
  medicalLicenseNumber: z.string().min(1, "Medical license number is required"),
  specialityId: z.string().uuid("Invalid speciality ID").optional(),
  yearsOfExperience: z.number().min(0).max(70).optional(),
  consultationFee: z.number().min(0).optional(),
  
  // Clinic Information
  clinicAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default("US")
  }).optional(),
  
  // Organization Assignment
  organizationId: z.string().uuid("Invalid organization ID").optional(),
  
  // Credentials and Certifications
  credentials: z.array(z.string()).default([]),
  boardCertifications: z.array(z.object({
    board: z.string(),
    certification: z.string(),
    expiryDate: z.string().pipe(z.coerce.date()).optional()
  })).default([])
})

export const UpdateDoctorSchema = DoctorSchema.partial().omit({ email: true })

// HSP (Health Service Provider) Schemas
export const HSPSchema = z.object({
  // User Information
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
  
  // Professional Information
  hspType: z.enum(["NURSE", "THERAPIST", "TECHNICIAN", "NUTRITIONIST", "OTHER"]),
  licenseNumber: z.string().optional(),
  yearsOfExperience: z.number().min(0).max(70).optional(),
  
  // Certifications
  certifications: z.array(z.string()).default([]),
  
  // Organization Assignment
  organizationId: z.string().uuid("Invalid organization ID").optional()
})

export const UpdateHSPSchema = HSPSchema.partial().omit({ email: true })

// Medication Management Schemas
export const MedicationSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  medicationId: z.string().uuid("Invalid medication ID"),
  prescribedBy: z.string().uuid("Invalid doctor ID"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  route: z.enum(["ORAL", "INJECTION", "TOPICAL", "INHALATION", "OTHER"]).default("ORAL"),
  startDate: z.string().pipe(z.coerce.date({ message: "Invalid start date" })),
  endDate: z.string().pipe(z.coerce.date({ message: "Invalid end date" })).optional(),
  instructions: z.string().optional(),
  
  // Safety Information
  checkInteractions: z.boolean().default(true),
  checkAllergies: z.boolean().default(true)
})

export const UpdateMedicationSchema = MedicationSchema.partial()

// Vital Signs Schemas
export const VitalSignSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  vitalType: z.enum([
    "BLOOD_PRESSURE",
    "HEART_RATE", 
    "TEMPERATURE",
    "RESPIRATORY_RATE",
    "OXYGEN_SATURATION",
    "BLOOD_GLUCOSE",
    "WEIGHT",
    "HEIGHT",
    "BMI"
  ]),
  valuePrimary: z.number({ message: "Primary value is required" }),
  valueSecondary: z.number().optional(), // For blood pressure diastolic
  unit: z.string().min(1, "Unit is required"),
  measuredAt: z.string().pipe(z.coerce.date({ message: "Invalid measurement date" })),
  measurementMethod: z.enum(["MANUAL", "DEVICE", "ESTIMATED"]).default("MANUAL"),
  deviceId: z.string().optional(),
  notes: z.string().optional()
})

// Appointment Schemas
export const AppointmentSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  doctorId: z.string().uuid("Invalid doctor ID"),
  appointmentType: z.enum([
    "CONSULTATION",
    "FOLLOW_UP", 
    "EMERGENCY",
    "ROUTINE_CHECKUP",
    "MEDICATION_REVIEW",
    "VITAL_CHECK",
    "TELEHEALTH"
  ]),
  scheduledDate: z.string().pipe(z.coerce.date({ message: "Invalid appointment date" })),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  durationMinutes: z.number().min(15).max(480).default(30),
  isVirtual: z.boolean().default(false),
  meetingLink: z.string().url().optional(),
  chiefComplaint: z.string().optional(),
  appointmentNotes: z.string().optional()
})

export const UpdateAppointmentSchema = z.object({
  status: z.enum([
    "SCHEDULED",
    "CONFIRMED", 
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
    "RESCHEDULED"
  ]).optional(),
  appointmentNotes: z.string().optional(),
  outcomeSummary: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().pipe(z.coerce.date()).optional()
})

// Care Plan Schemas
export const CarePlanSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  primaryDoctorId: z.string().uuid("Invalid doctor ID"),
  planName: z.string().min(1, "Plan name is required"),
  primaryDiagnosis: z.string().optional(),
  icd10Codes: z.array(z.string()).default([]),
  treatmentGoals: z.array(z.object({
    goal: z.string(),
    targetDate: z.string().pipe(z.coerce.date()).optional(),
    status: z.enum(["ACTIVE", "ACHIEVED", "MODIFIED", "DISCONTINUED"]).default("ACTIVE")
  })).default([]),
  startDate: z.string().pipe(z.coerce.date({ message: "Invalid start date" })),
  endDate: z.string().pipe(z.coerce.date()).optional(),
  planDetails: z.object({
    care_plans: z.array(z.string()).optional(),
    procedures: z.array(z.string()).optional(),
    lifestyle: z.object({
      diet: z.string().optional(),
      exercise: z.string().optional(),
      restrictions: z.array(z.string()).optional()
    }).optional()
  }).optional()
})

// Symptoms and Diagnosis Schemas
export const SymptomSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  symptoms: z.array(z.object({
    name: z.string().min(1, "Symptom name is required"),
    severity: z.enum(["MILD", "MODERATE", "SEVERE"]),
    duration: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional()
  })).min(1, "At least one symptom is required"),
  onsetDate: z.string().pipe(z.coerce.date()).optional(),
  additionalNotes: z.string().optional(),
  
  // Body mapping coordinates (for 2D/3D models)
  bodyMapping: z.array(z.object({
    x: z.number().min(0).max(1), // Normalized coordinates
    y: z.number().min(0).max(1),
    z: z.number().min(0).max(1).optional(), // For 3D models
    bodyPart: z.string(),
    symptom: z.string()
  })).optional()
})

// Search and Pagination Schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
})

export const SearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  filters: z.record(z.string()).optional(),
  ...PaginationSchema.shape
})

// Provider and Organization Schemas
export const ProviderSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
  type: z.enum(["HOSPITAL", "CLINIC", "PRIVATE_PRACTICE", "HEALTH_SYSTEM"]),
  licenseNumber: z.string().optional(),
  contactInfo: z.object({
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
    email: z.string().email(),
    website: z.string().url().optional()
  }),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required"),
    zipCode: z.string().min(5, "ZIP code is required"),
    country: z.string().default("US")
  }),
  settings: z.object({
    timezone: z.string().default("UTC"),
    workingHours: z.record(z.object({
      start: z.string().optional(),
      end: z.string().optional(),
      closed: z.boolean().optional()
    })).optional()
  }).optional()
})

// Export all schemas for use in API routes
export const HealthcareSchemas = {
  SignInSchema,
  SignUpSchema,
  PatientSchema,
  UpdatePatientSchema,
  DoctorSchema,
  UpdateDoctorSchema,
  HSPSchema,
  UpdateHSPSchema,
  MedicationSchema,
  UpdateMedicationSchema,
  VitalSignSchema,
  AppointmentSchema,
  UpdateAppointmentSchema,
  CarePlanSchema,
  SymptomSchema,
  PaginationSchema,
  SearchSchema,
  ProviderSchema
}

// Type exports
export type SignInData = z.infer<typeof SignInSchema>
export type SignUpData = z.infer<typeof SignUpSchema>
export type PatientData = z.infer<typeof PatientSchema>
export type DoctorData = z.infer<typeof DoctorSchema>
export type HSPData = z.infer<typeof HSPSchema>
export type MedicationData = z.infer<typeof MedicationSchema>
export type VitalSignData = z.infer<typeof VitalSignSchema>
export type AppointmentData = z.infer<typeof AppointmentSchema>
export type CarePlanData = z.infer<typeof CarePlanSchema>
export type SymptomData = z.infer<typeof SymptomSchema>
export type ProviderData = z.infer<typeof ProviderSchema>