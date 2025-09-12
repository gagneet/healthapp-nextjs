CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AdherenceType" AS ENUM ('MEDICATION', 'APPOINTMENT', 'VITAL_CHECK', 'SYMPTOM_LOG', 'DIET_LOG', 'EXERCISE', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."AppointmentSlotType" AS ENUM ('REGULAR', 'EMERGENCY', 'CONSULTATION', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "public"."AppointmentOrganizerType" AS ENUM ('DOCTOR', 'PATIENT', 'CARE_TAKER', 'HSP', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AppointmentParticipantOneType" AS ENUM ('DOCTOR', 'PATIENT', 'HSP');

-- CreateEnum
CREATE TYPE "public"."AppointmentParticipantTwoType" AS ENUM ('DOCTOR', 'PATIENT', 'HSP');

-- CreateEnum
CREATE TYPE "public"."DashboardMetricsEntityType" AS ENUM ('PATIENT', 'DOCTOR', 'ORGANIZATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."MedicationLogAdherenceStatus" AS ENUM ('TAKEN', 'MISSED', 'LATE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."MedicationOrganizerType" AS ENUM ('DOCTOR', 'PATIENT', 'CARE_TAKER', 'HSP', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."PatientAlertType" AS ENUM ('MEDICATION', 'VITAL', 'APPOINTMENT', 'SYMPTOM', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."PatientAlertSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "public"."PatientConsentOtpMethod" AS ENUM ('SMS', 'EMAIL', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."PatientProviderConsentMethod" AS ENUM ('SMS', 'EMAIL', 'IN_PERSON', 'PHONE', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "public"."PatientProviderConsentStatus" AS ENUM ('PENDING', 'CONSENT_REQUESTED', 'APPROVED', 'DENIED', 'EXPIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."PatientSubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIALING');

-- CreateEnum
CREATE TYPE "public"."PatientProviderConsentMethodLegacy" AS ENUM ('SMS', 'EMAIL', 'IN_PERSON', 'PHONE', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "public"."PaymentMethodType" AS ENUM ('CARD', 'BANK_ACCOUNT', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."ProviderChangePractitionerType" AS ENUM ('DOCTOR', 'HSP');

-- CreateEnum
CREATE TYPE "public"."ProviderChangeStatus" AS ENUM ('ACTIVE', 'PROCESSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ScheduleEventType" AS ENUM ('APPOINTMENT', 'REMINDER', 'medicationReminder', 'VITALS', 'careplanActivation', 'DIET', 'WORKOUT');

-- CreateEnum
CREATE TYPE "public"."ScheduledEventStatus" AS ENUM ('SCHEDULED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED', 'EXPIRED', 'STARTED', 'PRIOR');

-- CreateEnum
CREATE TYPE "public"."ScheduledEventType" AS ENUM ('MEDICATION', 'APPOINTMENT', 'VITAL_CHECK', 'SYMPTOM_LOG', 'DIET_LOG', 'EXERCISE', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."ScheduledEventPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."PatientDoctorAssignmentType" AS ENUM ('PRIMARY', 'SPECIALIST', 'SUBSTITUTE', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "public"."PatientDoctorAssignmentConsentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."SecondaryDoctorAssignmentConsentStatus" AS ENUM ('PENDING', 'REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ServicePlanBillingCycle" AS ENUM ('MONTHLY', 'YEARLY', 'oneTime', 'WEEKLY');

-- CreateEnum
CREATE TYPE "public"."UserRoleLinkedWith" AS ENUM ('DOCTOR', 'PATIENT', 'CARE_TAKER', 'HSP', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserAccountStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "public"."UserGender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'HSP', 'PATIENT', 'CAREGIVER');

-- CreateEnum
CREATE TYPE "public"."VitalReadingAlertLevel" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."DrugInteractionSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATION');

-- CreateEnum
CREATE TYPE "public"."AllergenType" AS ENUM ('MEDICATION', 'FOOD', 'ENVIRONMENTAL', 'LATEX', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'ANAPHYLAXIS');

-- CreateEnum
CREATE TYPE "public"."MedicationAlertType" AS ENUM ('DRUG_INTERACTION', 'ALLERGY_CONFLICT', 'DOSE_LIMIT_EXCEEDED', 'DUPLICATE_THERAPY', 'AGE_INAPPROPRIATE', 'CONTRAINDICATION', 'MONITORING_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."EmergencyAlertType" AS ENUM ('VITAL_CRITICAL', 'MEDICATION_MISSED_CRITICAL', 'DEVICE_OFFLINE', 'PATIENT_UNRESPONSIVE', 'EMERGENCY_BUTTON', 'FALL_DETECTED', 'MEDICATION_OVERDOSE');

-- CreateEnum
CREATE TYPE "public"."EmergencyPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY', 'LIFE_THREATENING');

-- CreateEnum
CREATE TYPE "public"."VitalConditionType" AS ENUM ('GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'OUTSIDE_RANGE', 'PERCENTAGE_CHANGE');

-- CreateEnum
CREATE TYPE "public"."ConsultationType" AS ENUM ('VIDEO_CONSULTATION', 'AUDIO_CONSULTATION', 'CHAT_CONSULTATION', 'EMERGENCY_CONSULTATION', 'FOLLOW_UP_CONSULTATION', 'SPECIALIST_REFERRAL');

-- CreateEnum
CREATE TYPE "public"."ConsultationStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED', 'INTERRUPTED');

-- CreateEnum
CREATE TYPE "public"."ConsultationPriority" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "public"."LabOrderStatus" AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REPORT_READY');

-- CreateEnum
CREATE TYPE "public"."LabTestCategory" AS ENUM ('BLOOD_CHEMISTRY', 'HEMATOLOGY', 'MICROBIOLOGY', 'PATHOLOGY', 'RADIOLOGY', 'CARDIOLOGY', 'ENDOCRINOLOGY', 'IMMUNOLOGY');

-- CreateEnum
CREATE TYPE "public"."GameBadgeType" AS ENUM ('ADHERENCE_STREAK', 'APPOINTMENT_KEEPER', 'VITAL_TRACKER', 'EXERCISE_CHAMPION', 'MEDICATION_MASTER', 'HEALTH_IMPROVEMENT', 'GOAL_ACHIEVER');

-- CreateEnum
CREATE TYPE "public"."GameChallengeType" AS ENUM ('DAILY_MEDICATION', 'WEEKLY_VITALS', 'MONTHLY_CHECKUP', 'EXERCISE_MINUTES', 'WEIGHT_MANAGEMENT', 'BLOOD_PRESSURE_CONTROL', 'GLUCOSE_MANAGEMENT');

-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('WEARABLE', 'BLOOD_PRESSURE', 'GLUCOSE_METER', 'PULSE_OXIMETER', 'THERMOMETER', 'ECG_MONITOR', 'SCALE', 'SPIROMETER', 'GENERIC_BLUETOOTH');

-- CreateEnum
CREATE TYPE "public"."DeviceStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'SYNCING', 'ERROR', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."ConnectionType" AS ENUM ('BLUETOOTH_LE', 'WIFI', 'API_OAUTH', 'MANUAL_ENTRY', 'BRIDGE_DEVICE');

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) DEFAULT 'clinic',
    "licenseNumber" VARCHAR(100),
    "contactInfo" JSONB DEFAULT '{}',
    "address" JSONB DEFAULT '{}',
    "settings" JSONB DEFAULT '{"timezone": "UTC", "working_hours": {"friday": {"end": "17:00", "start": "09:00"}, "monday": {"end": "17:00", "start": "09:00"}, "sunday": {"closed": true}, "tuesday": {"end": "17:00", "start": "09:00"}, "saturday": {"end": "13:00", "start": "09:00"}, "thursday": {"end": "17:00", "start": "09:00"}, "wednesday": {"end": "17:00", "start": "09:00"}}, "notification_preferences": {"sms_enabled": false, "push_enabled": true, "email_enabled": true}}',
    "isActive" BOOLEAN DEFAULT true,
    "hipaaCoveredEntity" BOOLEAN DEFAULT true,
    "businessAssociateAgreement" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255),
    "name" VARCHAR(255),
    "image" VARCHAR(500),
    "emailVerified" TIMESTAMPTZ(6),
    "role" "public"."UserRole" NOT NULL,
    "accountStatus" "public"."UserAccountStatus" DEFAULT 'PENDING_VERIFICATION',
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "middleName" VARCHAR(100),
    "phone" VARCHAR(20),
    "dateOfBirth" DATE,
    "gender" "public"."UserGender",
    "emailVerifiedLegacy" BOOLEAN DEFAULT false,
    "emailVerificationToken" VARCHAR(255),
    "passwordResetToken" VARCHAR(255),
    "passwordResetExpires" TIMESTAMPTZ(6),
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    "twoFactorSecret" VARCHAR(255),
    "failedLoginAttempts" INTEGER DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(6),
    "lastLoginAt" TIMESTAMPTZ(6),
    "profilePictureUrl" VARCHAR(500),
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "locale" VARCHAR(10) DEFAULT 'en',
    "preferences" JSONB,
    "termsAcceptedAt" TIMESTAMPTZ(6),
    "privacyPolicyAcceptedAt" TIMESTAMPTZ(6),
    "hipaaConsentDate" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMPTZ(6),
    "fullName" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" INTEGER,
    "tokenType" TEXT,
    "scope" TEXT,
    "idToken" TEXT,
    "sessionState" TEXT,
    "providerEmail" VARCHAR(255),
    "providerName" VARCHAR(255),
    "linkedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMPTZ(6),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMPTZ(6),
    "healthcareContext" JSONB DEFAULT '{}',

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verificationTokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."accountLinks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    "providerEmail" VARCHAR(255),
    "linkedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMPTZ(6),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "account_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patients" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID,
    "medicalRecordNumber" VARCHAR(50),
    "patientId" VARCHAR(100),
    "emergencyContacts" JSONB DEFAULT '[]',
    "insuranceInformation" JSONB DEFAULT '{}',
    "medicalHistory" JSONB DEFAULT '[]',
    "allergies" JSONB DEFAULT '[]',
    "currentMedications" JSONB DEFAULT '[]',
    "heightCm" DECIMAL(5,2),
    "weightKg" DECIMAL(5,2),
    "bloodType" VARCHAR(5),
    "dateOfBirth" DATE,
    "gender" VARCHAR(20),
    "primaryLanguage" VARCHAR(10) DEFAULT 'en',
    "riskLevel" VARCHAR(20) DEFAULT 'low',
    "riskFactors" JSONB DEFAULT '[]',
    "communicationPreferences" JSONB DEFAULT '{"language": "en", "time_zone": "UTC", "health_tips": false, "medication_reminders": true, "appointmentReminders": true, "research_participation": false, "preferred_contact_method": "email"}',
    "privacySettings" JSONB DEFAULT '{"share_with_family": false, "share_for_research": false, "data_sharing_consent": false, "marketing_communications": false, "provider_directory_listing": true}',
    "primaryCareDoctorId" UUID,
    "primaryCareHspId" UUID,
    "careCoordinatorId" UUID,
    "careCoordinatorType" VARCHAR(10),
    "overallAdherenceScore" DECIMAL(5,2),
    "lastAdherenceCalculation" TIMESTAMPTZ(6),
    "totalAppointments" INTEGER DEFAULT 0,
    "missedAppointments" INTEGER DEFAULT 0,
    "lastVisitDate" TIMESTAMPTZ(6),
    "nextAppointmentDate" TIMESTAMPTZ(6),
    "isActive" BOOLEAN DEFAULT true,
    "requiresInterpreter" BOOLEAN DEFAULT false,
    "hasMobilityIssues" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMPTZ(6),
    "linkedProviderId" UUID,
    "providerLinkedAt" TIMESTAMPTZ(6),
    "providerConsentGiven" BOOLEAN DEFAULT false,
    "providerConsentGivenAt" TIMESTAMPTZ(6),
    "providerConsentMethod" "public"."PatientProviderConsentMethodLegacy",

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."healthcareProviders" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID,
    "licenseNumber" VARCHAR(100),
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subSpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualifications" JSONB DEFAULT '[]',
    "yearsOfExperience" INTEGER,
    "isVerified" BOOLEAN DEFAULT false,
    "verificationDocuments" JSONB DEFAULT '[]',
    "verificationDate" TIMESTAMPTZ(6),
    "verifiedBy" UUID,
    "consultationFee" DECIMAL(10,2),
    "availabilitySchedule" JSONB DEFAULT '{"friday": {"end": "17:00", "start": "09:00", "available": true}, "monday": {"end": "17:00", "start": "09:00", "available": true}, "sunday": {"available": false}, "tuesday": {"end": "17:00", "start": "09:00", "available": true}, "saturday": {"available": false}, "thursday": {"end": "17:00", "start": "09:00", "available": true}, "wednesday": {"end": "17:00", "start": "09:00", "available": true}}',
    "notificationPreferences" JSONB DEFAULT '{"patient_updates": true, "marketing_emails": false, "smsNotifications": true, "pushNotifications": true, "system_notifications": true, "appointmentReminders": true}',
    "practiceName" VARCHAR(255),
    "practiceAddress" JSONB DEFAULT '{}',
    "practicePhone" VARCHAR(20),
    "practiceWebsite" VARCHAR(255),
    "totalPatients" INTEGER DEFAULT 0,
    "activeCarePlans" INTEGER DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "totalReviews" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "healthcare_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."specialties" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),
    "userCreated" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clinics" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "doctorId" UUID NOT NULL,
    "organizationId" UUID,
    "address" JSONB NOT NULL DEFAULT '{}',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "locationVerified" BOOLEAN DEFAULT false,
    "locationAccuracy" VARCHAR(20),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(500),
    "operatingHours" JSONB NOT NULL DEFAULT '{}',
    "servicesOffered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clinicImages" JSONB DEFAULT '[]',
    "bannerImage" TEXT,
    "description" TEXT,
    "consultationFee" DECIMAL(10,2),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registrationNumber" VARCHAR(100),
    "establishedYear" INTEGER,
    "facilities" JSONB DEFAULT '[]',
    "insuranceAccepted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."carePlans" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "createdByDoctorId" UUID,
    "createdByHspId" UUID,
    "assignedDoctorId" UUID,
    "assignedHspId" UUID,
    "organizationId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "planType" VARCHAR(20) DEFAULT 'care_plan',
    "chronicConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conditionSeverity" JSONB DEFAULT '{}',
    "riskFactors" JSONB DEFAULT '[]',
    "longTermGoals" JSONB DEFAULT '[]',
    "shortTermMilestones" JSONB DEFAULT '[]',
    "interventions" JSONB DEFAULT '[]',
    "lifestyleModifications" JSONB DEFAULT '[]',
    "monitoringParameters" JSONB DEFAULT '[]',
    "monitoringFrequency" JSONB DEFAULT '{}',
    "targetValues" JSONB DEFAULT '{}',
    "medications" JSONB DEFAULT '[]',
    "medicationManagement" JSONB DEFAULT '{}',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "reviewFrequencyMonths" INTEGER DEFAULT 3,
    "nextReviewDate" TIMESTAMP(3),
    "status" VARCHAR(20) DEFAULT 'ACTIVE',
    "priority" VARCHAR(20) DEFAULT 'MEDIUM',
    "primaryCareManagerId" UUID,
    "careTeamMembers" JSONB DEFAULT '[]',
    "specialistReferrals" JSONB DEFAULT '[]',
    "patientEducationMaterials" JSONB DEFAULT '[]',
    "selfManagementTasks" JSONB DEFAULT '[]',
    "patientGoals" JSONB DEFAULT '[]',
    "progressNotes" JSONB DEFAULT '[]',
    "outcomeMeasures" JSONB DEFAULT '{}',
    "qualityOfLifeScores" JSONB DEFAULT '{}',
    "emergencyActionPlan" JSONB DEFAULT '{}',
    "warningSigns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emergencyContacts" JSONB DEFAULT '[]',
    "details" JSONB,
    "channelId" VARCHAR(255),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "care_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medicines" (
    "id" UUID NOT NULL,
    "name" VARCHAR(1000) NOT NULL,
    "type" VARCHAR(1000) DEFAULT 'tablet',
    "description" VARCHAR(1000),
    "details" JSON,
    "creatorId" INTEGER,
    "publicMedicine" BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    "algoliaObjectId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medications" (
    "id" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "organizerType" "public"."MedicationOrganizerType",
    "organizerId" UUID NOT NULL,
    "medicineId" UUID NOT NULL,
    "description" VARCHAR(1000),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "rrRule" VARCHAR(1000),
    "details" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "carePlanId" UUID,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" UUID NOT NULL,
    "participantOneType" "public"."AppointmentParticipantOneType",
    "participantOneId" UUID,
    "participantTwoType" "public"."AppointmentParticipantTwoType",
    "participantTwoId" UUID,
    "organizerType" "public"."AppointmentOrganizerType",
    "organizerId" UUID,
    "providerId" UUID,
    "providerName" VARCHAR(100),
    "description" VARCHAR(1000),
    "appointmentType" TEXT NOT NULL DEFAULT 'consultation',
    "notes" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "rrRule" VARCHAR(1000),
    "details" JSON,
    "status" "public"."ConsultationStatus" DEFAULT 'SCHEDULED',
    "carePlanId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "doctorId" UUID,
    "patientId" UUID,
    "slotId" UUID,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doctorAvailability" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIME(6) NOT NULL,
    "endTime" TIME(6) NOT NULL,
    "isAvailable" BOOLEAN DEFAULT true,
    "slotDuration" INTEGER DEFAULT 30,
    "maxAppointmentsPerSlot" INTEGER DEFAULT 1,
    "breakStartTime" TIME(6),
    "breakEndTime" TIME(6),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vitalTypes" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(20),
    "normalRangeMin" DECIMAL(10,2),
    "normalRangeMax" DECIMAL(10,2),
    "description" TEXT,
    "validationRules" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vital_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vitalReadings" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "vitalTypeId" UUID NOT NULL,
    "adherenceRecordId" UUID,
    "value" DECIMAL(10,2),
    "unit" VARCHAR(20),
    "readingTime" TIMESTAMP(3) NOT NULL,
    "deviceInfo" JSONB DEFAULT '{}',
    "isFlagged" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "isValidated" BOOLEAN DEFAULT false,
    "validatedBy" UUID,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "systolicValue" DECIMAL(5,2),
    "diastolicValue" DECIMAL(5,2),
    "pulseRate" INTEGER,
    "respiratoryRate" INTEGER,
    "oxygenSaturation" DECIMAL(5,2),
    "alertLevel" "public"."VitalReadingAlertLevel" DEFAULT 'NORMAL',
    "alertReasons" JSONB DEFAULT '[]',

    CONSTRAINT "vital_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."symptoms" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "carePlanId" UUID,
    "symptomName" VARCHAR(255) NOT NULL,
    "severity" INTEGER,
    "description" TEXT,
    "bodyLocation" JSONB DEFAULT '{}',
    "onsetTime" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3),
    "triggers" JSONB DEFAULT '[]',
    "relievingFactors" JSONB DEFAULT '[]',
    "associatedSymptoms" JSONB DEFAULT '[]',
    "attachments" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adherenceRecords" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "scheduledEventId" UUID,
    "adherenceType" "public"."AdherenceType" NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN DEFAULT false,
    "isPartial" BOOLEAN DEFAULT false,
    "isMissed" BOOLEAN DEFAULT false,
    "responseData" JSONB DEFAULT '{}',
    "notes" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "adherence_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."servicePlans" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "serviceType" VARCHAR(100),
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "billingCycle" "public"."ServicePlanBillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "features" JSON DEFAULT '[]',
    "patientLimit" INTEGER,
    "trialPeriodDays" INTEGER DEFAULT 0,
    "setupFee" DECIMAL(10,2) DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "stripePriceId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "service_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patientSubscriptions" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "servicePlanId" UUID NOT NULL,
    "status" "public"."PatientSubscriptionStatus" DEFAULT 'ACTIVE',
    "currentPeriodStart" DATE NOT NULL,
    "currentPeriodEnd" DATE NOT NULL,
    "nextBillingDate" DATE,
    "trialStart" DATE,
    "trialEnd" DATE,
    "paymentMethodId" VARCHAR(255),
    "stripeSubscriptionId" VARCHAR(255),
    "stripeCustomerId" VARCHAR(255),
    "lastPaymentDate" TIMESTAMP(3),
    "lastPaymentAmount" DECIMAL(10,2),
    "failureCount" INTEGER DEFAULT 0,
    "metadata" JSON DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "patient_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patientDoctorAssignments" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "assignmentType" "public"."PatientDoctorAssignmentType" NOT NULL DEFAULT 'SPECIALIST',
    "permissions" JSONB DEFAULT '{"can_view_patient": true, "can_create_care_plans": false, "can_modify_care_plans": false, "can_prescribe": false, "can_order_tests": false, "can_access_full_history": false}',
    "specialtyFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "carePlanIds" UUID[] DEFAULT ARRAY[]::UUID[],
    "assignedByDoctorId" UUID,
    "assignedByAdminId" UUID,
    "patientConsentRequired" BOOLEAN DEFAULT false,
    "patientConsentStatus" "public"."PatientDoctorAssignmentConsentStatus" DEFAULT 'NOT_REQUIRED',
    "consentMethod" VARCHAR(20),
    "consentOtp" VARCHAR(10),
    "consentOtpExpiresAt" TIMESTAMP(3),
    "consentGrantedAt" TIMESTAMP(3),
    "assignmentStartDate" TIMESTAMP(3),
    "assignmentEndDate" TIMESTAMP(3),
    "isActive" BOOLEAN DEFAULT true,
    "assignmentReason" TEXT,
    "notes" TEXT,
    "requiresSameOrganization" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "patient_doctor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."userDevices" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deviceType" VARCHAR(50) NOT NULL,
    "pushToken" VARCHAR(500) NOT NULL,
    "deviceId" VARCHAR(255),
    "isActive" BOOLEAN DEFAULT true,
    "notificationSettings" JSONB DEFAULT '{"vitals": true, "symptoms": true, "emergency": true, "reminders": true, "medications": true, "appointments": true}',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "patientId" UUID,
    "doctorId" UUID,
    "hspId" UUID,
    "organizationId" UUID,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" VARCHAR(20) DEFAULT 'MEDIUM',
    "isUrgent" BOOLEAN DEFAULT false,
    "channels" VARCHAR(255)[] DEFAULT ARRAY['PUSH']::VARCHAR(255)[],
    "scheduledFor" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" VARCHAR(20) DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "deliveryAttempts" INTEGER DEFAULT 0,
    "deliveryLog" JSONB DEFAULT '[]',
    "readAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "relatedAppointmentId" UUID,
    "relatedMedicationId" UUID,
    "relatedCarePlanId" UUID,
    "relatedTreatmentPlanId" UUID,
    "metadata" JSONB DEFAULT '{}',
    "requiresAction" BOOLEAN DEFAULT false,
    "actionUrl" VARCHAR(500),
    "actionTaken" BOOLEAN DEFAULT false,
    "actionTakenAt" TIMESTAMP(3),
    "templateId" VARCHAR(100),
    "personalizationData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "recipientId" UUID,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auditLogs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "userRole" VARCHAR(50),
    "organizationId" UUID,
    "action" VARCHAR(10) NOT NULL,
    "resource" VARCHAR(500) NOT NULL,
    "patientId" UUID,
    "entityType" VARCHAR(50),
    "entityId" UUID,
    "phiAccessed" BOOLEAN DEFAULT false,
    "accessGranted" BOOLEAN NOT NULL,
    "denialReason" TEXT,
    "ipAddress" INET,
    "userAgent" TEXT,
    "sessionId" VARCHAR(255),
    "requestId" UUID,
    "dataChanges" JSONB,
    "encryptedData" JSONB,
    "riskLevel" VARCHAR(10) DEFAULT 'low',
    "securityAlerts" JSONB DEFAULT '[]',
    "retentionDate" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sequelizeMeta" (
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "sequelize_meta_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "public"."appointmentSlots" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIME(6) NOT NULL,
    "endTime" TIME(6) NOT NULL,
    "maxAppointments" INTEGER DEFAULT 1,
    "bookedAppointments" INTEGER DEFAULT 0,
    "isAvailable" BOOLEAN DEFAULT true,
    "slotType" "public"."AppointmentSlotType" DEFAULT 'REGULAR',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "appointment_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."carePlanTemplates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "templateData" JSONB NOT NULL DEFAULT '{}',
    "createdBy" UUID NOT NULL,
    "organizationId" UUID,
    "isPublic" BOOLEAN DEFAULT false,
    "isApproved" BOOLEAN DEFAULT false,
    "approvedBy" UUID,
    "version" VARCHAR(20) DEFAULT '1.0',
    "parentTemplateId" UUID,
    "usageCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "care_plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dashboardMetrics" (
    "id" UUID NOT NULL,
    "entityType" "public"."DashboardMetricsEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "metricType" VARCHAR(100) NOT NULL,
    "metricData" JSONB NOT NULL DEFAULT '{}',
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "dashboard_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doctors" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "doctorId" VARCHAR(50) NOT NULL,
    "organizationId" UUID,
    "medicalLicenseNumber" VARCHAR(100) NOT NULL,
    "npiNumber" VARCHAR(20),
    "boardCertifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medicalSchool" VARCHAR(255),
    "residencyPrograms" JSONB DEFAULT '[]',
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subSpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearsOfExperience" INTEGER,
    "capabilities" TEXT[] DEFAULT ARRAY['prescribe_medications', 'order_tests', 'diagnose', 'create_treatment_plans', 'create_care_plans', 'modify_medications', 'monitor_vitals', 'patient_education', 'care_coordination', 'emergency_response']::TEXT[],
    "isVerified" BOOLEAN DEFAULT false,
    "verificationDocuments" JSONB DEFAULT '[]',
    "verificationDate" TIMESTAMP(3),
    "verifiedBy" UUID,
    "consultationFee" DECIMAL(10,2),
    "availabilitySchedule" JSONB DEFAULT '{"friday": {"end": "17:00", "start": "09:00", "available": true}, "monday": {"end": "17:00", "start": "09:00", "available": true}, "sunday": {"available": false}, "tuesday": {"end": "17:00", "start": "09:00", "available": true}, "saturday": {"available": false}, "thursday": {"end": "17:00", "start": "09:00", "available": true}, "wednesday": {"end": "17:00", "start": "09:00", "available": true}}',
    "languagesSpoken" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "notificationPreferences" JSONB DEFAULT '{"patient_updates": true, "emergency_alerts": true, "peer_consultations": true, "system_notifications": true, "appointmentReminders": true}',
    "practiceName" VARCHAR(255),
    "practiceAddress" JSONB DEFAULT '{}',
    "practicePhone" VARCHAR(20),
    "signaturePic" TEXT,
    "razorpayAccountId" VARCHAR(255),
    "totalPatients" INTEGER DEFAULT 0,
    "activeTreatmentPlans" INTEGER DEFAULT 0,
    "activeCarePlans" INTEGER DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "totalReviews" INTEGER DEFAULT 0,
    "isAvailableOnline" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "specialtyId" INTEGER,
    "profilePictureUrl" TEXT,
    "bannerImageUrl" TEXT,
    "qualificationDetails" JSONB DEFAULT '[]',
    "registrationDetails" JSONB DEFAULT '{}',
    "subscriptionDetails" JSONB DEFAULT '{}',
    "signatureImageUrl" TEXT,
    "signatureData" TEXT,
    "gender" VARCHAR(20),
    "mobileNumber" VARCHAR(20),
    "biography" TEXT,
    "isAcceptingNewPatients" BOOLEAN DEFAULT true,
    "offersOnlineConsultations" BOOLEAN DEFAULT false,
    "emergencyAvailability" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hsps" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hspId" VARCHAR(50) NOT NULL,
    "organizationId" UUID,
    "hspType" VARCHAR(50) NOT NULL,
    "licenseNumber" VARCHAR(100),
    "certificationNumber" VARCHAR(100),
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" JSONB DEFAULT '[]',
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearsOfExperience" INTEGER,
    "capabilities" TEXT[] DEFAULT ARRAY['monitor_vitals', 'patient_education', 'care_coordination']::TEXT[],
    "requiresSupervision" BOOLEAN DEFAULT true,
    "supervisingDoctorId" UUID,
    "supervisionLevel" VARCHAR(20) DEFAULT 'direct',
    "isVerified" BOOLEAN DEFAULT false,
    "verificationDocuments" JSONB DEFAULT '[]',
    "verificationDate" TIMESTAMP(3),
    "verifiedBy" UUID,
    "hourlyRate" DECIMAL(8,2),
    "availabilitySchedule" JSONB DEFAULT '{"friday": {"end": "18:00", "start": "08:00", "available": true}, "monday": {"end": "18:00", "start": "08:00", "available": true}, "sunday": {"available": false}, "tuesday": {"end": "18:00", "start": "08:00", "available": true}, "saturday": {"available": false}, "thursday": {"end": "18:00", "start": "08:00", "available": true}, "wednesday": {"end": "18:00", "start": "08:00", "available": true}}',
    "languagesSpoken" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "notificationPreferences" JSONB DEFAULT '{"patient_updates": true, "shift_reminders": true, "emergency_alerts": true, "system_notifications": true}',
    "departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shiftPreferences" JSONB DEFAULT '{"preferred_shifts": ["day"], "weekend_availability": false, "night_shift_available": false}',
    "totalPatientsAssisted" INTEGER DEFAULT 0,
    "activeCarePlans" INTEGER DEFAULT 0,
    "tasksCompleted" INTEGER DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "totalReviews" INTEGER DEFAULT 0,
    "isAvailable" BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "hsps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medicationLogs" (
    "id" UUID NOT NULL,
    "medicationId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "takenAt" TIMESTAMP(3),
    "dosageTaken" VARCHAR(100),
    "notes" TEXT,
    "adherenceStatus" "public"."MedicationLogAdherenceStatus" DEFAULT 'MISSED',
    "reminderSent" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "medication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patientAlerts" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "alertType" "public"."PatientAlertType" NOT NULL,
    "severity" "public"."PatientAlertSeverity" DEFAULT 'MEDIUM',
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "actionRequired" BOOLEAN DEFAULT false,
    "acknowledged" BOOLEAN DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" UUID,
    "resolved" BOOLEAN DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "patient_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patientConsentOtps" (
    "id" UUID NOT NULL,
    "secondaryAssignmentId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "primaryDoctorId" UUID NOT NULL,
    "secondaryDoctorId" UUID,
    "secondaryHspId" UUID,
    "otpCode" VARCHAR(10) NOT NULL,
    "otpMethod" "public"."PatientConsentOtpMethod" DEFAULT 'BOTH',
    "patientPhone" VARCHAR(20),
    "patientEmail" VARCHAR(255),
    "generatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptsCount" INTEGER DEFAULT 0,
    "maxAttempts" INTEGER DEFAULT 3,
    "isVerified" BOOLEAN DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isExpired" BOOLEAN DEFAULT false,
    "isBlocked" BOOLEAN DEFAULT false,
    "blockedAt" TIMESTAMP(3),
    "requestedByUserId" UUID NOT NULL,
    "requestIpAddress" INET,
    "requestUserAgent" TEXT,
    "smsSent" BOOLEAN DEFAULT false,
    "smsSentAt" TIMESTAMP(3),
    "smsError" TEXT,
    "emailSent" BOOLEAN DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "emailError" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "patient_consent_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patientProviderAssignments" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "role" VARCHAR(50) DEFAULT 'primary',
    "assignedAt" TIMESTAMP(3),
    "assignedBy" UUID,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "patient_provider_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patientProviderConsentHistory" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "previousProviderId" UUID,
    "newProviderId" UUID NOT NULL,
    "doctorId" UUID,
    "hspId" UUID,
    "consentRequired" BOOLEAN DEFAULT false,
    "consentRequested" BOOLEAN DEFAULT false,
    "consentRequestedAt" TIMESTAMP(3),
    "consentGiven" BOOLEAN DEFAULT false,
    "consentGivenAt" TIMESTAMP(3),
    "consentMethod" "public"."PatientProviderConsentMethod",
    "consentToken" VARCHAR(100),
    "consentTokenExpiresAt" TIMESTAMP(3),
    "consentVerified" BOOLEAN DEFAULT false,
    "consentDenied" BOOLEAN DEFAULT false,
    "consentDeniedAt" TIMESTAMP(3),
    "reason" TEXT,
    "initiatedBy" UUID,
    "status" "public"."PatientProviderConsentStatus" DEFAULT 'PENDING',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "patient_provider_consent_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."paymentMethods" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "stripePaymentMethodId" VARCHAR(255) NOT NULL,
    "type" "public"."PaymentMethodType" NOT NULL,
    "cardBrand" VARCHAR(50),
    "cardLast4" VARCHAR(4),
    "cardExpMonth" INTEGER,
    "cardExpYear" INTEGER,
    "bankName" VARCHAR(100),
    "bankLast4" VARCHAR(4),
    "isDefault" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "billingAddress" JSON,
    "metadata" JSON DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "status" "public"."PaymentStatus" DEFAULT 'PENDING',
    "paymentMethodId" UUID NOT NULL,
    "stripePaymentIntentId" VARCHAR(255),
    "stripeChargeId" VARCHAR(255),
    "failureCode" VARCHAR(100),
    "failureMessage" TEXT,
    "refundAmount" DECIMAL(10,2) DEFAULT 0,
    "refundReason" VARCHAR(255),
    "invoiceId" VARCHAR(255),
    "billingPeriodStart" DATE,
    "billingPeriodEnd" DATE,
    "metadata" JSON DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."providerChanges" (
    "id" UUID NOT NULL,
    "practitionerType" "public"."ProviderChangePractitionerType" NOT NULL,
    "practitionerId" UUID NOT NULL,
    "previousProviderId" UUID,
    "newProviderId" UUID NOT NULL,
    "changeDate" TIMESTAMP(3) NOT NULL,
    "affectedPatientsCount" INTEGER DEFAULT 0,
    "consentRequiredCount" INTEGER DEFAULT 0,
    "consentObtainedCount" INTEGER DEFAULT 0,
    "reason" TEXT,
    "status" "public"."ProviderChangeStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "provider_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."providers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(255),
    "state" VARCHAR(255),
    "activatedOn" TIMESTAMP(3),
    "details" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheduleEvents" (
    "id" UUID NOT NULL,
    "critical" BOOLEAN,
    "eventType" "public"."ScheduleEventType",
    "eventId" UUID,
    "details" JSON,
    "status" "public"."ScheduledEventStatus" NOT NULL DEFAULT 'PENDING',
    "date" DATE,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "schedule_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheduledEvents" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "carePlanId" UUID,
    "eventType" "public"."ScheduledEventType" NOT NULL,
    "eventId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "status" "public"."ScheduledEventStatus" DEFAULT 'SCHEDULED',
    "priority" "public"."ScheduledEventPriority" DEFAULT 'MEDIUM',
    "eventData" JSONB DEFAULT '{}',
    "completedAt" TIMESTAMP(3),
    "completedBy" UUID,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "scheduled_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."secondaryDoctorAssignments" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "primaryDoctorId" UUID NOT NULL,
    "secondaryDoctorId" UUID,
    "secondaryHspId" UUID,
    "assignmentReason" TEXT,
    "specialtyFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "carePlanIds" UUID[] DEFAULT ARRAY[]::UUID[],
    "primaryDoctorProviderId" UUID,
    "secondaryDoctorProviderId" UUID,
    "consentRequired" BOOLEAN DEFAULT true,
    "consentStatus" "public"."SecondaryDoctorAssignmentConsentStatus" DEFAULT 'PENDING',
    "accessGranted" BOOLEAN DEFAULT false,
    "firstAccessAttemptAt" TIMESTAMP(3),
    "accessGrantedAt" TIMESTAMP(3),
    "consentExpiresAt" TIMESTAMP(3),
    "consentDurationMonths" INTEGER DEFAULT 6,
    "isActive" BOOLEAN DEFAULT true,
    "assignmentStartDate" TIMESTAMP(3),
    "assignmentEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "secondary_doctor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."symptomsDatabase" (
    "id" UUID NOT NULL,
    "diagnosisName" VARCHAR(255) NOT NULL,
    "symptoms" JSONB DEFAULT '{}',
    "category" VARCHAR(100),
    "severityIndicators" JSONB DEFAULT '{}',
    "commonAgeGroups" JSONB DEFAULT '[]',
    "genderSpecific" VARCHAR(20),
    "isActive" BOOLEAN DEFAULT true,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "symptoms_database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatmentDatabase" (
    "id" UUID NOT NULL,
    "treatmentName" VARCHAR(255) NOT NULL,
    "treatmentType" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "applicableConditions" JSONB DEFAULT '[]',
    "duration" VARCHAR(100),
    "frequency" VARCHAR(100),
    "dosageInfo" JSONB DEFAULT '{}',
    "category" VARCHAR(100),
    "severityLevel" VARCHAR(20),
    "ageRestrictions" JSONB DEFAULT '{}',
    "contraindications" JSONB DEFAULT '[]',
    "sideEffects" JSONB DEFAULT '[]',
    "monitoringRequired" JSONB DEFAULT '[]',
    "isActive" BOOLEAN DEFAULT true,
    "requiresSpecialist" BOOLEAN DEFAULT false,
    "prescriptionRequired" BOOLEAN DEFAULT false,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "treatment_database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatmentPlans" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "organizationId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "planType" VARCHAR(20) DEFAULT 'treatment_plan',
    "primaryDiagnosis" VARCHAR(255) NOT NULL,
    "secondaryDiagnoses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chiefComplaint" TEXT,
    "symptoms" JSONB DEFAULT '[]',
    "treatmentGoals" JSONB DEFAULT '[]',
    "interventions" JSONB DEFAULT '[]',
    "medications" JSONB DEFAULT '[]',
    "instructions" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedDurationDays" INTEGER,
    "endDate" TIMESTAMP(3),
    "followUpRequired" BOOLEAN DEFAULT true,
    "followUpDate" TIMESTAMP(3),
    "followUpInstructions" TEXT,
    "status" VARCHAR(20) DEFAULT 'ACTIVE',
    "priority" VARCHAR(20) DEFAULT 'MEDIUM',
    "progressNotes" JSONB DEFAULT '[]',
    "completionPercentage" INTEGER DEFAULT 0,
    "outcome" TEXT,
    "emergencyContacts" JSONB DEFAULT '[]',
    "warningSigns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignedHsps" UUID[] DEFAULT ARRAY[]::UUID[],
    "careTeamNotes" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."userRoleAssignments" (
    "id" UUID NOT NULL,
    "userIdentity" UUID NOT NULL,
    "linkedWith" "public"."UserRoleLinkedWith",
    "linkedId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vitalRequirements" (
    "id" UUID NOT NULL,
    "carePlanId" UUID NOT NULL,
    "vitalTypeId" UUID NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "preferredTime" TIME(6),
    "isCritical" BOOLEAN DEFAULT false,
    "monitoringNotes" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vital_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vitalTemplates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(255),
    "details" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vital_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vitals" (
    "id" UUID NOT NULL,
    "vitalTemplateId" UUID NOT NULL,
    "carePlanId" UUID NOT NULL,
    "details" JSON,
    "description" VARCHAR(1000),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drugInteractions" (
    "id" UUID NOT NULL,
    "rxcuiOne" VARCHAR(50) NOT NULL,
    "rxcuiTwo" VARCHAR(50) NOT NULL,
    "drugNameOne" VARCHAR(255) NOT NULL,
    "drugNameTwo" VARCHAR(255) NOT NULL,
    "severityLevel" "public"."DrugInteractionSeverity" NOT NULL,
    "interactionType" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "clinicalEffect" TEXT NOT NULL,
    "managementAdvice" TEXT NOT NULL,
    "evidenceLevel" VARCHAR(10) NOT NULL,
    "source" VARCHAR(50) NOT NULL DEFAULT 'RxNorm',
    "lastUpdatedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drug_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patientAllergies" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "allergenType" "public"."AllergenType" NOT NULL,
    "allergenName" VARCHAR(255) NOT NULL,
    "allergenRxnorm" VARCHAR(50),
    "reactionSeverity" "public"."AllergySeverity" NOT NULL,
    "reactionSymptoms" TEXT,
    "onsetDate" DATE,
    "verifiedByDoctor" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" UUID,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6),

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medicationSafetyAlerts" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "medicationId" UUID,
    "drugInteractionId" UUID,
    "patientAllergyId" UUID,
    "alertType" "public"."MedicationAlertType" NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL,
    "alertTitle" VARCHAR(255) NOT NULL,
    "alertMessage" TEXT NOT NULL,
    "recommendation" TEXT,
    "requiresOverride" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" UUID,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "overrideReason" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_safety_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emergencyAlerts" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "alertType" "public"."EmergencyAlertType" NOT NULL,
    "priorityLevel" "public"."EmergencyPriority" NOT NULL,
    "vitalReadingId" UUID,
    "triggeredByRule" VARCHAR(255),
    "alertTitle" VARCHAR(255) NOT NULL,
    "alertMessage" TEXT NOT NULL,
    "clinicalContext" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" UUID,
    "acknowledgedAt" TIMESTAMP(3),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" UUID,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "notificationsSent" JSONB NOT NULL DEFAULT '[]',
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "maxEscalations" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vitalAlertRules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "vitalType" VARCHAR(100) NOT NULL,
    "conditionType" "public"."VitalConditionType" NOT NULL,
    "thresholdValue" DECIMAL(10,2),
    "thresholdMin" DECIMAL(10,2),
    "thresholdMax" DECIMAL(10,2),
    "unit" VARCHAR(20),
    "alertLevel" "public"."AlertSeverity" NOT NULL,
    "alertMessage" TEXT NOT NULL,
    "notificationDelay" INTEGER NOT NULL DEFAULT 0,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "genderSpecific" VARCHAR(10),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT true,
    "patientConditions" JSONB DEFAULT '[]',
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vital_alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emergencyContacts" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "relationship" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "address" JSONB,
    "priorityOrder" INTEGER NOT NULL DEFAULT 1,
    "canReceiveMedical" BOOLEAN NOT NULL DEFAULT false,
    "preferredContact" VARCHAR(20) NOT NULL DEFAULT 'phone',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hipaaAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "authorizationDate" TIMESTAMP(3),
    "authorizationExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."videoConsultations" (
    "id" UUID NOT NULL,
    "consultationId" VARCHAR(255) NOT NULL,
    "doctorId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "appointmentId" UUID,
    "consultationType" "public"."ConsultationType" NOT NULL DEFAULT 'VIDEO_CONSULTATION',
    "status" "public"."ConsultationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "priority" "public"."ConsultationPriority" NOT NULL DEFAULT 'ROUTINE',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "roomId" VARCHAR(255),
    "roomToken" TEXT,
    "doctorJoinUrl" TEXT,
    "patientJoinUrl" TEXT,
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recordingUrl" TEXT,
    "chiefComplaint" TEXT,
    "presentingSymptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consultationNotes" TEXT,
    "diagnosis" TEXT,
    "treatmentPlan" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "connectionQuality" JSONB DEFAULT '{}',
    "technicalIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "durationMinutes" INTEGER,
    "consultationFee" DECIMAL(10,2),
    "insuranceCovered" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" VARCHAR(50) DEFAULT 'pending',
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultationPrescriptions" (
    "id" UUID NOT NULL,
    "consultationId" UUID NOT NULL,
    "medicationName" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "quantity" INTEGER,
    "instructions" TEXT,
    "refillsAllowed" INTEGER NOT NULL DEFAULT 0,
    "ndcCode" VARCHAR(50),
    "genericSubstitution" BOOLEAN NOT NULL DEFAULT true,
    "pharmacyInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultationNotes" (
    "id" UUID NOT NULL,
    "consultationId" UUID NOT NULL,
    "noteType" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,

    CONSTRAINT "consultation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."labOrders" (
    "id" UUID NOT NULL,
    "orderNumber" VARCHAR(100) NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "consultationId" UUID,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" VARCHAR(50) NOT NULL DEFAULT 'routine',
    "status" "public"."LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "category" "public"."LabTestCategory" NOT NULL DEFAULT 'BLOOD_CHEMISTRY',
    "orderedTests" JSONB NOT NULL DEFAULT '[]',
    "clinicalIndication" TEXT,
    "specialInstructions" TEXT,
    "labFacilityName" VARCHAR(255),
    "labFacilityCode" VARCHAR(100),
    "collectionDate" TIMESTAMP(3),
    "expectedResultDate" TIMESTAMP(3),
    "resultsAvailable" BOOLEAN NOT NULL DEFAULT false,
    "resultsData" JSONB DEFAULT '{}',
    "resultsPdfUrl" TEXT,
    "criticalValues" BOOLEAN NOT NULL DEFAULT false,
    "externalLabOrderId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."labResults" (
    "id" UUID NOT NULL,
    "labOrderId" UUID NOT NULL,
    "testName" VARCHAR(255) NOT NULL,
    "testCode" VARCHAR(50),
    "resultValue" VARCHAR(255),
    "numericValue" DECIMAL(10,3),
    "resultUnit" VARCHAR(50),
    "referenceRange" VARCHAR(255),
    "resultStatus" VARCHAR(50) NOT NULL DEFAULT 'final',
    "abnormalFlag" VARCHAR(10),
    "criticalFlag" BOOLEAN NOT NULL DEFAULT false,
    "collectionDate" TIMESTAMP(3),
    "resultDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedDate" TIMESTAMP(3),
    "method" VARCHAR(255),
    "specimenType" VARCHAR(100),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patientGameProfiles" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "experiencePoints" INTEGER NOT NULL DEFAULT 0,
    "medicationStreak" INTEGER NOT NULL DEFAULT 0,
    "appointmentStreak" INTEGER NOT NULL DEFAULT 0,
    "vitalsStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "badgesEarned" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "challengesCompleted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "loginStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3),
    "totalActivities" INTEGER NOT NULL DEFAULT 0,
    "gamificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_game_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gameBadgeAwards" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "badgeType" "public"."GameBadgeType" NOT NULL,
    "badgeName" VARCHAR(255) NOT NULL,
    "badgeDescription" TEXT,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "awardedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "badgeIcon" VARCHAR(255),
    "badgeColor" VARCHAR(50),
    "achievementData" JSONB DEFAULT '{}',

    CONSTRAINT "game_badge_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gameChallengeProgress" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "challengeType" "public"."GameChallengeType" NOT NULL,
    "challengeName" VARCHAR(255) NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completionDate" TIMESTAMP(3),
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "challengeRules" JSONB DEFAULT '{}',
    "progressData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_challenge_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connectedDevices" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "pluginId" VARCHAR(100) NOT NULL,
    "deviceName" VARCHAR(255) NOT NULL,
    "deviceModel" VARCHAR(255),
    "deviceType" "public"."DeviceType" NOT NULL,
    "manufacturer" VARCHAR(255),
    "serialNumber" VARCHAR(100),
    "firmwareVersion" VARCHAR(50),
    "connectionType" "public"."ConnectionType" NOT NULL,
    "deviceIdentifier" VARCHAR(255) NOT NULL,
    "connectionConfig" JSONB DEFAULT '{}',
    "lastConnected" TIMESTAMP(3),
    "connectionStatus" "public"."DeviceStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "lastSync" TIMESTAMP(3),
    "syncErrorCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedBy" UUID NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deviceReadings" (
    "id" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "pluginId" VARCHAR(100) NOT NULL,
    "medicalDeviceId" UUID,
    "vitalReadingId" UUID,
    "readingType" VARCHAR(100) NOT NULL,
    "measurementTimestamp" TIMESTAMP(3) NOT NULL,
    "receivedTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" JSONB NOT NULL DEFAULT '{}',
    "processedValues" JSONB NOT NULL DEFAULT '{}',
    "primaryValue" DECIMAL(10,3),
    "secondaryValue" DECIMAL(10,3),
    "measurementUnit" VARCHAR(50),
    "dataQualityScore" DECIMAL(3,2),
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validationNotes" TEXT,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "anomalyReason" VARCHAR(255),
    "readingContext" VARCHAR(255),
    "symptomsReported" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medicationTaken" BOOLEAN,
    "triggeredAlerts" BOOLEAN NOT NULL DEFAULT false,
    "alertReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "syncBatchId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."devicePlugins" (
    "id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "supportedDevices" "public"."DeviceType"[],
    "supportedRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "apiVersion" VARCHAR(10) NOT NULL,
    "defaultConfig" JSONB NOT NULL DEFAULT '{}',
    "oauthConfig" JSONB DEFAULT '{}',
    "rateLimits" JSONB DEFAULT '{}',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "device_plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medicalDevices" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "patientId" UUID,
    "deviceName" VARCHAR(255) NOT NULL,
    "deviceType" VARCHAR(100) NOT NULL,
    "manufacturer" VARCHAR(100) NOT NULL,
    "modelNumber" VARCHAR(100),
    "serialNumber" VARCHAR(100),
    "firmwareVersion" VARCHAR(50),
    "macAddress" VARCHAR(20),
    "ipAddress" VARCHAR(20),
    "bluetoothId" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'inactive',
    "lastConnected" TIMESTAMP(3),
    "lastDataSync" TIMESTAMP(3),
    "batteryLevel" INTEGER,
    "connectionType" VARCHAR(30) NOT NULL,
    "dataFrequency" VARCHAR(50),
    "calibrationDate" TIMESTAMP(3),
    "nextCalibrationDue" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "medical_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prescriptions" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "prescribingDoctorId" UUID,
    "prescribingHspId" UUID,
    "organizationId" UUID,
    "prescriptionNumber" VARCHAR(100) NOT NULL,
    "externalPrescriptionId" VARCHAR(100),
    "medicationName" VARCHAR(255) NOT NULL,
    "genericName" VARCHAR(255),
    "ndcNumber" VARCHAR(20),
    "rxnormCode" VARCHAR(20),
    "strength" VARCHAR(50) NOT NULL,
    "dosageForm" VARCHAR(50) NOT NULL,
    "routeOfAdministration" VARCHAR(30) NOT NULL,
    "doseAmount" DECIMAL(10,3) NOT NULL,
    "doseUnit" VARCHAR(20) NOT NULL,
    "frequency" VARCHAR(50) NOT NULL,
    "frequencyPerDay" INTEGER,
    "dosingSchedule" JSONB NOT NULL DEFAULT '[]',
    "sigInstructions" TEXT NOT NULL,
    "patientInstructions" TEXT,
    "foodInstructions" VARCHAR(100),
    "quantityPrescribed" INTEGER NOT NULL,
    "quantityUnit" VARCHAR(20) NOT NULL,
    "daysSupply" INTEGER,
    "refillsAllowed" INTEGER NOT NULL DEFAULT 0,
    "refillsUsed" INTEGER NOT NULL DEFAULT 0,
    "indication" VARCHAR(255),
    "diagnosisCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isControlledSubstance" BOOLEAN NOT NULL DEFAULT false,
    "deaSchedule" VARCHAR(5),
    "prescribedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "discontinuationReason" VARCHAR(100),
    "pharmacyId" UUID,
    "pharmacyName" VARCHAR(255),
    "pharmacyPhone" VARCHAR(20),
    "ePrescribingId" VARCHAR(100),
    "transmittedToPharmacy" BOOLEAN NOT NULL DEFAULT false,
    "transmissionDate" TIMESTAMP(3),
    "estimatedCost" DECIMAL(10,2),
    "insuranceCoverage" JSONB NOT NULL DEFAULT '{}',
    "drugInteractions" JSONB NOT NULL DEFAULT '[]',
    "allergyAlerts" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "prescriberNpi" VARCHAR(20),
    "prescriberDea" VARCHAR(20),
    "electronicSignature" TEXT,
    "requiresMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "monitoringParameters" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adherenceLogs" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "organizationId" UUID,
    "adherenceType" VARCHAR(30) NOT NULL,
    "relatedMedicationId" UUID,
    "relatedPrescriptionId" UUID,
    "relatedAppointmentId" UUID,
    "relatedCarePlanId" UUID,
    "relatedTreatmentPlanId" UUID,
    "scheduledDatetime" TIMESTAMP(3) NOT NULL,
    "actualDatetime" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "delayMinutes" INTEGER,
    "prescribedDose" DECIMAL(10,3),
    "actualDose" DECIMAL(10,3),
    "doseUnit" VARCHAR(20),
    "patientNotes" TEXT,
    "sideEffectsReported" JSONB NOT NULL DEFAULT '[]',
    "symptomsBefore" JSONB NOT NULL DEFAULT '{}',
    "symptomsAfter" JSONB NOT NULL DEFAULT '{}',
    "missedReason" VARCHAR(50),
    "missedReasonDetails" TEXT,
    "recordedBy" VARCHAR(20) NOT NULL DEFAULT 'patient',
    "recordedByUserId" UUID,
    "deviceId" UUID,
    "verificationMethod" VARCHAR(30),
    "moodBefore" INTEGER,
    "moodAfter" INTEGER,
    "location" VARCHAR(100),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "interventionTriggered" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "adherence_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blacklistedTokens" (
    "jti" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklisted_tokens_pkey" PRIMARY KEY ("jti")
);

-- CreateTable
CREATE TABLE "public"."_DeviceReadingToEmergencyAlert" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_DeviceReadingToEmergencyAlert_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_licenseNumber_key" ON "public"."organizations"("licenseNumber");

-- CreateIndex
CREATE INDEX "organizations_is_active" ON "public"."organizations"("isActive");

-- CreateIndex
CREATE INDEX "organizations_name" ON "public"."organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_type" ON "public"."organizations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email_status" ON "public"."users"("email", "accountStatus");

-- CreateIndex
CREATE INDEX "idx_users_role_status" ON "public"."users"("role", "accountStatus");

-- CreateIndex
CREATE INDEX "users_account_status" ON "public"."users"("accountStatus");

-- CreateIndex
CREATE INDEX "users_email_verified" ON "public"."users"("emailVerifiedLegacy");

-- CreateIndex
CREATE INDEX "users_full_name" ON "public"."users"("fullName");

-- CreateIndex
CREATE INDEX "users_last_login_at" ON "public"."users"("lastLoginAt");

-- CreateIndex
CREATE INDEX "users_phone" ON "public"."users"("phone");

-- CreateIndex
CREATE INDEX "users_role" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "accounts_userId_provider_idx" ON "public"."accounts"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_user_id" ON "public"."sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expires" ON "public"."sessions"("expires");

-- CreateIndex
CREATE INDEX "sessions_ip_address" ON "public"."sessions"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "verificationTokens_token_key" ON "public"."verificationTokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationTokens_identifier_token_key" ON "public"."verificationTokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "account_links_user_id" ON "public"."accountLinks"("userId");

-- CreateIndex
CREATE INDEX "account_links_provider" ON "public"."accountLinks"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "account_links_user_provider" ON "public"."accountLinks"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "account_links_provider_account" ON "public"."accountLinks"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "public"."patients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_medicalRecordNumber_key" ON "public"."patients"("medicalRecordNumber");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patientId_key" ON "public"."patients"("patientId");

-- CreateIndex
CREATE INDEX "idx_patients_doctor_created_active" ON "public"."patients"("primaryCareDoctorId", "createdAt", "isActive");

-- CreateIndex
CREATE INDEX "idx_patients_id_created" ON "public"."patients"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "patients_userId_doctorId" ON "public"."patients"("userId", "primaryCareDoctorId");

-- CreateIndex  
CREATE INDEX "patients_allergies_idx" ON "public"."patients" USING GIN ("allergies");

-- CreateIndex
CREATE INDEX "patients_isActive_idx" ON "public"."patients"("isActive");

-- CreateIndex
CREATE INDEX "patients_linkedProviderId_idx" ON "public"."patients"("linkedProviderId");

-- CreateIndex
CREATE INDEX "patients_medicalHistory_idx" ON "public"."patients" USING GIN ("medicalHistory");

-- CreateIndex
CREATE INDEX "patients_organizationId_idx" ON "public"."patients"("organizationId");

-- CreateIndex
CREATE INDEX "patients_primaryCareDoctorId_idx" ON "public"."patients"("primaryCareDoctorId");

-- CreateIndex
CREATE INDEX "patients_primaryCareHspId_idx" ON "public"."patients"("primaryCareHspId");

-- CreateIndex
CREATE INDEX "patients_providerConsentGiven_idx" ON "public"."patients"("providerConsentGiven");

-- CreateIndex
CREATE INDEX "patients_providerLinkedAt_idx" ON "public"."patients"("providerLinkedAt");

-- CreateIndex
CREATE INDEX "patients_riskLevel_idx" ON "public"."patients"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "healthcareProviders_userId_key" ON "public"."healthcareProviders"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "healthcareProviders_licenseNumber_key" ON "public"."healthcareProviders"("licenseNumber");

-- CreateIndex
CREATE INDEX "healthcareProviders_isVerified_idx" ON "public"."healthcareProviders"("isVerified");

-- CreateIndex
CREATE INDEX "healthcareProviders_organizationId_idx" ON "public"."healthcareProviders"("organizationId");

-- CreateIndex
CREATE INDEX "healthcareProviders_specialties_idx" ON "public"."healthcareProviders" USING GIN ("specialties");

-- CreateIndex
CREATE INDEX "healthcareProviders_verificationDate_idx" ON "public"."healthcareProviders"("verificationDate");

-- CreateIndex
CREATE INDEX "idx_providers_org_verified" ON "public"."healthcareProviders"("organizationId", "isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_name_key" ON "public"."specialties"("name");

-- CreateIndex
CREATE INDEX "clinics_doctorId_idx" ON "public"."clinics"("doctorId");

-- CreateIndex
CREATE INDEX "clinics_isActive_idx" ON "public"."clinics"("isActive");

-- CreateIndex
CREATE INDEX "clinics_isPrimary_idx" ON "public"."clinics"("isPrimary");

-- CreateIndex
CREATE INDEX "clinics_organizationId_idx" ON "public"."clinics"("organizationId");

-- CreateIndex
CREATE INDEX "idx_clinics_coordinates" ON "public"."clinics"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_clinics_location_verified" ON "public"."clinics"("locationVerified");

-- CreateIndex
CREATE INDEX "carePlans_chronicConditions_idx" ON "public"."carePlans" USING GIN ("chronicConditions");

-- CreateIndex
CREATE INDEX "carePlans_createdByDoctorId_idx" ON "public"."carePlans"("createdByDoctorId");

-- CreateIndex
CREATE INDEX "carePlans_createdByHspId_idx" ON "public"."carePlans"("createdByHspId");
-- CreateIndex
CREATE INDEX "carePlans_assignedDoctorId_idx" ON "public"."carePlans"("assignedDoctorId");
-- CreateIndex
CREATE INDEX "carePlans_assignedHspId_idx" ON "public"."carePlans"("assignedHspId");

-- CreateIndex
CREATE INDEX "carePlans_monitoringParameters_idx" ON "public"."carePlans" USING GIN ("monitoringParameters");

-- CreateIndex
CREATE INDEX "carePlans_nextReviewDate_idx" ON "public"."carePlans"("nextReviewDate");

-- CreateIndex
CREATE INDEX "carePlans_organizationId_idx" ON "public"."carePlans"("organizationId");

-- CreateIndex
CREATE INDEX "carePlans_patientId_idx" ON "public"."carePlans"("patientId");

-- CreateIndex
CREATE INDEX "carePlans_priority_idx" ON "public"."carePlans"("priority");

-- CreateIndex
CREATE INDEX "carePlans_startDate_idx" ON "public"."carePlans"("startDate");

-- CreateIndex
CREATE INDEX "carePlans_status_idx" ON "public"."carePlans"("status");

-- CreateIndex
CREATE INDEX "idx_careplans_patient_status_start_fixed" ON "public"."carePlans"("patientId", "status", "startDate");

-- CreateIndex
CREATE INDEX "medications_medicineId_idx" ON "public"."medications"("medicineId");

-- CreateIndex
CREATE INDEX "medications_organizerType_organizerId_idx" ON "public"."medications"("organizerType", "organizerId");

-- CreateIndex
CREATE INDEX "medications_participantId_idx" ON "public"."medications"("participantId");

-- CreateIndex
CREATE INDEX "appointments_organizerId_organizerType_idx" ON "public"."appointments"("organizerId", "organizerType");

-- CreateIndex
CREATE INDEX "appointments_participantOneId_participantOneType_idx" ON "public"."appointments"("participantOneId", "participantOneType");

-- CreateIndex
CREATE INDEX "appointments_participantTwoId_participantTwoType_idx" ON "public"."appointments"("participantTwoId", "participantTwoType");

-- CreateIndex
CREATE INDEX "appointments_slotId_idx" ON "public"."appointments"("slotId");

-- CreateIndex
CREATE INDEX "appointments_startDate_idx" ON "public"."appointments"("startDate");

-- CreateIndex
CREATE INDEX "appointments_carePlanId_idx" ON "public"."appointments"("carePlanId");

-- CreateIndex
CREATE INDEX "idx_appointments_organizer_time" ON "public"."appointments"("organizerType", "organizerId", "startTime");

-- CreateIndex
CREATE INDEX "idx_appointments_patient_time" ON "public"."appointments"("patientId", "startTime");

-- CreateIndex
CREATE INDEX "idx_appointments_provider_time" ON "public"."appointments"("providerId", "startTime");

-- CreateIndex
CREATE INDEX "doctorAvailability_doctorId_dayOfWeek_idx" ON "public"."doctorAvailability"("doctorId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "doctorAvailability_doctorId_isAvailable_idx" ON "public"."doctorAvailability"("doctorId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "vitalTypes_name_key" ON "public"."vitalTypes"("name");

-- CreateIndex
CREATE INDEX "vitalTypes_unit_idx" ON "public"."vitalTypes"("unit");

-- CreateIndex
CREATE INDEX "idx_vitals_patient_time_type" ON "public"."vitalReadings"("patientId", "readingTime", "vitalTypeId");

-- CreateIndex
CREATE INDEX "idx_vitals_patient_type_time_desc" ON "public"."vitalReadings"("patientId", "vitalTypeId", "readingTime");

-- CreateIndex
CREATE INDEX "idx_vitals_time_patient" ON "public"."vitalReadings"("readingTime", "patientId");

-- CreateIndex
CREATE INDEX "vitalReadings_alertLevel_idx" ON "public"."vitalReadings"("alertLevel");

-- CreateIndex
CREATE INDEX "vital_readings_blood_pressure_idx" ON "public"."vitalReadings"("systolicValue", "diastolicValue");

-- CreateIndex
CREATE INDEX "vitalReadings_isFlagged_idx" ON "public"."vitalReadings"("isFlagged");

-- CreateIndex
CREATE INDEX "vitalReadings_isValidated_idx" ON "public"."vitalReadings"("isValidated");

-- CreateIndex
CREATE INDEX "vitalReadings_patientId_idx" ON "public"."vitalReadings"("patientId");

-- CreateIndex
CREATE INDEX "vital_readings_patient_id_vital_type_id_reading_time" ON "public"."vitalReadings"("patientId", "vitalTypeId", "readingTime");

-- CreateIndex
CREATE INDEX "vitalReadings_readingTime_idx" ON "public"."vitalReadings"("readingTime");

-- CreateIndex
CREATE INDEX "vitalReadings_vitalTypeId_idx" ON "public"."vitalReadings"("vitalTypeId");

-- CreateIndex
CREATE INDEX "idx_symptoms_patient_onset_severity" ON "public"."symptoms"("patientId", "onsetTime", "severity");

-- CreateIndex
CREATE INDEX "symptoms_carePlanId_idx" ON "public"."symptoms"("carePlanId");

-- CreateIndex
CREATE INDEX "symptoms_onsetTime_idx" ON "public"."symptoms"("onsetTime");

-- CreateIndex
CREATE INDEX "symptoms_patientId_idx" ON "public"."symptoms"("patientId");

-- CreateIndex
CREATE INDEX "symptoms_patient_id_recorded_at" ON "public"."symptoms"("patientId", "recordedAt");

-- CreateIndex
CREATE INDEX "symptoms_recordedAt_idx" ON "public"."symptoms"("recordedAt");

-- CreateIndex
CREATE INDEX "symptoms_severity_idx" ON "public"."symptoms"("severity");

-- CreateIndex
CREATE INDEX "symptoms_symptomName_idx" ON "public"."symptoms"("symptomName");

-- CreateIndex
CREATE INDEX "adherenceRecords_adherenceType_idx" ON "public"."adherenceRecords"("adherenceType");

-- CreateIndex
CREATE INDEX "adherenceRecords_dueAt_idx" ON "public"."adherenceRecords"("dueAt");

-- CreateIndex
CREATE INDEX "adherenceRecords_isCompleted_isMissed_idx" ON "public"."adherenceRecords"("isCompleted", "isMissed");

-- CreateIndex
CREATE INDEX "adherenceRecords_patientId_idx" ON "public"."adherenceRecords"("patientId");

-- CreateIndex
CREATE INDEX "adherenceRecords_patientId_adherenceType_dueAt_idx" ON "public"."adherenceRecords"("patientId", "adherenceType", "dueAt");

-- CreateIndex
CREATE INDEX "adherenceRecords_patientId_dueAt_idx" ON "public"."adherenceRecords"("patientId", "dueAt");

-- CreateIndex
CREATE INDEX "adherenceRecords_scheduledEventId_idx" ON "public"."adherenceRecords"("scheduledEventId");

-- CreateIndex
CREATE INDEX "idx_adherence_event_status_completed" ON "public"."adherenceRecords"("scheduledEventId", "isCompleted", "recordedAt");

-- CreateIndex
CREATE INDEX "idx_adherence_patient_due_status" ON "public"."adherenceRecords"("patientId", "dueAt", "isCompleted");

-- CreateIndex
CREATE INDEX "servicePlans_billingCycle_idx" ON "public"."servicePlans"("billingCycle");

-- CreateIndex
CREATE INDEX "servicePlans_isActive_idx" ON "public"."servicePlans"("isActive");

-- CreateIndex
CREATE INDEX "servicePlans_name_idx" ON "public"."servicePlans"("name");

-- CreateIndex
CREATE INDEX "servicePlans_price_idx" ON "public"."servicePlans"("price");

-- CreateIndex
CREATE INDEX "servicePlans_providerId_idx" ON "public"."servicePlans"("providerId");

-- CreateIndex
CREATE INDEX "servicePlans_serviceType_idx" ON "public"."servicePlans"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "patientSubscriptions_stripeSubscriptionId_key" ON "public"."patientSubscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "patientSubscriptions_nextBillingDate_idx" ON "public"."patientSubscriptions"("nextBillingDate");

-- CreateIndex
CREATE INDEX "patientSubscriptions_patientId_idx" ON "public"."patientSubscriptions"("patientId");

-- CreateIndex
CREATE INDEX "patientSubscriptions_patientId_providerId_idx" ON "public"."patientSubscriptions"("patientId", "providerId");

-- CreateIndex
CREATE INDEX "patientSubscriptions_providerId_idx" ON "public"."patientSubscriptions"("providerId");

-- CreateIndex
CREATE INDEX "patientSubscriptions_servicePlanId_idx" ON "public"."patientSubscriptions"("servicePlanId");

-- CreateIndex
CREATE INDEX "patientSubscriptions_status_idx" ON "public"."patientSubscriptions"("status");

-- CreateIndex
CREATE INDEX "patientSubscriptions_stripeCustomerId_idx" ON "public"."patientSubscriptions"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "patientSubscriptions_stripeSubscriptionId_idx" ON "public"."patientSubscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "idx_assignments_doctor_active_created" ON "public"."patientDoctorAssignments"("doctorId", "isActive", "createdAt");

-- CreateIndex
CREATE INDEX "idx_assignments_patient_type_active" ON "public"."patientDoctorAssignments"("patientId", "assignmentType", "isActive");

-- CreateIndex
CREATE INDEX "patientDoctorAssignments_assignmentType_idx" ON "public"."patientDoctorAssignments"("assignmentType");

-- CreateIndex
CREATE INDEX "patientDoctorAssignments_doctorId_idx" ON "public"."patientDoctorAssignments"("doctorId");

-- CreateIndex
CREATE INDEX "patientDoctorAssignments_isActive_idx" ON "public"."patientDoctorAssignments"("isActive");

-- CreateIndex
CREATE INDEX "patientDoctorAssignments_patientConsentStatus_idx" ON "public"."patientDoctorAssignments"("patientConsentStatus");

-- CreateIndex
CREATE INDEX "patientDoctorAssignments_patientId_idx" ON "public"."patientDoctorAssignments"("patientId");

-- CreateIndex
CREATE INDEX "userDevices_deviceType_idx" ON "public"."userDevices"("deviceType");

-- CreateIndex
CREATE INDEX "userDevices_isActive_idx" ON "public"."userDevices"("isActive");

-- CreateIndex
CREATE INDEX "userDevices_lastUsedAt_idx" ON "public"."userDevices"("lastUsedAt");

-- CreateIndex
CREATE INDEX "userDevices_pushToken_idx" ON "public"."userDevices"("pushToken");

-- CreateIndex
CREATE INDEX "userDevices_userId_idx" ON "public"."userDevices"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "userDevices_userId_pushToken_key" ON "public"."userDevices"("userId", "pushToken");

-- CreateIndex
CREATE INDEX "idx_notifications_type_priority_created" ON "public"."notifications"("type", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_doctorId_idx" ON "public"."notifications"("doctorId");

-- CreateIndex
CREATE INDEX "notifications_expiresAt_idx" ON "public"."notifications"("expiresAt");

-- CreateIndex
CREATE INDEX "notifications_hspId_idx" ON "public"."notifications"("hspId");

-- CreateIndex
CREATE INDEX "notifications_isUrgent_idx" ON "public"."notifications"("isUrgent");

-- CreateIndex
CREATE INDEX "notifications_organizationId_idx" ON "public"."notifications"("organizationId");

-- CreateIndex
CREATE INDEX "notifications_patientId_idx" ON "public"."notifications"("patientId");

-- CreateIndex
CREATE INDEX "notifications_patient_id_status_created_at" ON "public"."notifications"("patientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "public"."notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_requiresAction_actionTaken_idx" ON "public"."notifications"("requiresAction", "actionTaken");

-- CreateIndex
CREATE INDEX "notifications_scheduledFor_idx" ON "public"."notifications"("scheduledFor");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "public"."notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_status_scheduled_for_expires_at" ON "public"."notifications"("status", "scheduledFor", "expiresAt");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "auditLogs_accessGranted_idx" ON "public"."auditLogs"("accessGranted");

-- CreateIndex
CREATE INDEX "auditLogs_action_idx" ON "public"."auditLogs"("action");

-- CreateIndex
CREATE INDEX "auditLogs_ipAddress_idx" ON "public"."auditLogs"("ipAddress");

-- CreateIndex
CREATE INDEX "auditLogs_organizationId_idx" ON "public"."auditLogs"("organizationId");

-- CreateIndex
CREATE INDEX "auditLogs_patientId_idx" ON "public"."auditLogs"("patientId");

-- CreateIndex
CREATE INDEX "auditLogs_patientId_phiAccessed_timestamp_idx" ON "public"."auditLogs"("patientId", "phiAccessed", "timestamp");

-- CreateIndex
CREATE INDEX "auditLogs_phiAccessed_idx" ON "public"."auditLogs"("phiAccessed");

-- CreateIndex
CREATE INDEX "auditLogs_retentionDate_idx" ON "public"."auditLogs"("retentionDate");

-- CreateIndex
CREATE INDEX "auditLogs_riskLevel_idx" ON "public"."auditLogs"("riskLevel");

-- CreateIndex
CREATE INDEX "auditLogs_riskLevel_accessGranted_timestamp_idx" ON "public"."auditLogs"("riskLevel", "accessGranted", "timestamp");

-- CreateIndex
CREATE INDEX "auditLogs_sessionId_idx" ON "public"."auditLogs"("sessionId");

-- CreateIndex
CREATE INDEX "auditLogs_timestamp_idx" ON "public"."auditLogs"("timestamp");

-- CreateIndex
CREATE INDEX "auditLogs_userId_idx" ON "public"."auditLogs"("userId");

-- CreateIndex
CREATE INDEX "auditLogs_userId_timestamp_idx" ON "public"."auditLogs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "idx_audit_user_created_action" ON "public"."auditLogs"("userId", "createdAt", "action");

-- CreateIndex
CREATE INDEX "auditLogs_entityType_idx" ON "public"."auditLogs"("entityType");

-- CreateIndex
CREATE INDEX "auditLogs_entityId_idx" ON "public"."auditLogs"("entityId");

-- CreateIndex
CREATE INDEX "appointmentSlots_date_isAvailable_idx" ON "public"."appointmentSlots"("date", "isAvailable");

-- CreateIndex
CREATE INDEX "appointmentSlots_doctorId_date_startTime_idx" ON "public"."appointmentSlots"("doctorId", "date", "startTime");

-- CreateIndex
CREATE INDEX "appointmentSlots_doctorId_isAvailable_idx" ON "public"."appointmentSlots"("doctorId", "isAvailable");

-- CreateIndex
CREATE INDEX "carePlanTemplates_conditions_idx" ON "public"."carePlanTemplates" USING GIN ("conditions");

-- CreateIndex
CREATE INDEX "carePlanTemplates_createdBy_idx" ON "public"."carePlanTemplates"("createdBy");

-- CreateIndex
CREATE INDEX "carePlanTemplates_isApproved_idx" ON "public"."carePlanTemplates"("isApproved");

-- CreateIndex
CREATE INDEX "carePlanTemplates_isPublic_idx" ON "public"."carePlanTemplates"("isPublic");

-- CreateIndex
CREATE INDEX "carePlanTemplates_name_idx" ON "public"."carePlanTemplates"("name");

-- CreateIndex
CREATE INDEX "carePlanTemplates_organizationId_idx" ON "public"."carePlanTemplates"("organizationId");

-- CreateIndex
CREATE INDEX "carePlanTemplates_specialties_idx" ON "public"."carePlanTemplates" USING GIN ("specialties");

-- CreateIndex
CREATE INDEX "carePlanTemplates_tags_idx" ON "public"."carePlanTemplates" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "dashboardMetrics_calculatedAt_validUntil_idx" ON "public"."dashboardMetrics"("calculatedAt", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "dashboardMetrics_entityType_entityId_metricType_key" ON "public"."dashboardMetrics"("entityType", "entityId", "metricType");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_userId_key" ON "public"."doctors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_doctorId_key" ON "public"."doctors"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_medicalLicenseNumber_key" ON "public"."doctors"("medicalLicenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_npiNumber_key" ON "public"."doctors"("npiNumber");

-- CreateIndex
CREATE INDEX "doctors_boardCertifications_idx" ON "public"."doctors" USING GIN ("boardCertifications");

-- CreateIndex
CREATE INDEX "doctors_gender_idx" ON "public"."doctors"("gender");

-- CreateIndex
CREATE INDEX "doctors_isVerified_idx" ON "public"."doctors"("isVerified");

-- CreateIndex
CREATE INDEX "doctors_isVerified_gender_idx" ON "public"."doctors"("isVerified", "gender");

-- CreateIndex
CREATE INDEX "doctors_organizationId_idx" ON "public"."doctors"("organizationId");

-- CreateIndex
CREATE INDEX "doctors_specialties_idx" ON "public"."doctors" USING GIN ("specialties");

-- CreateIndex
CREATE UNIQUE INDEX "hsps_userId_key" ON "public"."hsps"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "hsps_hspId_key" ON "public"."hsps"("hspId");

-- CreateIndex
CREATE UNIQUE INDEX "hsps_licenseNumber_key" ON "public"."hsps"("licenseNumber");

-- CreateIndex
CREATE INDEX "hsps_departments_idx" ON "public"."hsps" USING GIN ("departments");

-- CreateIndex
CREATE INDEX "hsps_hspType_idx" ON "public"."hsps"("hspType");

-- CreateIndex
CREATE INDEX "hsps_isVerified_idx" ON "public"."hsps"("isVerified");

-- CreateIndex
CREATE INDEX "hsps_organizationId_idx" ON "public"."hsps"("organizationId");

-- CreateIndex
CREATE INDEX "hsps_specializations_idx" ON "public"."hsps" USING GIN ("specializations");

-- CreateIndex
CREATE INDEX "hsps_supervisingDoctorId_idx" ON "public"."hsps"("supervisingDoctorId");

-- CreateIndex
CREATE INDEX "medicationLogs_adherenceStatus_scheduledAt_idx" ON "public"."medicationLogs"("adherenceStatus", "scheduledAt");

-- CreateIndex
CREATE INDEX "medicationLogs_medicationId_scheduledAt_idx" ON "public"."medicationLogs"("medicationId", "scheduledAt");

-- CreateIndex
CREATE INDEX "medicationLogs_patientId_scheduledAt_idx" ON "public"."medicationLogs"("patientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "patientAlerts_acknowledged_resolved_idx" ON "public"."patientAlerts"("acknowledged", "resolved");

-- CreateIndex
CREATE INDEX "patientAlerts_createdAt_idx" ON "public"."patientAlerts"("createdAt");

-- CreateIndex
CREATE INDEX "patientAlerts_patientId_alertType_severity_idx" ON "public"."patientAlerts"("patientId", "alertType", "severity");

-- CreateIndex
CREATE INDEX "patientConsentOtps_expiresAt_idx" ON "public"."patientConsentOtps"("expiresAt");

-- CreateIndex
CREATE INDEX "patientConsentOtps_generatedAt_idx" ON "public"."patientConsentOtps"("generatedAt");

-- CreateIndex
CREATE INDEX "patientConsentOtps_isBlocked_idx" ON "public"."patientConsentOtps"("isBlocked");

-- CreateIndex
CREATE INDEX "patientConsentOtps_isExpired_idx" ON "public"."patientConsentOtps"("isExpired");

-- CreateIndex
CREATE INDEX "patientConsentOtps_isVerified_idx" ON "public"."patientConsentOtps"("isVerified");

-- CreateIndex
CREATE INDEX "patientConsentOtps_otpCode_idx" ON "public"."patientConsentOtps"("otpCode");

-- CreateIndex
CREATE INDEX "patientConsentOtps_patientId_idx" ON "public"."patientConsentOtps"("patientId");

-- CreateIndex
CREATE INDEX "patientConsentOtps_requestedByUserId_idx" ON "public"."patientConsentOtps"("requestedByUserId");

-- CreateIndex
CREATE INDEX "patientConsentOtps_secondaryAssignmentId_idx" ON "public"."patientConsentOtps"("secondaryAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "patientProviderAssignments_patientId_providerId_role_endedA_key" ON "public"."patientProviderAssignments"("patientId", "providerId", "role", "endedAt");

-- CreateIndex
CREATE INDEX "patientProviderConsentHistory_consentRequestedAt_idx" ON "public"."patientProviderConsentHistory"("consentRequestedAt");

-- CreateIndex
CREATE INDEX "patientProviderConsentHistory_doctorId_idx" ON "public"."patientProviderConsentHistory"("doctorId");

-- CreateIndex
CREATE INDEX "patientProviderConsentHistory_hspId_idx" ON "public"."patientProviderConsentHistory"("hspId");

-- CreateIndex
CREATE INDEX "patientProviderConsentHistory_newProviderId_idx" ON "public"."patientProviderConsentHistory"("newProviderId");

-- CreateIndex
CREATE INDEX "patientProviderConsentHistory_patientId_status_idx" ON "public"."patientProviderConsentHistory"("patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "paymentMethods_stripePaymentMethodId_key" ON "public"."paymentMethods"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "paymentMethods_isActive_idx" ON "public"."paymentMethods"("isActive");

-- CreateIndex
CREATE INDEX "paymentMethods_isDefault_idx" ON "public"."paymentMethods"("isDefault");

-- CreateIndex
CREATE INDEX "paymentMethods_patientId_idx" ON "public"."paymentMethods"("patientId");

-- CreateIndex
CREATE INDEX "paymentMethods_stripePaymentMethodId_idx" ON "public"."paymentMethods"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "paymentMethods_type_idx" ON "public"."paymentMethods"("type");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "public"."payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "payments_billingPeriodStart_billingPeriodEnd_idx" ON "public"."payments"("billingPeriodStart", "billingPeriodEnd");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "public"."payments"("createdAt");

-- CreateIndex
CREATE INDEX "payments_patientId_idx" ON "public"."payments"("patientId");

-- CreateIndex
CREATE INDEX "payments_providerId_idx" ON "public"."payments"("providerId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_stripePaymentIntentId_idx" ON "public"."payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "public"."payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "payments_paymentMethodId_idx" ON "public"."payments"("paymentMethodId");

-- CreateIndex
CREATE INDEX "providerChanges_changeDate_idx" ON "public"."providerChanges"("changeDate");

-- CreateIndex
CREATE INDEX "providerChanges_newProviderId_idx" ON "public"."providerChanges"("newProviderId");

-- CreateIndex
CREATE INDEX "providerChanges_practitionerType_practitionerId_idx" ON "public"."providerChanges"("practitionerType", "practitionerId");

-- CreateIndex
CREATE INDEX "providerChanges_status_idx" ON "public"."providerChanges"("status");

-- CreateIndex
CREATE INDEX "providers_userId_idx" ON "public"."providers"("userId");

-- CreateIndex
CREATE INDEX "scheduleEvents_eventId_eventType_idx" ON "public"."scheduleEvents"("eventId", "eventType");

-- CreateIndex
CREATE INDEX "scheduleEvents_eventType_status_date_startTime_idx" ON "public"."scheduleEvents"("eventType", "status", "date", "startTime");

-- CreateIndex
CREATE INDEX "scheduleEvents_status_date_idx" ON "public"."scheduleEvents"("status", "date");

-- CreateIndex
CREATE INDEX "idx_events_careplan_time_type" ON "public"."scheduledEvents"("carePlanId", "scheduledFor", "eventType");

-- CreateIndex
CREATE INDEX "idx_events_patient_time_status" ON "public"."scheduledEvents"("patientId", "scheduledFor", "status");

-- CreateIndex
CREATE INDEX "scheduledEvents_carePlanId_idx" ON "public"."scheduledEvents"("carePlanId");

-- CreateIndex
CREATE INDEX "secondaryDoctorAssignments_accessGranted_idx" ON "public"."secondaryDoctorAssignments"("accessGranted");

-- CreateIndex
CREATE INDEX "secondaryDoctorAssignments_consentExpiresAt_idx" ON "public"."secondaryDoctorAssignments"("consentExpiresAt");

-- CreateIndex
CREATE INDEX "secondaryDoctorAssignments_consentStatus_idx" ON "public"."secondaryDoctorAssignments"("consentStatus");

-- CreateIndex
CREATE INDEX "secondaryDoctorAssignments_isActive_idx" ON "public"."secondaryDoctorAssignments"("isActive");

-- CreateIndex
CREATE INDEX "secondaryDoctorAssignments_patientId_idx" ON "public"."secondaryDoctorAssignments"("patientId");

-- CreateIndex
CREATE INDEX "secondaryDoctorAssignments_primaryDoctorId_idx" ON "public"."secondaryDoctorAssignments"("primaryDoctorId");

-- CreateIndex
CREATE INDEX "secondaryDoctorAssignments_secondaryDoctorId_idx" ON "public"."secondaryDoctorAssignments"("secondaryDoctorId");

-- CreateIndex
CREATE INDEX "secondaryDoctorAssignments_secondaryHspId_idx" ON "public"."secondaryDoctorAssignments"("secondaryHspId");

-- CreateIndex
CREATE UNIQUE INDEX "symptomsDatabase_diagnosisName_key" ON "public"."symptomsDatabase"("diagnosisName");

-- CreateIndex
CREATE INDEX "symptomsDatabase_category_idx" ON "public"."symptomsDatabase"("category");

-- CreateIndex
CREATE INDEX "symptomsDatabase_isActive_idx" ON "public"."symptomsDatabase"("isActive");

-- CreateIndex
CREATE INDEX "symptomsDatabase_symptoms_idx" ON "public"."symptomsDatabase" USING GIN ("symptoms");

-- CreateIndex
CREATE UNIQUE INDEX "treatmentDatabase_treatmentName_key" ON "public"."treatmentDatabase"("treatmentName");

-- CreateIndex
CREATE INDEX "treatmentDatabase_applicableConditions_idx" ON "public"."treatmentDatabase" USING GIN ("applicableConditions");

-- CreateIndex
CREATE INDEX "treatmentDatabase_category_idx" ON "public"."treatmentDatabase"("category");

-- CreateIndex
CREATE INDEX "treatmentDatabase_isActive_idx" ON "public"."treatmentDatabase"("isActive");

-- CreateIndex
CREATE INDEX "treatmentDatabase_severityLevel_idx" ON "public"."treatmentDatabase"("severityLevel");

-- CreateIndex
CREATE INDEX "treatmentDatabase_treatmentType_idx" ON "public"."treatmentDatabase"("treatmentType");

-- CreateIndex
CREATE INDEX "treatmentPlans_doctorId_idx" ON "public"."treatmentPlans"("doctorId");

-- CreateIndex
CREATE INDEX "treatmentPlans_endDate_idx" ON "public"."treatmentPlans"("endDate");

-- CreateIndex
CREATE INDEX "treatmentPlans_followUpDate_idx" ON "public"."treatmentPlans"("followUpDate");

-- CreateIndex
CREATE INDEX "treatmentPlans_organizationId_idx" ON "public"."treatmentPlans"("organizationId");

-- CreateIndex
CREATE INDEX "treatmentPlans_patientId_idx" ON "public"."treatmentPlans"("patientId");

-- CreateIndex
CREATE INDEX "treatmentPlans_primaryDiagnosis_idx" ON "public"."treatmentPlans"("primaryDiagnosis");

-- CreateIndex
CREATE INDEX "treatmentPlans_priority_idx" ON "public"."treatmentPlans"("priority");

-- CreateIndex
CREATE INDEX "treatmentPlans_secondaryDiagnoses_idx" ON "public"."treatmentPlans" USING GIN ("secondaryDiagnoses");

-- CreateIndex
CREATE INDEX "treatmentPlans_startDate_idx" ON "public"."treatmentPlans"("startDate");

-- CreateIndex
CREATE INDEX "treatmentPlans_status_idx" ON "public"."treatmentPlans"("status");

-- CreateIndex
CREATE INDEX "treatmentPlans_symptoms_idx" ON "public"."treatmentPlans" USING GIN ("symptoms");

-- CreateIndex
CREATE INDEX "idx_userroles_identity_linked" ON "public"."userRoleAssignments"("userIdentity", "linkedWith");

-- CreateIndex
CREATE INDEX "vitalRequirements_carePlanId_idx" ON "public"."vitalRequirements"("carePlanId");

-- CreateIndex
CREATE INDEX "vitalRequirements_frequency_idx" ON "public"."vitalRequirements"("frequency");

-- CreateIndex
CREATE INDEX "vitalRequirements_isCritical_idx" ON "public"."vitalRequirements"("isCritical");

-- CreateIndex
CREATE INDEX "vitalRequirements_vitalTypeId_idx" ON "public"."vitalRequirements"("vitalTypeId");

-- CreateIndex
CREATE INDEX "vitals_carePlanId_idx" ON "public"."vitals"("carePlanId");

-- CreateIndex
CREATE INDEX "vitals_vitalTemplateId_idx" ON "public"."vitals"("vitalTemplateId");

-- CreateIndex
CREATE INDEX "drugInteractions_severityLevel_idx" ON "public"."drugInteractions"("severityLevel");

-- CreateIndex
CREATE INDEX "drugInteractions_drugNameOne_drugNameTwo_idx" ON "public"."drugInteractions"("drugNameOne", "drugNameTwo");

-- CreateIndex
CREATE UNIQUE INDEX "drugInteractions_rxcuiOne_rxcuiTwo_key" ON "public"."drugInteractions"("rxcuiOne", "rxcuiTwo");

-- CreateIndex
CREATE INDEX "patientAllergies_patientId_isActive_idx" ON "public"."patientAllergies"("patientId", "isActive");

-- CreateIndex
CREATE INDEX "patientAllergies_allergenType_allergenName_idx" ON "public"."patientAllergies"("allergenType", "allergenName");

-- CreateIndex
CREATE INDEX "medicationSafetyAlerts_patientId_severity_resolved_idx" ON "public"."medicationSafetyAlerts"("patientId", "severity", "resolved");

-- CreateIndex
CREATE INDEX "medicationSafetyAlerts_alertType_createdAt_idx" ON "public"."medicationSafetyAlerts"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "medicationSafetyAlerts_resolved_createdAt_idx" ON "public"."medicationSafetyAlerts"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "emergencyAlerts_patientId_priorityLevel_acknowledged_resolv_idx" ON "public"."emergencyAlerts"("patientId", "priorityLevel", "acknowledged", "resolved");

-- CreateIndex
CREATE INDEX "emergencyAlerts_alertType_createdAt_idx" ON "public"."emergencyAlerts"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "emergencyAlerts_resolved_createdAt_idx" ON "public"."emergencyAlerts"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "vitalAlertRules_vitalType_isActive_idx" ON "public"."vitalAlertRules"("vitalType", "isActive");

-- CreateIndex
CREATE INDEX "vitalAlertRules_alertLevel_idx" ON "public"."vitalAlertRules"("alertLevel");

-- CreateIndex
CREATE INDEX "emergencyContacts_patientId_priorityOrder_idx" ON "public"."emergencyContacts"("patientId", "priorityOrder");

-- CreateIndex
CREATE INDEX "emergencyContacts_patientId_isActive_idx" ON "public"."emergencyContacts"("patientId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "videoConsultations_consultationId_key" ON "public"."videoConsultations"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "videoConsultations_roomId_key" ON "public"."videoConsultations"("roomId");

-- CreateIndex
CREATE INDEX "videoConsultations_doctorId_scheduledStart_idx" ON "public"."videoConsultations"("doctorId", "scheduledStart");

-- CreateIndex
CREATE INDEX "videoConsultations_patientId_status_idx" ON "public"."videoConsultations"("patientId", "status");

-- CreateIndex
CREATE INDEX "videoConsultations_status_scheduledStart_idx" ON "public"."videoConsultations"("status", "scheduledStart");

-- CreateIndex
CREATE INDEX "videoConsultations_consultationType_priority_idx" ON "public"."videoConsultations"("consultationType", "priority");

-- CreateIndex
CREATE INDEX "consultationPrescriptions_consultationId_idx" ON "public"."consultationPrescriptions"("consultationId");

-- CreateIndex
CREATE INDEX "consultationNotes_consultationId_noteType_idx" ON "public"."consultationNotes"("consultationId", "noteType");

-- CreateIndex
CREATE UNIQUE INDEX "labOrders_orderNumber_key" ON "public"."labOrders"("orderNumber");

-- CreateIndex
CREATE INDEX "labOrders_patientId_status_idx" ON "public"."labOrders"("patientId", "status");

-- CreateIndex
CREATE INDEX "labOrders_doctorId_orderDate_idx" ON "public"."labOrders"("doctorId", "orderDate");

-- CreateIndex
CREATE INDEX "labOrders_status_expectedResultDate_idx" ON "public"."labOrders"("status", "expectedResultDate");

-- CreateIndex
CREATE INDEX "labResults_labOrderId_idx" ON "public"."labResults"("labOrderId");

-- CreateIndex
CREATE INDEX "labResults_testName_resultDate_idx" ON "public"."labResults"("testName", "resultDate");

-- CreateIndex
CREATE INDEX "labResults_criticalFlag_resultDate_idx" ON "public"."labResults"("criticalFlag", "resultDate");

-- CreateIndex
CREATE UNIQUE INDEX "patientGameProfiles_patientId_key" ON "public"."patientGameProfiles"("patientId");

-- CreateIndex
CREATE INDEX "patientGameProfiles_totalPoints_currentLevel_idx" ON "public"."patientGameProfiles"("totalPoints", "currentLevel");

-- CreateIndex
CREATE INDEX "patientGameProfiles_patientId_lastActivity_idx" ON "public"."patientGameProfiles"("patientId", "lastActivity");

-- CreateIndex
CREATE INDEX "gameBadgeAwards_patientId_awardedDate_idx" ON "public"."gameBadgeAwards"("patientId", "awardedDate");

-- CreateIndex
CREATE INDEX "gameBadgeAwards_badgeType_idx" ON "public"."gameBadgeAwards"("badgeType");

-- CreateIndex
CREATE INDEX "gameChallengeProgress_patientId_isCompleted_idx" ON "public"."gameChallengeProgress"("patientId", "isCompleted");

-- CreateIndex
CREATE INDEX "gameChallengeProgress_challengeType_endDate_idx" ON "public"."gameChallengeProgress"("challengeType", "endDate");

-- CreateIndex
CREATE INDEX "connectedDevices_pluginId_deviceType_idx" ON "public"."connectedDevices"("pluginId", "deviceType");

-- CreateIndex
CREATE INDEX "connectedDevices_patientId_connectionStatus_idx" ON "public"."connectedDevices"("patientId", "connectionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "connectedDevices_patientId_deviceIdentifier_key" ON "public"."connectedDevices"("patientId", "deviceIdentifier");

-- CreateIndex
CREATE INDEX "deviceReadings_patientId_readingType_measurementTimestamp_idx" ON "public"."deviceReadings"("patientId", "readingType", "measurementTimestamp");

-- CreateIndex
CREATE INDEX "deviceReadings_deviceId_measurementTimestamp_idx" ON "public"."deviceReadings"("deviceId", "measurementTimestamp");

-- CreateIndex
CREATE INDEX "deviceReadings_pluginId_readingType_idx" ON "public"."deviceReadings"("pluginId", "readingType");

-- CreateIndex
CREATE INDEX "deviceReadings_triggeredAlerts_measurementTimestamp_idx" ON "public"."deviceReadings"("triggeredAlerts", "measurementTimestamp");

-- CreateIndex
CREATE INDEX "medicalDevices_patientId_idx" ON "public"."medicalDevices"("patientId");

-- CreateIndex
CREATE INDEX "medicalDevices_deviceType_idx" ON "public"."medicalDevices"("deviceType");

-- CreateIndex
CREATE INDEX "medicalDevices_status_idx" ON "public"."medicalDevices"("status");

-- CreateIndex
CREATE INDEX "medicalDevices_organizationId_idx" ON "public"."medicalDevices"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_prescriptionNumber_key" ON "public"."prescriptions"("prescriptionNumber");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_idx" ON "public"."prescriptions"("patientId");

-- CreateIndex
CREATE INDEX "prescriptions_prescribingDoctorId_idx" ON "public"."prescriptions"("prescribingDoctorId");

-- CreateIndex
CREATE INDEX "prescriptions_prescribingHspId_idx" ON "public"."prescriptions"("prescribingHspId");

-- CreateIndex
CREATE INDEX "prescriptions_organizationId_idx" ON "public"."prescriptions"("organizationId");

-- CreateIndex
CREATE INDEX "prescriptions_status_idx" ON "public"."prescriptions"("status");

-- CreateIndex
CREATE INDEX "prescriptions_prescribedDate_idx" ON "public"."prescriptions"("prescribedDate");

-- CreateIndex
CREATE INDEX "prescriptions_expirationDate_idx" ON "public"."prescriptions"("expirationDate");

-- CreateIndex
CREATE INDEX "prescriptions_isControlledSubstance_idx" ON "public"."prescriptions"("isControlledSubstance");

-- CreateIndex
CREATE INDEX "prescriptions_medicationName_idx" ON "public"."prescriptions"("medicationName");

-- CreateIndex
CREATE INDEX "prescriptions_ndcNumber_idx" ON "public"."prescriptions"("ndcNumber");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_status_prescribedDate_idx" ON "public"."prescriptions"("patientId", "status", "prescribedDate");

-- CreateIndex
CREATE INDEX "adherenceLogs_patientId_idx" ON "public"."adherenceLogs"("patientId");

-- CreateIndex
CREATE INDEX "adherenceLogs_organizationId_idx" ON "public"."adherenceLogs"("organizationId");

-- CreateIndex
CREATE INDEX "adherenceLogs_adherenceType_idx" ON "public"."adherenceLogs"("adherenceType");

-- CreateIndex
CREATE INDEX "adherenceLogs_status_idx" ON "public"."adherenceLogs"("status");

-- CreateIndex
CREATE INDEX "adherenceLogs_scheduledDatetime_idx" ON "public"."adherenceLogs"("scheduledDatetime");

-- CreateIndex
CREATE INDEX "adherenceLogs_actualDatetime_idx" ON "public"."adherenceLogs"("actualDatetime");

-- CreateIndex
CREATE INDEX "adherenceLogs_relatedMedicationId_idx" ON "public"."adherenceLogs"("relatedMedicationId");

-- CreateIndex
CREATE INDEX "adherenceLogs_relatedCarePlanId_idx" ON "public"."adherenceLogs"("relatedCarePlanId");

-- CreateIndex
CREATE INDEX "adherenceLogs_patientId_adherenceType_scheduledDatetime_idx" ON "public"."adherenceLogs"("patientId", "adherenceType", "scheduledDatetime");

-- CreateIndex
CREATE INDEX "adherenceLogs_relatedMedicationId_status_scheduledDatetime_idx" ON "public"."adherenceLogs"("relatedMedicationId", "status", "scheduledDatetime");

-- CreateIndex
CREATE INDEX "adherenceLogs_patientId_status_createdAt_idx" ON "public"."adherenceLogs"("patientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "blacklistedTokens_expiresAt_idx" ON "public"."blacklistedTokens"("expiresAt");

-- CreateIndex
CREATE INDEX "_DeviceReadingToEmergencyAlert_B_index" ON "public"."_DeviceReadingToEmergencyAlert"("B");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accountLinks" ADD CONSTRAINT "accountLinks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_linkedProviderId_fkey" FOREIGN KEY ("linkedProviderId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_primaryCareDoctorId_fkey" FOREIGN KEY ("primaryCareDoctorId") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_primaryCareHspId_fkey" FOREIGN KEY ("primaryCareHspId") REFERENCES "public"."hsps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."healthcareProviders" ADD CONSTRAINT "healthcareProviders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."healthcareProviders" ADD CONSTRAINT "healthcareProviders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."healthcareProviders" ADD CONSTRAINT "healthcareProviders_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."clinics" ADD CONSTRAINT "clinics_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clinics" ADD CONSTRAINT "clinics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."carePlans" ADD CONSTRAINT "carePlans_createdByDoctorId_fkey" FOREIGN KEY ("createdByDoctorId") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carePlans" ADD CONSTRAINT "carePlans_createdByHspId_fkey" FOREIGN KEY ("createdByHspId") REFERENCES "public"."hsps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
-- AddForeignKey
ALTER TABLE "public"."carePlans" ADD CONSTRAINT "carePlans_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "public"."doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
-- AddForeignKey
ALTER TABLE "public"."carePlans" ADD CONSTRAINT "carePlans_assignedHspId_fkey" FOREIGN KEY ("assignedHspId") REFERENCES "public"."hsps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."carePlans" ADD CONSTRAINT "carePlans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."carePlans" ADD CONSTRAINT "carePlans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medications" ADD CONSTRAINT "medications_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medications" ADD CONSTRAINT "medications_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "public"."medicines"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "public"."appointmentSlots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctorAvailability" ADD CONSTRAINT "doctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vitalReadings" ADD CONSTRAINT "vitalReadings_adherenceRecordId_fkey" FOREIGN KEY ("adherenceRecordId") REFERENCES "public"."adherenceRecords"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vitalReadings" ADD CONSTRAINT "vitalReadings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vitalReadings" ADD CONSTRAINT "vitalReadings_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "public"."healthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vitalReadings" ADD CONSTRAINT "vitalReadings_vitalTypeId_fkey" FOREIGN KEY ("vitalTypeId") REFERENCES "public"."vitalTypes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."symptoms" ADD CONSTRAINT "symptoms_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."symptoms" ADD CONSTRAINT "symptoms_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."adherenceRecords" ADD CONSTRAINT "adherenceRecords_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."adherenceRecords" ADD CONSTRAINT "adherenceRecords_scheduledEventId_fkey" FOREIGN KEY ("scheduledEventId") REFERENCES "public"."scheduledEvents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."servicePlans" ADD CONSTRAINT "servicePlans_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."healthcareProviders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientSubscriptions" ADD CONSTRAINT "patientSubscriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientSubscriptions" ADD CONSTRAINT "patientSubscriptions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."healthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientSubscriptions" ADD CONSTRAINT "patientSubscriptions_servicePlanId_fkey" FOREIGN KEY ("servicePlanId") REFERENCES "public"."servicePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientDoctorAssignments" ADD CONSTRAINT "patientDoctorAssignments_assignedByAdminId_fkey" FOREIGN KEY ("assignedByAdminId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientDoctorAssignments" ADD CONSTRAINT "patientDoctorAssignments_assignedByDoctorId_fkey" FOREIGN KEY ("assignedByDoctorId") REFERENCES "public"."doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientDoctorAssignments" ADD CONSTRAINT "patientDoctorAssignments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientDoctorAssignments" ADD CONSTRAINT "patientDoctorAssignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."userDevices" ADD CONSTRAINT "userDevices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."hsps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_relatedAppointmentId_fkey" FOREIGN KEY ("relatedAppointmentId") REFERENCES "public"."appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_relatedCarePlanId_fkey" FOREIGN KEY ("relatedCarePlanId") REFERENCES "public"."carePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_relatedMedicationId_fkey" FOREIGN KEY ("relatedMedicationId") REFERENCES "public"."medications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_relatedTreatmentPlanId_fkey" FOREIGN KEY ("relatedTreatmentPlanId") REFERENCES "public"."treatmentPlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."auditLogs" ADD CONSTRAINT "auditLogs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."auditLogs" ADD CONSTRAINT "auditLogs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."auditLogs" ADD CONSTRAINT "auditLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointmentSlots" ADD CONSTRAINT "appointmentSlots_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."carePlanTemplates" ADD CONSTRAINT "carePlanTemplates_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."carePlanTemplates" ADD CONSTRAINT "carePlanTemplates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."healthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."carePlanTemplates" ADD CONSTRAINT "carePlanTemplates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."carePlanTemplates" ADD CONSTRAINT "carePlanTemplates_parentTemplateId_fkey" FOREIGN KEY ("parentTemplateId") REFERENCES "public"."carePlanTemplates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."hsps" ADD CONSTRAINT "hsps_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."hsps" ADD CONSTRAINT "hsps_supervisingDoctorId_fkey" FOREIGN KEY ("supervisingDoctorId") REFERENCES "public"."doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."hsps" ADD CONSTRAINT "hsps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."hsps" ADD CONSTRAINT "hsps_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."medicationLogs" ADD CONSTRAINT "medicationLogs_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "public"."medications"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicationLogs" ADD CONSTRAINT "medicationLogs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientAlerts" ADD CONSTRAINT "patientAlerts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientConsentOtps" ADD CONSTRAINT "patientConsentOtps_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientConsentOtps" ADD CONSTRAINT "patientConsentOtps_primaryDoctorId_fkey" FOREIGN KEY ("primaryDoctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientConsentOtps" ADD CONSTRAINT "patientConsentOtps_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientConsentOtps" ADD CONSTRAINT "patientConsentOtps_secondaryAssignmentId_fkey" FOREIGN KEY ("secondaryAssignmentId") REFERENCES "public"."secondaryDoctorAssignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientConsentOtps" ADD CONSTRAINT "patientConsentOtps_secondaryDoctorId_fkey" FOREIGN KEY ("secondaryDoctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientConsentOtps" ADD CONSTRAINT "patientConsentOtps_secondaryHspId_fkey" FOREIGN KEY ("secondaryHspId") REFERENCES "public"."hsps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientProviderAssignments" ADD CONSTRAINT "patientProviderAssignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientProviderAssignments" ADD CONSTRAINT "patientProviderAssignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientProviderAssignments" ADD CONSTRAINT "patientProviderAssignments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."healthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientProviderConsentHistory" ADD CONSTRAINT "patientProviderConsentHistory_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientProviderConsentHistory" ADD CONSTRAINT "patientProviderConsentHistory_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."hsps"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientProviderConsentHistory" ADD CONSTRAINT "patientProviderConsentHistory_newProviderId_fkey" FOREIGN KEY ("newProviderId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientProviderConsentHistory" ADD CONSTRAINT "patientProviderConsentHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patientProviderConsentHistory" ADD CONSTRAINT "patientProviderConsentHistory_previousProviderId_fkey" FOREIGN KEY ("previousProviderId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."paymentMethods" ADD CONSTRAINT "paymentMethods_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."paymentMethods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."healthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."patientSubscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."providerChanges" ADD CONSTRAINT "providerChanges_newProviderId_fkey" FOREIGN KEY ("newProviderId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."providerChanges" ADD CONSTRAINT "providerChanges_previousProviderId_fkey" FOREIGN KEY ("previousProviderId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."providers" ADD CONSTRAINT "providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scheduledEvents" ADD CONSTRAINT "scheduledEvents_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scheduledEvents" ADD CONSTRAINT "scheduledEvents_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scheduledEvents" ADD CONSTRAINT "scheduledEvents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."secondaryDoctorAssignments" ADD CONSTRAINT "secondaryDoctorAssignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondaryDoctorAssignments" ADD CONSTRAINT "secondaryDoctorAssignments_primaryDoctorId_fkey" FOREIGN KEY ("primaryDoctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondaryDoctorAssignments" ADD CONSTRAINT "secondaryDoctorAssignments_primaryDoctorProviderId_fkey" FOREIGN KEY ("primaryDoctorProviderId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondaryDoctorAssignments" ADD CONSTRAINT "secondaryDoctorAssignments_secondaryDoctorId_fkey" FOREIGN KEY ("secondaryDoctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondaryDoctorAssignments" ADD CONSTRAINT "secondaryDoctorAssignments_secondaryDoctorProviderId_fkey" FOREIGN KEY ("secondaryDoctorProviderId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondaryDoctorAssignments" ADD CONSTRAINT "secondaryDoctorAssignments_secondaryHspId_fkey" FOREIGN KEY ("secondaryHspId") REFERENCES "public"."hsps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatmentPlans" ADD CONSTRAINT "treatmentPlans_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatmentPlans" ADD CONSTRAINT "treatmentPlans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."treatmentPlans" ADD CONSTRAINT "treatmentPlans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."userRoleAssignments" ADD CONSTRAINT "userRoleAssignments_userIdentity_fkey" FOREIGN KEY ("userIdentity") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vitalRequirements" ADD CONSTRAINT "vitalRequirements_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vitalRequirements" ADD CONSTRAINT "vitalRequirements_vitalTypeId_fkey" FOREIGN KEY ("vitalTypeId") REFERENCES "public"."vitalTypes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vitals" ADD CONSTRAINT "vitals_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vitals" ADD CONSTRAINT "vitals_vitalTemplateId_fkey" FOREIGN KEY ("vitalTemplateId") REFERENCES "public"."vitalTemplates"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientAllergies" ADD CONSTRAINT "patientAllergies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientAllergies" ADD CONSTRAINT "patientAllergies_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicationSafetyAlerts" ADD CONSTRAINT "medicationSafetyAlerts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicationSafetyAlerts" ADD CONSTRAINT "medicationSafetyAlerts_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "public"."medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicationSafetyAlerts" ADD CONSTRAINT "medicationSafetyAlerts_drugInteractionId_fkey" FOREIGN KEY ("drugInteractionId") REFERENCES "public"."drugInteractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicationSafetyAlerts" ADD CONSTRAINT "medicationSafetyAlerts_patientAllergyId_fkey" FOREIGN KEY ("patientAllergyId") REFERENCES "public"."patientAllergies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicationSafetyAlerts" ADD CONSTRAINT "medicationSafetyAlerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicationSafetyAlerts" ADD CONSTRAINT "medicationSafetyAlerts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergencyAlerts" ADD CONSTRAINT "emergencyAlerts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergencyAlerts" ADD CONSTRAINT "emergencyAlerts_vitalReadingId_fkey" FOREIGN KEY ("vitalReadingId") REFERENCES "public"."vitalReadings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergencyAlerts" ADD CONSTRAINT "emergencyAlerts_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergencyAlerts" ADD CONSTRAINT "emergencyAlerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vitalAlertRules" ADD CONSTRAINT "vitalAlertRules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergencyContacts" ADD CONSTRAINT "emergencyContacts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."videoConsultations" ADD CONSTRAINT "videoConsultations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."videoConsultations" ADD CONSTRAINT "videoConsultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."videoConsultations" ADD CONSTRAINT "videoConsultations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."videoConsultations" ADD CONSTRAINT "videoConsultations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultationPrescriptions" ADD CONSTRAINT "consultationPrescriptions_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "public"."videoConsultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultationNotes" ADD CONSTRAINT "consultationNotes_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "public"."videoConsultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultationNotes" ADD CONSTRAINT "consultationNotes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."labOrders" ADD CONSTRAINT "labOrders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."labOrders" ADD CONSTRAINT "labOrders_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."labOrders" ADD CONSTRAINT "labOrders_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "public"."videoConsultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."labResults" ADD CONSTRAINT "labResults_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "public"."labOrders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patientGameProfiles" ADD CONSTRAINT "patientGameProfiles_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gameBadgeAwards" ADD CONSTRAINT "gameBadgeAwards_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patientGameProfiles"("patientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gameChallengeProgress" ADD CONSTRAINT "gameChallengeProgress_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patientGameProfiles"("patientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connectedDevices" ADD CONSTRAINT "connectedDevices_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connectedDevices" ADD CONSTRAINT "connectedDevices_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deviceReadings" ADD CONSTRAINT "deviceReadings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."connectedDevices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deviceReadings" ADD CONSTRAINT "deviceReadings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deviceReadings" ADD CONSTRAINT "deviceReadings_vitalReadingId_fkey" FOREIGN KEY ("vitalReadingId") REFERENCES "public"."vitalReadings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deviceReadings" ADD CONSTRAINT "deviceReadings_medicalDeviceId_fkey" FOREIGN KEY ("medicalDeviceId") REFERENCES "public"."medicalDevices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicalDevices" ADD CONSTRAINT "medicalDevices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medicalDevices" ADD CONSTRAINT "medicalDevices_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_prescribingDoctorId_fkey" FOREIGN KEY ("prescribingDoctorId") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_prescribingHspId_fkey" FOREIGN KEY ("prescribingHspId") REFERENCES "public"."hsps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prescriptions" ADD CONSTRAINT "prescriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adherenceLogs" ADD CONSTRAINT "adherenceLogs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adherenceLogs" ADD CONSTRAINT "adherenceLogs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adherenceLogs" ADD CONSTRAINT "adherenceLogs_relatedMedicationId_fkey" FOREIGN KEY ("relatedMedicationId") REFERENCES "public"."medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adherenceLogs" ADD CONSTRAINT "adherenceLogs_relatedPrescriptionId_fkey" FOREIGN KEY ("relatedPrescriptionId") REFERENCES "public"."prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adherenceLogs" ADD CONSTRAINT "adherenceLogs_relatedAppointmentId_fkey" FOREIGN KEY ("relatedAppointmentId") REFERENCES "public"."appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adherenceLogs" ADD CONSTRAINT "adherenceLogs_relatedCarePlanId_fkey" FOREIGN KEY ("relatedCarePlanId") REFERENCES "public"."carePlans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adherenceLogs" ADD CONSTRAINT "adherenceLogs_relatedTreatmentPlanId_fkey" FOREIGN KEY ("relatedTreatmentPlanId") REFERENCES "public"."treatmentPlans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adherenceLogs" ADD CONSTRAINT "adherenceLogs_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" ADD CONSTRAINT "_DeviceReadingToEmergencyAlert_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."deviceReadings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" ADD CONSTRAINT "_DeviceReadingToEmergencyAlert_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."emergencyAlerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "public"."DietPlan" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(100),
    "total_calories" DECIMAL(6,2),
    "start_date" DATE,
    "end_date" DATE,
    "details" JSONB,
    "expired_on" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutPlan" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(100),
    "calories_burned" DECIMAL(6,2),
    "start_date" DATE,
    "end_date" DATE,
    "time" TIMESTAMP(3),
    "details" JSONB,
    "expired_on" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CarePlanToDietPlan" (
    "carePlanId" UUID NOT NULL,
    "dietPlanId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "CarePlanToDietPlan_pkey" PRIMARY KEY ("carePlanId","dietPlanId")
);

-- CreateTable
CREATE TABLE "public"."CarePlanToWorkoutPlan" (
    "carePlanId" UUID NOT NULL,
    "workoutPlanId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "CarePlanToWorkoutPlan_pkey" PRIMARY KEY ("carePlanId","workoutPlanId")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patientId" UUID NOT NULL,
    "carePlanId" UUID,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DietPlan_name_key" ON "public"."DietPlan"("name");

-- CreateIndex
CREATE INDEX "DietPlan_type_idx" ON "public"."DietPlan"("type");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutPlan_name_key" ON "public"."WorkoutPlan"("name");

-- CreateIndex
CREATE INDEX "WorkoutPlan_type_idx" ON "public"."WorkoutPlan"("type");

-- AddForeignKey
ALTER TABLE "public"."CarePlanToDietPlan" ADD CONSTRAINT "CarePlanToDietPlan_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlanToDietPlan" ADD CONSTRAINT "CarePlanToDietPlan_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "public"."DietPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlanToWorkoutPlan" ADD CONSTRAINT "CarePlanToWorkoutPlan_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlanToWorkoutPlan" ADD CONSTRAINT "CarePlanToWorkoutPlan_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "public"."WorkoutPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
