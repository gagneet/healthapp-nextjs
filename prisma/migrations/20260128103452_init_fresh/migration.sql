-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('DOCTOR', 'PATIENT', 'HSP', 'ADMIN', 'SYSTEM_ADMIN', 'PROVIDER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "public"."ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('MEDICATION_REMINDER', 'MEDICATION_MISSED', 'MEDICATION_REFILL_DUE', 'MEDICATION_INTERACTION_ALERT', 'REFILL_APPROVED', 'REFILL_DENIED', 'APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'VIDEO_CALL_STARTING', 'VITAL_REMINDER', 'VITAL_ABNORMAL', 'VITAL_CRITICAL', 'CARE_PLAN_UPDATED', 'TREATMENT_PLAN_UPDATED', 'NEW_PRESCRIPTION', 'LAB_RESULTS_READY', 'LAB_RESULTS_ABNORMAL', 'SYSTEM_ANNOUNCEMENT', 'DOCUMENT_SHARED', 'MESSAGE_RECEIVED', 'EMERGENCY_ALERT', 'CAREGIVER_ALERT', 'ACHIEVEMENT_UNLOCKED', 'STREAK_MILESTONE', 'CHALLENGE_COMPLETED');

-- CreateEnum
CREATE TYPE "public"."NotificationCategory" AS ENUM ('CLINICAL', 'ADMINISTRATIVE', 'REMINDER', 'ALERT', 'SYSTEM', 'SOCIAL');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'SHARE', 'CONSENT_GRANTED', 'CONSENT_REVOKED', 'PRESCRIPTION_CREATED', 'PRESCRIPTION_DISPENSED', 'VITAL_RECORDED', 'ALERT_TRIGGERED', 'EMERGENCY_ACCESSED');

-- CreateEnum
CREATE TYPE "public"."ProviderType" AS ENUM ('DOCTOR', 'HSP');

-- CreateEnum
CREATE TYPE "public"."AppointmentType" AS ENUM ('INITIAL_CONSULTATION', 'FOLLOW_UP', 'ROUTINE_CHECKUP', 'EMERGENCY', 'PROCEDURE', 'LAB_REVIEW', 'DIET_CONSULTATION', 'PHYSIOTHERAPY_SESSION', 'YOGA_SESSION', 'AYURVEDA_CONSULTATION', 'HOMEOPATHY_CONSULTATION', 'COUNSELING', 'WOUND_CARE', 'DIABETES_EDUCATION');

-- CreateEnum
CREATE TYPE "public"."AppointmentMode" AS ENUM ('IN_PERSON', 'VIDEO', 'AUDIO', 'CHAT', 'HOME_VISIT');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'WAIVED');

-- CreateEnum
CREATE TYPE "public"."PracticeType" AS ENUM ('INDIVIDUAL', 'CLINIC', 'HOSPITAL', 'MULTI_SPECIALTY');

-- CreateEnum
CREATE TYPE "public"."DoctorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."PrescriptionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PARTIALLY_DISPENSED', 'FULLY_DISPENSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."MedicationFrequency" AS ENUM ('ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'EVERY_4_HOURS', 'EVERY_6_HOURS', 'EVERY_8_HOURS', 'EVERY_12_HOURS', 'ONCE_WEEKLY', 'TWICE_WEEKLY', 'AS_NEEDED', 'BEFORE_MEALS', 'AFTER_MEALS', 'AT_BEDTIME', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."DurationUnit" AS ENUM ('DAYS', 'WEEKS', 'MONTHS');

-- CreateEnum
CREATE TYPE "public"."MedicationPrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DISCONTINUED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."NoteStatus" AS ENUM ('DRAFT', 'COMPLETED', 'SIGNED', 'AMENDED');

-- CreateEnum
CREATE TYPE "public"."TemplateType" AS ENUM ('PRESCRIPTION', 'CONSULTATION_NOTE', 'TREATMENT_PLAN', 'DIET_PLAN', 'EXERCISE_PLAN', 'PATIENT_EDUCATION', 'REFERRAL_LETTER', 'DISCHARGE_SUMMARY', 'MEDICAL_CERTIFICATE');

-- CreateEnum
CREATE TYPE "public"."ScheduleType" AS ENUM ('RECURRING', 'SPECIFIC_DATE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."DrugInteractionSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATED');

-- CreateEnum
CREATE TYPE "public"."HSPSpecialization" AS ENUM ('NURSE', 'DIETITIAN', 'NUTRITIONIST', 'PHYSIOTHERAPIST', 'OCCUPATIONAL_THERAPIST', 'CARE_COORDINATOR', 'AYURVEDA_PRACTITIONER', 'YOGA_INSTRUCTOR', 'HOMEOPATH', 'UNANI_PRACTITIONER', 'SIDDHA_PRACTITIONER', 'NATUROPATH', 'PHARMACIST', 'PSYCHOLOGIST', 'SPEECH_THERAPIST', 'DIABETES_EDUCATOR', 'WOUND_CARE_SPECIALIST', 'RESPIRATORY_THERAPIST');

-- CreateEnum
CREATE TYPE "public"."AYUSHSpecialty" AS ENUM ('AYURVEDA', 'YOGA', 'UNANI', 'SIDDHA', 'HOMEOPATHY', 'NATUROPATHY');

-- CreateEnum
CREATE TYPE "public"."HSPStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."AssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."HSPTreatmentType" AS ENUM ('DIET_PLAN', 'EXERCISE_PLAN', 'PHYSIOTHERAPY', 'YOGA_THERAPY', 'WOUND_CARE', 'DIABETES_EDUCATION', 'RESPIRATORY_THERAPY', 'OCCUPATIONAL_THERAPY', 'SPEECH_THERAPY', 'PSYCHOLOGICAL_COUNSELING', 'AYURVEDA_TREATMENT', 'HOMEOPATHY_TREATMENT', 'NURSING_CARE');

-- CreateEnum
CREATE TYPE "public"."TreatmentPlanStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."SessionMode" AS ENUM ('IN_PERSON', 'VIDEO', 'HOME_VISIT');

-- CreateEnum
CREATE TYPE "public"."HomeVisitStatus" AS ENUM ('SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PATIENT_NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "public"."WoundType" AS ENUM ('SURGICAL', 'PRESSURE_INJURY', 'DIABETIC_ULCER', 'VENOUS_ULCER', 'ARTERIAL_ULCER', 'TRAUMATIC', 'BURN', 'SKIN_TEAR', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExudateAmount" AS ENUM ('NONE', 'SCANT', 'SMALL', 'MODERATE', 'LARGE', 'COPIOUS');

-- CreateEnum
CREATE TYPE "public"."HealingTrend" AS ENUM ('IMPROVING', 'STABLE', 'DETERIORATING');

-- CreateEnum
CREATE TYPE "public"."MedicationLogStatus" AS ENUM ('TAKEN', 'MISSED', 'SKIPPED', 'LATE', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."SideEffectSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING');

-- CreateEnum
CREATE TYPE "public"."RefillStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MealType" AS ENUM ('BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'EVENING_SNACK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExerciseIntensity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "public"."GoalCategory" AS ENUM ('MEDICATION_ADHERENCE', 'WEIGHT_MANAGEMENT', 'BLOOD_SUGAR_CONTROL', 'BLOOD_PRESSURE_CONTROL', 'EXERCISE', 'DIET', 'SLEEP', 'STRESS_MANAGEMENT', 'QUIT_SMOKING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."GoalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."CaregiverAccessLevel" AS ENUM ('VIEW_ONLY', 'VIEW_AND_REMIND', 'FULL_ACCESS', 'EMERGENCY_ONLY');

-- CreateEnum
CREATE TYPE "public"."CaregiverAccessStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ReminderType" AS ENUM ('MEDICATION', 'APPOINTMENT', 'VITAL_RECORDING', 'EXERCISE', 'MEAL_LOGGING', 'WATER_INTAKE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReminderStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('ARTICLE', 'VIDEO', 'INFOGRAPHIC', 'QUIZ', 'CHECKLIST', 'FAQ');

-- CreateEnum
CREATE TYPE "public"."ContentDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "public"."MessageSenderType" AS ENUM ('PATIENT', 'DOCTOR', 'HSP', 'CAREGIVER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."ConversationType" AS ENUM ('DIRECT', 'CARE_TEAM', 'PATIENT_FAMILY', 'PROVIDER_GROUP');

-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."MessageContentType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'PRESCRIPTION', 'LAB_RESULT', 'VITAL_READING');

-- CreateEnum
CREATE TYPE "public"."VitalDataType" AS ENUM ('NUMERIC', 'COMPOUND', 'TEXT', 'BOOLEAN', 'SCALE');

-- CreateEnum
CREATE TYPE "public"."VitalCategory" AS ENUM ('CARDIOVASCULAR', 'METABOLIC', 'RESPIRATORY', 'ANTHROPOMETRIC', 'TEMPERATURE', 'PAIN', 'NEUROLOGICAL', 'RENAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VitalSource" AS ENUM ('MANUAL', 'DEVICE_SYNC', 'WEARABLE', 'LAB_IMPORT', 'HOME_MONITORING');

-- CreateEnum
CREATE TYPE "public"."VitalStatus" AS ENUM ('NORMAL', 'BORDERLINE', 'ABNORMAL', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AlertLevel" AS ENUM ('INFO', 'WARNING', 'CRITICAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."PrakritiType" AS ENUM ('VATA', 'PITTA', 'KAPHA', 'VATA_PITTA', 'PITTA_KAPHA', 'VATA_KAPHA', 'TRIDOSHA');

-- CreateEnum
CREATE TYPE "public"."AyurvedaTreatmentType" AS ENUM ('PANCHAKARMA', 'SHAMANA', 'RASAYANA', 'VAJIKARANA', 'KAYAKALPA', 'DINACHARYA', 'RITUCHARYA');

-- CreateEnum
CREATE TYPE "public"."PanchakarmaPhase" AS ENUM ('POORVAKARMA', 'PRADHANAKARMA', 'PASCHATKARMA');

-- CreateEnum
CREATE TYPE "public"."CaseStatus" AS ENUM ('ACTIVE', 'IMPROVING', 'STABLE', 'CLOSED', 'REFERRED');

-- CreateEnum
CREATE TYPE "public"."ProgressDirection" AS ENUM ('MARKED_IMPROVEMENT', 'MODERATE_IMPROVEMENT', 'SLIGHT_IMPROVEMENT', 'NO_CHANGE', 'SLIGHT_DETERIORATION', 'MODERATE_DETERIORATION', 'MARKED_DETERIORATION');

-- CreateEnum
CREATE TYPE "public"."ABDMRecordType" AS ENUM ('PRESCRIPTION', 'DIAGNOSTIC_REPORT', 'DISCHARGE_SUMMARY', 'OP_CONSULTATION', 'IMMUNIZATION_RECORD', 'HEALTH_DOCUMENT', 'WELLNESS_RECORD');

-- CreateEnum
CREATE TYPE "public"."ABDMConsentStatus" AS ENUM ('REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."MedicalTermType" AS ENUM ('CONDITION', 'SYMPTOM', 'MEDICATION', 'PROCEDURE', 'BODY_PART', 'VITAL_SIGN', 'LAB_TEST', 'INSTRUCTION');

-- CreateEnum
CREATE TYPE "public"."EconomicCategory" AS ENUM ('APL', 'BPL', 'EWS');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "public"."UserRole" NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "abhaId" TEXT,
    "abhaAddress" TEXT,
    "aadhaarVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doctors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "registrationCouncil" TEXT NOT NULL,
    "registrationState" TEXT,
    "registrationVerified" BOOLEAN NOT NULL DEFAULT false,
    "registrationVerifiedAt" TIMESTAMP(3),
    "qualifications" JSONB NOT NULL,
    "specializations" TEXT[],
    "primarySpecialization" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "practiceName" TEXT,
    "practiceType" "public"."PracticeType" NOT NULL DEFAULT 'INDIVIDUAL',
    "consultationFee" DECIMAL(10,2) NOT NULL,
    "followUpFee" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "consultationDuration" INTEGER NOT NULL DEFAULT 15,
    "followUpDuration" INTEGER NOT NULL DEFAULT 10,
    "isAvailableForVideo" BOOLEAN NOT NULL DEFAULT true,
    "isAvailableForChat" BOOLEAN NOT NULL DEFAULT true,
    "isAcceptingNewPatients" BOOLEAN NOT NULL DEFAULT true,
    "languagesSpoken" TEXT[] DEFAULT ARRAY['en', 'hi']::TEXT[],
    "digitalSignature" TEXT,
    "prescriptionHeader" TEXT,
    "prescriptionFooter" TEXT,
    "averageRating" DOUBLE PRECISION,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "totalConsultations" INTEGER NOT NULL DEFAULT 0,
    "hprId" TEXT,
    "hprVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."DoctorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_doctor_assignments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "status" "public"."AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "patient_doctor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doctor_availability" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "scheduleType" "public"."ScheduleType" NOT NULL,
    "dayOfWeek" INTEGER,
    "specificDate" DATE,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 15,
    "consultationType" "public"."AppointmentMode"[],
    "locationId" TEXT,
    "locationName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doctor_templates" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "type" "public"."TemplateType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "specialty" TEXT,
    "conditions" TEXT[],
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prescriptions" (
    "id" TEXT NOT NULL,
    "prescriptionNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "diagnosis" TEXT[],
    "icdCodes" TEXT[],
    "clinicalNotes" TEXT,
    "vitalsSnapshot" JSONB,
    "status" "public"."PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "prescribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "digitallySignedAt" TIMESTAMP(3),
    "signatureHash" TEXT,
    "abdmDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prescription_medications" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicineId" TEXT,
    "medicineName" TEXT NOT NULL,
    "genericName" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" "public"."MedicationFrequency" NOT NULL,
    "frequencyCustom" TEXT,
    "timing" TEXT[],
    "timingInstructions" TEXT,
    "duration" INTEGER NOT NULL,
    "durationUnit" "public"."DurationUnit" NOT NULL DEFAULT 'DAYS',
    "quantity" INTEGER,
    "instructions" TEXT,
    "instructionsHi" TEXT,
    "warnings" TEXT[],
    "refillsAllowed" INTEGER NOT NULL DEFAULT 0,
    "refillsUsed" INTEGER NOT NULL DEFAULT 0,
    "allowGenericSubstitution" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."MedicationPrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "interactionWarnings" JSONB,

    CONSTRAINT "prescription_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medicines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "genericName" TEXT,
    "brandName" TEXT,
    "manufacturer" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "drugClass" TEXT,
    "schedule" TEXT,
    "dosageForm" TEXT NOT NULL,
    "strength" TEXT,
    "strengthUnit" TEXT,
    "packSize" INTEGER,
    "packUnit" TEXT,
    "mrp" DECIMAL(10,2),
    "dpcoControlled" BOOLEAN NOT NULL DEFAULT false,
    "interactions" JSONB,
    "contraindications" TEXT[],
    "sideEffects" TEXT[],
    "storageInstructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drug_interactions" (
    "id" TEXT NOT NULL,
    "drug1Name" TEXT NOT NULL,
    "drug1GenericName" TEXT,
    "drug2Name" TEXT NOT NULL,
    "drug2GenericName" TEXT,
    "severity" "public"."DrugInteractionSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionHi" TEXT,
    "mechanism" TEXT,
    "clinicalManagement" TEXT,
    "references" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "drug_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dispensing_records" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "dispensedBy" TEXT NOT NULL,
    "dispensedByName" TEXT,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medicationsDispensed" JSONB NOT NULL,
    "totalAmount" DECIMAL(10,2),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "notes" TEXT,

    CONSTRAINT "dispensing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultation_notes" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "chiefComplaintHi" TEXT,
    "historyOfPresentIllness" TEXT,
    "pastMedicalHistory" TEXT,
    "familyHistory" TEXT,
    "socialHistory" TEXT,
    "allergies" TEXT[],
    "currentMedications" JSONB,
    "generalExamination" TEXT,
    "systemicExamination" JSONB,
    "vitals" JSONB,
    "provisionalDiagnosis" TEXT[],
    "differentialDiagnosis" TEXT[],
    "icdCodes" TEXT[],
    "treatmentPlan" TEXT,
    "investigationsOrdered" TEXT[],
    "referrals" JSONB,
    "followUpPlan" TEXT,
    "patientEducation" TEXT,
    "attachments" JSONB,
    "templateId" TEXT,
    "status" "public"."NoteStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lab_orders" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "patientId" TEXT NOT NULL,
    "orderedBy" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "tests" JSONB NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'ROUTINE',
    "clinicalNotes" TEXT,
    "labId" TEXT,
    "labName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ORDERED',
    "scheduledAt" TIMESTAMP(3),
    "collectionMethod" TEXT,
    "collectionAddress" TEXT,
    "resultsReceivedAt" TIMESTAMP(3),
    "results" JSONB,
    "abnormalFindings" TEXT[],
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hsps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "specialization" "public"."HSPSpecialization" NOT NULL,
    "registrationNumber" TEXT,
    "registrationCouncil" TEXT,
    "registrationVerified" BOOLEAN NOT NULL DEFAULT false,
    "qualifications" JSONB NOT NULL,
    "certifications" JSONB,
    "experience" INTEGER NOT NULL,
    "ayushRegistrationNumber" TEXT,
    "ayushSpecialty" "public"."AYUSHSpecialty",
    "languagesSpoken" TEXT[] DEFAULT ARRAY['en', 'hi']::TEXT[],
    "isAvailableForVideo" BOOLEAN NOT NULL DEFAULT false,
    "isAvailableForHomeVisit" BOOLEAN NOT NULL DEFAULT false,
    "homeVisitRadius" INTEGER,
    "consultationFee" DECIMAL(10,2),
    "homeVisitFee" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "public"."HSPStatus" NOT NULL DEFAULT 'ACTIVE',
    "averageRating" DOUBLE PRECISION,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hsps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hsp_patient_assignments" (
    "id" TEXT NOT NULL,
    "hspId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "public"."AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "permissions" JSONB,

    CONSTRAINT "hsp_patient_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hsp_treatment_plans" (
    "id" TEXT NOT NULL,
    "hspId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "public"."HSPTreatmentType" NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "description" TEXT,
    "descriptionHi" TEXT,
    "goals" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "frequency" TEXT,
    "totalSessions" INTEGER,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."TreatmentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "progressNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hsp_treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatment_sessions" (
    "id" TEXT NOT NULL,
    "treatmentPlanId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "mode" "public"."SessionMode" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "patientFeedback" TEXT,
    "patientRating" INTEGER,
    "goalsAddressed" TEXT[],
    "exercisesCompleted" JSONB,
    "attachments" JSONB,

    CONSTRAINT "treatment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."home_visits" (
    "id" TEXT NOT NULL,
    "hspId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "actualArrival" TIMESTAMP(3),
    "actualDeparture" TIMESTAMP(3),
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "status" "public"."HomeVisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "checkedInAt" TIMESTAMP(3),
    "checkedInLocation" JSONB,
    "checkedOutAt" TIMESTAMP(3),
    "visitType" TEXT NOT NULL,
    "chiefComplaint" TEXT,
    "vitalsRecorded" JSONB,
    "medicationsAdministered" JSONB,
    "proceduresPerformed" JSONB,
    "assessment" TEXT,
    "recommendations" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "alertsRaised" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wound_documentation" (
    "id" TEXT NOT NULL,
    "hspId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "homeVisitId" TEXT,
    "woundId" TEXT NOT NULL,
    "woundLocation" TEXT NOT NULL,
    "woundType" "public"."WoundType" NOT NULL,
    "etiology" TEXT,
    "length" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "depth" DOUBLE PRECISION,
    "area" DOUBLE PRECISION,
    "tissueType" JSONB NOT NULL,
    "woundEdges" TEXT,
    "periwoundSkin" TEXT,
    "exudateAmount" "public"."ExudateAmount" NOT NULL,
    "exudateType" TEXT,
    "pressureInjuryStage" TEXT,
    "painLevel" INTEGER,
    "cleansingSolution" TEXT,
    "dressingType" TEXT,
    "dressingSecondary" TEXT,
    "photos" JSONB,
    "notes" TEXT,
    "healingTrend" "public"."HealingTrend",
    "documentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wound_documentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "bloodGroup" TEXT,
    "address" JSONB,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "allergies" TEXT[],
    "chronicConditions" TEXT[],
    "medicalHistory" JSONB,
    "abhaId" TEXT,
    "abhaAddress" TEXT,
    "aadhaarVerified" BOOLEAN NOT NULL DEFAULT false,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "preferredLanguages" TEXT[] DEFAULT ARRAY['en', 'hi']::TEXT[],
    "whatsappNumber" TEXT,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "smsOptIn" BOOLEAN NOT NULL DEFAULT true,
    "insuranceProvider" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceValidUntil" TIMESTAMP(3),
    "ayushmanBharatBeneficiary" BOOLEAN NOT NULL DEFAULT false,
    "economicCategory" "public"."EconomicCategory",
    "bplCardNumber" TEXT,
    "prakritiAssessment" JSONB,
    "prakritiAssessedAt" TIMESTAMP(3),
    "prakritiAssessedBy" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "primaryDoctorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."care_plans" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "description" TEXT,
    "descriptionHi" TEXT,
    "condition" TEXT NOT NULL,
    "icdCodes" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "goals" JSONB NOT NULL,
    "status" "public"."TreatmentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."care_plan_medications" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "medicineId" TEXT,
    "medicineName" TEXT NOT NULL,
    "genericName" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" "public"."MedicationFrequency" NOT NULL,
    "frequencyCustom" TEXT,
    "timing" TEXT[],
    "timingInstructions" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "instructions" TEXT,
    "instructionsHi" TEXT,
    "status" "public"."MedicationPrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "care_plan_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medication_logs" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "carePlanMedicationId" TEXT,
    "prescriptionMedicationId" TEXT,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "actualTime" TIMESTAMP(3),
    "status" "public"."MedicationLogStatus" NOT NULL DEFAULT 'PENDING',
    "dosageTaken" TEXT,
    "notes" TEXT,
    "skipReason" TEXT,
    "sideEffects" JSONB,
    "recordedBy" TEXT,
    "recordedByRole" "public"."UserRole",
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refill_requests" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "carePlanMedicationId" TEXT,
    "medicineName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "public"."RefillStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,

    CONSTRAINT "refill_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vital_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "unit" TEXT NOT NULL,
    "dataType" "public"."VitalDataType" NOT NULL,
    "isCompound" BOOLEAN NOT NULL DEFAULT false,
    "components" JSONB,
    "normalRangeMin" DOUBLE PRECISION,
    "normalRangeMax" DOUBLE PRECISION,
    "criticalMin" DOUBLE PRECISION,
    "criticalMax" DOUBLE PRECISION,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "color" TEXT,
    "category" "public"."VitalCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vital_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vital_readings" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "vitalTypeId" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "valueText" TEXT,
    "components" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "recordedByRole" "public"."UserRole",
    "source" "public"."VitalSource" NOT NULL DEFAULT 'MANUAL',
    "deviceId" TEXT,
    "deviceName" TEXT,
    "status" "public"."VitalStatus" NOT NULL DEFAULT 'NORMAL',
    "alertLevel" "public"."AlertLevel",
    "alertMessage" TEXT,
    "alertAcknowledgedAt" TIMESTAMP(3),
    "alertAcknowledgedBy" TEXT,
    "notes" TEXT,
    "circumstances" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "vital_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meal_logs" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "mealType" "public"."MealType" NOT NULL,
    "mealTime" TIMESTAMP(3) NOT NULL,
    "foods" JSONB NOT NULL,
    "totalCalories" INTEGER,
    "totalCarbs" DOUBLE PRECISION,
    "totalProtein" DOUBLE PRECISION,
    "totalFat" DOUBLE PRECISION,
    "bloodSugarBefore" INTEGER,
    "bloodSugarAfter" INTEGER,
    "notes" TEXT,
    "photos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exercise_logs" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "intensity" "public"."ExerciseIntensity",
    "caloriesBurned" INTEGER,
    "distance" DOUBLE PRECISION,
    "distanceUnit" TEXT,
    "steps" INTEGER,
    "heartRateAvg" INTEGER,
    "heartRateMax" INTEGER,
    "notes" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."symptom_reports" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "symptoms" JSONB NOT NULL,
    "overallSeverity" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "notes" TEXT,
    "photos" JSONB,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alertTriggered" BOOLEAN NOT NULL DEFAULT false,
    "alertLevel" "public"."AlertLevel",
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,

    CONSTRAINT "symptom_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_goals" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "category" "public"."GoalCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION,
    "targetUnit" TEXT,
    "currentValue" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "milestones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "health_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."badges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "description" TEXT NOT NULL,
    "descriptionHi" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT,
    "requirement" JSONB NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_badges" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."achievements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "description" TEXT NOT NULL,
    "descriptionHi" TEXT,
    "type" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_achievements" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "patient_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."caregiver_access" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "accessLevel" "public"."CaregiverAccessLevel" NOT NULL,
    "permissions" JSONB,
    "status" "public"."CaregiverAccessStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "caregiver_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "category" "public"."NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "titleHi" TEXT,
    "message" TEXT NOT NULL,
    "messageHi" TEXT,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "channels" "public"."NotificationChannel"[],
    "sentVia" JSONB,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "relatedType" TEXT,
    "relatedId" TEXT,
    "actionUrl" TEXT,
    "actionData" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_notification_preferences" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "medicationReminders" BOOLEAN NOT NULL DEFAULT true,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "vitalReminders" BOOLEAN NOT NULL DEFAULT true,
    "exerciseReminders" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "criticalAlertsBypass" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "patient_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" TEXT NOT NULL,
    "type" "public"."ConversationType" NOT NULL,
    "subject" TEXT,
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "canSend" BOOLEAN NOT NULL DEFAULT true,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3),
    "isMuted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "public"."UserRole" NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" "public"."MessageContentType" NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "originalLanguage" TEXT,
    "translatedContent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerType" "public"."ProviderType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "type" "public"."AppointmentType" NOT NULL,
    "mode" "public"."AppointmentMode" NOT NULL,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "videoRoomId" TEXT,
    "videoRoomUrl" TEXT,
    "locationId" TEXT,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "patientNotes" TEXT,
    "preAppointmentChecklist" JSONB,
    "checklistCompletedAt" TIMESTAMP(3),
    "summary" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "remindersSent" JSONB,
    "fee" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."care_teams" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "primaryDoctorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."care_team_members" (
    "id" TEXT NOT NULL,
    "careTeamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "specialization" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3),
    "permissions" JSONB,
    "consentStatus" "public"."ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "consentedAt" TIMESTAMP(3),

    CONSTRAINT "care_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userRole" "public"."UserRole",
    "action" "public"."AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "previousData" JSONB,
    "newData" JSONB,
    "changedFields" TEXT[],
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "accessReason" TEXT,
    "consentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prakriti_assessments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "vataScore" INTEGER NOT NULL,
    "pittaScore" INTEGER NOT NULL,
    "kaphaScore" INTEGER NOT NULL,
    "dominantPrakriti" "public"."PrakritiType" NOT NULL,
    "secondaryPrakriti" "public"."PrakritiType",
    "questionnaire" JSONB NOT NULL,
    "physicalExam" JSONB,
    "pulseExam" JSONB,
    "dietRecommendations" TEXT,
    "lifestyleRecommendations" TEXT,
    "seasonalRecommendations" TEXT,
    "notes" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prakriti_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ayurveda_treatments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hspId" TEXT NOT NULL,
    "treatmentPlanId" TEXT,
    "treatmentType" "public"."AyurvedaTreatmentType" NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "panchakarmaPhase" "public"."PanchakarmaPhase",
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "duration" INTEGER,
    "medications" JSONB,
    "pathya" TEXT[],
    "apathya" TEXT[],
    "instructions" TEXT,
    "instructionsHi" TEXT,
    "status" "public"."TreatmentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ayurveda_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ayurveda_sessions" (
    "id" TEXT NOT NULL,
    "ayurvedaTreatmentId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "procedure" TEXT NOT NULL,
    "procedureDetails" JSONB,
    "materialsUsed" JSONB,
    "patientResponse" TEXT,
    "complications" TEXT,
    "vitalsBeforeSession" JSONB,
    "vitalsAfterSession" JSONB,
    "practitionerNotes" TEXT,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "ayurveda_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."yoga_therapies" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hspId" TEXT NOT NULL,
    "treatmentPlanId" TEXT,
    "therapeuticGoals" TEXT[],
    "programName" TEXT NOT NULL,
    "programNameHi" TEXT,
    "description" TEXT,
    "frequency" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalWeeks" INTEGER,
    "asanas" JSONB NOT NULL,
    "pranayama" JSONB,
    "meditation" JSONB,
    "relaxation" JSONB,
    "precautions" TEXT[],
    "contraindications" TEXT[],
    "status" "public"."TreatmentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yoga_therapies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."yoga_sessions" (
    "id" TEXT NOT NULL,
    "yogaTherapyId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "asanasCompleted" JSONB,
    "pranayamaCompleted" JSONB,
    "meditationDuration" INTEGER,
    "heartRateBefore" INTEGER,
    "heartRateAfter" INTEGER,
    "stressLevelBefore" INTEGER,
    "stressLevelAfter" INTEGER,
    "difficultyLevel" INTEGER,
    "painLevel" INTEGER,
    "mood" TEXT,
    "notes" TEXT,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "yoga_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."homeopathy_cases" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hspId" TEXT NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "chiefComplaintHi" TEXT,
    "mentalSymptoms" JSONB NOT NULL,
    "physicalSymptoms" JSONB NOT NULL,
    "generalSymptoms" JSONB NOT NULL,
    "constitutionalType" TEXT,
    "miasm" TEXT,
    "repertorizationResults" JSONB,
    "remedy" TEXT,
    "potency" TEXT,
    "dosageSchedule" TEXT,
    "status" "public"."CaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homeopathy_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."homeopathy_follow_ups" (
    "id" TEXT NOT NULL,
    "homeopathyCaseId" TEXT NOT NULL,
    "followUpDate" TIMESTAMP(3) NOT NULL,
    "overallProgress" "public"."ProgressDirection" NOT NULL,
    "symptomChanges" JSONB NOT NULL,
    "newSymptoms" TEXT[],
    "healingDirection" TEXT,
    "remedyChanged" BOOLEAN NOT NULL DEFAULT false,
    "newRemedy" TEXT,
    "newPotency" TEXT,
    "practitionerNotes" TEXT,

    CONSTRAINT "homeopathy_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abdm_health_records" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "abhaId" TEXT NOT NULL,
    "healthRecordId" TEXT NOT NULL,
    "recordType" "public"."ABDMRecordType" NOT NULL,
    "fhirBundle" JSONB NOT NULL,
    "hipId" TEXT NOT NULL,
    "hipName" TEXT,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentId" TEXT NOT NULL,
    "consentExpiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abdm_health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."abdm_consents" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "consentStatus" "public"."ABDMConsentStatus" NOT NULL,
    "purpose" TEXT NOT NULL,
    "purposeDescription" TEXT,
    "hiTypes" TEXT[],
    "requesterHiuId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "dateRangeFrom" TIMESTAMP(3) NOT NULL,
    "dateRangeTo" TIMESTAMP(3) NOT NULL,
    "consentExpiresAt" TIMESTAMP(3) NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "abdm_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."translations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "hi" TEXT,
    "ta" TEXT,
    "te" TEXT,
    "bn" TEXT,
    "mr" TEXT,
    "gu" TEXT,
    "kn" TEXT,
    "ml" TEXT,
    "pa" TEXT,
    "or" TEXT,
    "as" TEXT,
    "ur" TEXT,
    "context" TEXT,
    "maxLength" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_term_translations" (
    "id" TEXT NOT NULL,
    "termEn" TEXT NOT NULL,
    "termType" "public"."MedicalTermType" NOT NULL,
    "termHi" TEXT,
    "termTa" TEXT,
    "termTe" TEXT,
    "termBn" TEXT,
    "termMr" TEXT,
    "pronunciationHi" TEXT,
    "simpleExplanationEn" TEXT,
    "simpleExplanationHi" TEXT,
    "snomedCode" TEXT,
    "icdCode" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "medical_term_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_risk_scores" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "overallRisk" INTEGER NOT NULL,
    "adherenceRisk" INTEGER NOT NULL,
    "clinicalRisk" INTEGER NOT NULL,
    "hospitalizationRisk" INTEGER,
    "riskFactors" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "algorithm" TEXT NOT NULL DEFAULT 'v1',
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "overrideBy" TEXT,
    "overrideAt" TIMESTAMP(3),

    CONSTRAINT "patient_risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_abhaId_key" ON "public"."users"("abhaId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_userId_key" ON "public"."doctors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_businessId_key" ON "public"."doctors"("businessId");

-- CreateIndex
CREATE INDEX "doctors_primarySpecialization_idx" ON "public"."doctors"("primarySpecialization");

-- CreateIndex
CREATE INDEX "doctors_registrationNumber_idx" ON "public"."doctors"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "patient_doctor_assignments_patientId_doctorId_key" ON "public"."patient_doctor_assignments"("patientId", "doctorId");

-- CreateIndex
CREATE INDEX "doctor_availability_doctorId_dayOfWeek_idx" ON "public"."doctor_availability"("doctorId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "doctor_availability_doctorId_specificDate_idx" ON "public"."doctor_availability"("doctorId", "specificDate");

-- CreateIndex
CREATE INDEX "doctor_templates_doctorId_type_idx" ON "public"."doctor_templates"("doctorId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_prescriptionNumber_key" ON "public"."prescriptions"("prescriptionNumber");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_prescribedAt_idx" ON "public"."prescriptions"("patientId", "prescribedAt");

-- CreateIndex
CREATE INDEX "prescriptions_doctorId_prescribedAt_idx" ON "public"."prescriptions"("doctorId", "prescribedAt");

-- CreateIndex
CREATE INDEX "medicines_name_idx" ON "public"."medicines"("name");

-- CreateIndex
CREATE INDEX "medicines_genericName_idx" ON "public"."medicines"("genericName");

-- CreateIndex
CREATE INDEX "drug_interactions_drug1GenericName_idx" ON "public"."drug_interactions"("drug1GenericName");

-- CreateIndex
CREATE INDEX "drug_interactions_drug2GenericName_idx" ON "public"."drug_interactions"("drug2GenericName");

-- CreateIndex
CREATE INDEX "dispensing_records_prescriptionId_idx" ON "public"."dispensing_records"("prescriptionId");

-- CreateIndex
CREATE INDEX "consultation_notes_patientId_createdAt_idx" ON "public"."consultation_notes"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_orderNumber_key" ON "public"."lab_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "lab_orders_patientId_createdAt_idx" ON "public"."lab_orders"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "hsps_userId_key" ON "public"."hsps"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "hsps_businessId_key" ON "public"."hsps"("businessId");

-- CreateIndex
CREATE INDEX "hsps_specialization_idx" ON "public"."hsps"("specialization");

-- CreateIndex
CREATE UNIQUE INDEX "hsp_patient_assignments_hspId_patientId_key" ON "public"."hsp_patient_assignments"("hspId", "patientId");

-- CreateIndex
CREATE INDEX "hsp_treatment_plans_patientId_status_idx" ON "public"."hsp_treatment_plans"("patientId", "status");

-- CreateIndex
CREATE INDEX "treatment_sessions_treatmentPlanId_scheduledAt_idx" ON "public"."treatment_sessions"("treatmentPlanId", "scheduledAt");

-- CreateIndex
CREATE INDEX "home_visits_hspId_scheduledAt_idx" ON "public"."home_visits"("hspId", "scheduledAt");

-- CreateIndex
CREATE INDEX "home_visits_patientId_scheduledAt_idx" ON "public"."home_visits"("patientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "wound_documentation_patientId_woundId_documentedAt_idx" ON "public"."wound_documentation"("patientId", "woundId", "documentedAt");

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "public"."patients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_businessId_key" ON "public"."patients"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_abhaId_key" ON "public"."patients"("abhaId");

-- CreateIndex
CREATE INDEX "care_plans_patientId_status_idx" ON "public"."care_plans"("patientId", "status");

-- CreateIndex
CREATE INDEX "medication_logs_patientId_scheduledTime_idx" ON "public"."medication_logs"("patientId", "scheduledTime");

-- CreateIndex
CREATE INDEX "medication_logs_patientId_status_idx" ON "public"."medication_logs"("patientId", "status");

-- CreateIndex
CREATE INDEX "refill_requests_patientId_status_idx" ON "public"."refill_requests"("patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vital_types_code_key" ON "public"."vital_types"("code");

-- CreateIndex
CREATE INDEX "vital_readings_patientId_vitalTypeId_recordedAt_idx" ON "public"."vital_readings"("patientId", "vitalTypeId", "recordedAt");

-- CreateIndex
CREATE INDEX "vital_readings_patientId_alertLevel_idx" ON "public"."vital_readings"("patientId", "alertLevel");

-- CreateIndex
CREATE INDEX "meal_logs_patientId_mealTime_idx" ON "public"."meal_logs"("patientId", "mealTime");

-- CreateIndex
CREATE INDEX "exercise_logs_patientId_startTime_idx" ON "public"."exercise_logs"("patientId", "startTime");

-- CreateIndex
CREATE INDEX "symptom_reports_patientId_reportedAt_idx" ON "public"."symptom_reports"("patientId", "reportedAt");

-- CreateIndex
CREATE INDEX "health_goals_patientId_status_idx" ON "public"."health_goals"("patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "public"."badges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "patient_badges_patientId_badgeId_key" ON "public"."patient_badges"("patientId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "public"."achievements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "patient_achievements_patientId_achievementId_key" ON "public"."patient_achievements"("patientId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "caregiver_access_patientId_caregiverId_key" ON "public"."caregiver_access"("patientId", "caregiverId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "public"."notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_userId_type_createdAt_idx" ON "public"."notifications"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_scheduledFor_idx" ON "public"."notifications"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "patient_notification_preferences_patientId_key" ON "public"."patient_notification_preferences"("patientId");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "public"."conversations"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "public"."conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "public"."messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "appointments_patientId_scheduledAt_idx" ON "public"."appointments"("patientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_providerId_scheduledAt_idx" ON "public"."appointments"("providerId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_status_scheduledAt_idx" ON "public"."appointments"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "care_teams_patientId_key" ON "public"."care_teams"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "care_team_members_careTeamId_userId_key" ON "public"."care_team_members"("careTeamId", "userId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "public"."audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "public"."audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "public"."audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "prakriti_assessments_patientId_idx" ON "public"."prakriti_assessments"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "abdm_health_records_healthRecordId_key" ON "public"."abdm_health_records"("healthRecordId");

-- CreateIndex
CREATE INDEX "abdm_health_records_patientId_recordType_idx" ON "public"."abdm_health_records"("patientId", "recordType");

-- CreateIndex
CREATE INDEX "abdm_health_records_abhaId_idx" ON "public"."abdm_health_records"("abhaId");

-- CreateIndex
CREATE UNIQUE INDEX "abdm_consents_consentId_key" ON "public"."abdm_consents"("consentId");

-- CreateIndex
CREATE INDEX "abdm_consents_patientId_consentStatus_idx" ON "public"."abdm_consents"("patientId", "consentStatus");

-- CreateIndex
CREATE INDEX "translations_namespace_idx" ON "public"."translations"("namespace");

-- CreateIndex
CREATE UNIQUE INDEX "translations_key_namespace_key" ON "public"."translations"("key", "namespace");

-- CreateIndex
CREATE UNIQUE INDEX "medical_term_translations_termEn_termType_key" ON "public"."medical_term_translations"("termEn", "termType");

-- CreateIndex
CREATE INDEX "patient_risk_scores_patientId_idx" ON "public"."patient_risk_scores"("patientId");

-- CreateIndex
CREATE INDEX "patient_risk_scores_doctorId_overallRisk_idx" ON "public"."patient_risk_scores"("doctorId", "overallRisk");

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_doctor_assignments" ADD CONSTRAINT "patient_doctor_assignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_doctor_assignments" ADD CONSTRAINT "patient_doctor_assignments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctor_availability" ADD CONSTRAINT "doctor_availability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctor_templates" ADD CONSTRAINT "doctor_templates_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescription_medications" ADD CONSTRAINT "prescription_medications_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescription_medications" ADD CONSTRAINT "prescription_medications_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "public"."medicines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispensing_records" ADD CONSTRAINT "dispensing_records_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_notes" ADD CONSTRAINT "consultation_notes_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_notes" ADD CONSTRAINT "consultation_notes_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_orders" ADD CONSTRAINT "lab_orders_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_orders" ADD CONSTRAINT "lab_orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_orders" ADD CONSTRAINT "lab_orders_orderedBy_fkey" FOREIGN KEY ("orderedBy") REFERENCES "public"."doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hsps" ADD CONSTRAINT "hsps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hsp_patient_assignments" ADD CONSTRAINT "hsp_patient_assignments_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."hsps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hsp_patient_assignments" ADD CONSTRAINT "hsp_patient_assignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hsp_treatment_plans" ADD CONSTRAINT "hsp_treatment_plans_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."hsps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hsp_treatment_plans" ADD CONSTRAINT "hsp_treatment_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_sessions" ADD CONSTRAINT "treatment_sessions_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "public"."hsp_treatment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."home_visits" ADD CONSTRAINT "home_visits_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."hsps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."home_visits" ADD CONSTRAINT "home_visits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wound_documentation" ADD CONSTRAINT "wound_documentation_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."hsps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wound_documentation" ADD CONSTRAINT "wound_documentation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."care_plans" ADD CONSTRAINT "care_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."care_plan_medications" ADD CONSTRAINT "care_plan_medications_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."care_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."care_plan_medications" ADD CONSTRAINT "care_plan_medications_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "public"."medicines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_logs" ADD CONSTRAINT "medication_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_logs" ADD CONSTRAINT "medication_logs_carePlanMedicationId_fkey" FOREIGN KEY ("carePlanMedicationId") REFERENCES "public"."care_plan_medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_logs" ADD CONSTRAINT "medication_logs_prescriptionMedicationId_fkey" FOREIGN KEY ("prescriptionMedicationId") REFERENCES "public"."prescription_medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refill_requests" ADD CONSTRAINT "refill_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vital_readings" ADD CONSTRAINT "vital_readings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vital_readings" ADD CONSTRAINT "vital_readings_vitalTypeId_fkey" FOREIGN KEY ("vitalTypeId") REFERENCES "public"."vital_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meal_logs" ADD CONSTRAINT "meal_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exercise_logs" ADD CONSTRAINT "exercise_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."symptom_reports" ADD CONSTRAINT "symptom_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_goals" ADD CONSTRAINT "health_goals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_badges" ADD CONSTRAINT "patient_badges_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_badges" ADD CONSTRAINT "patient_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_achievements" ADD CONSTRAINT "patient_achievements_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_achievements" ADD CONSTRAINT "patient_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."caregiver_access" ADD CONSTRAINT "caregiver_access_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."caregiver_access" ADD CONSTRAINT "caregiver_access_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_notification_preferences" ADD CONSTRAINT "patient_notification_preferences_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."care_teams" ADD CONSTRAINT "care_teams_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."care_team_members" ADD CONSTRAINT "care_team_members_careTeamId_fkey" FOREIGN KEY ("careTeamId") REFERENCES "public"."care_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prakriti_assessments" ADD CONSTRAINT "prakriti_assessments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ayurveda_treatments" ADD CONSTRAINT "ayurveda_treatments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ayurveda_treatments" ADD CONSTRAINT "ayurveda_treatments_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."hsps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ayurveda_sessions" ADD CONSTRAINT "ayurveda_sessions_ayurvedaTreatmentId_fkey" FOREIGN KEY ("ayurvedaTreatmentId") REFERENCES "public"."ayurveda_treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."yoga_therapies" ADD CONSTRAINT "yoga_therapies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."yoga_therapies" ADD CONSTRAINT "yoga_therapies_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."hsps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."yoga_sessions" ADD CONSTRAINT "yoga_sessions_yogaTherapyId_fkey" FOREIGN KEY ("yogaTherapyId") REFERENCES "public"."yoga_therapies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."homeopathy_cases" ADD CONSTRAINT "homeopathy_cases_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."homeopathy_cases" ADD CONSTRAINT "homeopathy_cases_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."hsps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."homeopathy_follow_ups" ADD CONSTRAINT "homeopathy_follow_ups_homeopathyCaseId_fkey" FOREIGN KEY ("homeopathyCaseId") REFERENCES "public"."homeopathy_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abdm_health_records" ADD CONSTRAINT "abdm_health_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."abdm_consents" ADD CONSTRAINT "abdm_consents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_risk_scores" ADD CONSTRAINT "patient_risk_scores_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_risk_scores" ADD CONSTRAINT "patient_risk_scores_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
