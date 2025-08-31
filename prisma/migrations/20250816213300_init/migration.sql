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
CREATE TYPE "public"."ScheduleEventType" AS ENUM ('APPOINTMENT', 'REMINDER', 'medication-reminder', 'VITALS', 'careplan-activation', 'DIET', 'WORKOUT');

-- CreateEnum
CREATE TYPE "public"."ScheduleEventStatus" AS ENUM ('SCHEDULED', 'PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'STARTED', 'PRIOR');

-- CreateEnum
CREATE TYPE "public"."ScheduledEventType" AS ENUM ('MEDICATION', 'APPOINTMENT', 'VITAL_CHECK', 'SYMPTOM_LOG', 'DIET_LOG', 'EXERCISE', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."ScheduledEventPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ScheduledEventStatus" AS ENUM ('SCHEDULED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PatientDoctorAssignmentType" AS ENUM ('PRIMARY', 'SPECIALIST', 'SUBSTITUTE', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "public"."PatientDoctorAssignmentConsentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."SecondaryDoctorAssignmentConsentStatus" AS ENUM ('PENDING', 'REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ServicePlanBillingCycle" AS ENUM ('MONTHLY', 'YEARLY', 'one-time', 'WEEKLY');

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
CREATE TABLE "public"."Organizations" (
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

                                          CONSTRAINT "Organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Users" (
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

                                  CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Accounts" (
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

                                     CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sessions" (
                                     "id" TEXT NOT NULL,
                                     "sessionToken" TEXT NOT NULL,
                                     "userId" UUID NOT NULL,
                                     "expires" TIMESTAMP(3) NOT NULL,
                                     "ipAddress" VARCHAR(45),
                                     "userAgent" TEXT,
                                     "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     "lastAccessedAt" TIMESTAMPTZ(6),
                                     "healthcareContext" JSONB DEFAULT '{}',

                                     CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationTokens" (
                                               "identifier" TEXT NOT NULL,
                                               "token" TEXT NOT NULL,
                                               "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."AccountLinks" (
                                         "id" UUID NOT NULL,
                                         "userId" UUID NOT NULL,
                                         "provider" VARCHAR(50) NOT NULL,
                                         "providerAccountId" VARCHAR(255) NOT NULL,
                                         "providerEmail" VARCHAR(255),
                                         "linkedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                         "lastUsedAt" TIMESTAMPTZ(6),
                                         "isPrimary" BOOLEAN NOT NULL DEFAULT false,
                                         "metadata" JSONB DEFAULT '{}',

                                         CONSTRAINT "AccountLinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Patients" (
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
                                     "primaryLanguage" VARCHAR(10) DEFAULT 'en',
                                     "riskLevel" VARCHAR(20) DEFAULT 'low',
                                     "riskFactors" JSONB DEFAULT '[]',
                                     "communicationPreferences" JSONB DEFAULT '{"language": "en", "time_zone": "UTC", "health_tips": false, "medication_reminders": true, "appointment_reminders": true, "research_participation": false, "preferred_contact_method": "email"}',
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

                                     CONSTRAINT "Patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HealthcareProviders" (
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
                                                "notificationPreferences" JSONB DEFAULT '{"patient_updates": true, "marketing_emails": false, "sms_notifications": true, "push_notifications": true, "system_notifications": true, "appointment_reminders": true}',
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

                                                CONSTRAINT "HealthcareProviders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Specialties" (
                                        "id" SERIAL NOT NULL,
                                        "name" VARCHAR(255) NOT NULL,
                                        "description" VARCHAR(1000),
                                        "userCreated" INTEGER,
                                        "createdAt" TIMESTAMPTZ(6) NOT NULL,
                                        "updatedAt" TIMESTAMPTZ(6),
                                        "deletedAt" TIMESTAMP(3),

                                        CONSTRAINT "Specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Clinics" (
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

                                    CONSTRAINT "Clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CarePlans" (
                                      "id" UUID NOT NULL,
                                      "patientId" UUID NOT NULL,
                                      "createdByDoctorId" UUID,
                                      "createdByHspId" UUID,
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

                                      CONSTRAINT "CarePlans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Medicines" (
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

                                      CONSTRAINT "Medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Medications" (
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

                                        CONSTRAINT "Medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appointments" (
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
                                         "startDate" DATE,
                                         "endDate" DATE,
                                         "startTime" TIMESTAMP(3),
                                         "endTime" TIMESTAMP(3),
                                         "rrRule" VARCHAR(1000),
                                         "details" JSON,
                                         "createdAt" TIMESTAMP(3) NOT NULL,
                                         "updatedAt" TIMESTAMP(3) NOT NULL,
                                         "deletedAt" TIMESTAMP(3),
                                         "doctorId" UUID,
                                         "patientId" UUID,
                                         "slotId" UUID,

                                         CONSTRAINT "Appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorAvailability" (
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

                                               CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VitalTypes" (
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

                                       CONSTRAINT "VitalTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VitalReadings" (
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

                                          CONSTRAINT "VitalReadings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Symptoms" (
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

                                     CONSTRAINT "Symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdherenceRecords" (
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

                                             CONSTRAINT "AdherenceRecords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServicePlans" (
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

                                         CONSTRAINT "ServicePlans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientSubscriptions" (
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

                                                 CONSTRAINT "PatientSubscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientDoctorAssignments" (
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

                                                     CONSTRAINT "PatientDoctorAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserDevices" (
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

                                        CONSTRAINT "UserDevices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notifications" (
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

                                          CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLogs" (
                                      "id" UUID NOT NULL,
                                      "userId" UUID,
                                      "userRole" VARCHAR(50),
                                      "organizationId" UUID,
                                      "action" VARCHAR(10) NOT NULL,
                                      "resource" VARCHAR(500) NOT NULL,
                                      "patientId" UUID,
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

                                      CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SequelizeMeta" (
                                          "name" VARCHAR(255) NOT NULL,

                                          CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "public"."AppointmentSlot" (
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

                                            CONSTRAINT "AppointmentSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CarePlanTemplates" (
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

                                              CONSTRAINT "CarePlanTemplates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DashboardMetrics" (
                                             "id" UUID NOT NULL,
                                             "entityType" "public"."DashboardMetricsEntityType" NOT NULL,
                                             "entityId" UUID NOT NULL,
                                             "metricType" VARCHAR(100) NOT NULL,
                                             "metricData" JSONB NOT NULL DEFAULT '{}',
                                             "calculatedAt" TIMESTAMP(3) NOT NULL,
                                             "validUntil" TIMESTAMP(3),
                                             "createdAt" TIMESTAMP(3),
                                             "updatedAt" TIMESTAMP(3),

                                             CONSTRAINT "DashboardMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Doctors" (
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
                                    "notificationPreferences" JSONB DEFAULT '{"patient_updates": true, "emergency_alerts": true, "peer_consultations": true, "system_notifications": true, "appointment_reminders": true}',
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

                                    CONSTRAINT "Doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HSPs" (
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
                                 "createdAt" TIMESTAMP(3),
                                 "updatedAt" TIMESTAMP(3),
                                 "deletedAt" TIMESTAMP(3),

                                 CONSTRAINT "HSPs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MedicationLogs" (
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

                                           CONSTRAINT "MedicationLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientAlerts" (
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

                                          CONSTRAINT "PatientAlerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientConsentOtp" (
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

                                              CONSTRAINT "PatientConsentOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientProviderAssignments" (
                                                       "id" UUID NOT NULL,
                                                       "patientId" UUID NOT NULL,
                                                       "providerId" UUID NOT NULL,
                                                       "role" VARCHAR(50) DEFAULT 'primary',
                                                       "assignedAt" TIMESTAMP(3),
                                                       "assignedBy" UUID,
                                                       "endedAt" TIMESTAMP(3),
                                                       "notes" TEXT,

                                                       CONSTRAINT "PatientProviderAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientProviderConsentHistory" (
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

                                                          CONSTRAINT "PatientProviderConsentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentMethods" (
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

                                           CONSTRAINT "PaymentMethods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payments" (
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

                                     CONSTRAINT "Payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderChanges" (
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

                                            CONSTRAINT "ProviderChanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Providers" (
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

                                      CONSTRAINT "Providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduleEvents" (
                                           "id" UUID NOT NULL,
                                           "critical" BOOLEAN,
                                           "eventType" "public"."ScheduleEventType",
                                           "eventId" UUID,
                                           "details" JSON,
                                           "status" "public"."ScheduleEventStatus" NOT NULL DEFAULT 'PENDING',
                                           "date" DATE,
                                           "startTime" TIMESTAMP(3),
                                           "endTime" TIMESTAMP(3),
                                           "createdAt" TIMESTAMP(3),
                                           "updatedAt" TIMESTAMP(3),
                                           "deletedAt" TIMESTAMP(3),

                                           CONSTRAINT "ScheduleEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduledEvents" (
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

                                            CONSTRAINT "ScheduledEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecondaryDoctorAssignments" (
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

                                                       CONSTRAINT "SecondaryDoctorAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SymptomsDatabase" (
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

                                             CONSTRAINT "SymptomsDatabase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TreatmentDatabase" (
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

                                              CONSTRAINT "TreatmentDatabase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TreatmentPlans" (
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

                                           CONSTRAINT "TreatmentPlans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRoleAssignments" (
                                                "id" UUID NOT NULL,
                                                "userIdentity" UUID NOT NULL,
                                                "linkedWith" "public"."UserRoleLinkedWith",
                                                "linkedId" UUID,
                                                "createdAt" TIMESTAMP(3) NOT NULL,
                                                "updatedAt" TIMESTAMP(3) NOT NULL,
                                                "deletedAt" TIMESTAMP(3),

                                                CONSTRAINT "UserRoleAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VitalRequirements" (
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

                                              CONSTRAINT "VitalRequirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VitalTemplates" (
                                           "id" UUID NOT NULL,
                                           "name" VARCHAR(255) NOT NULL,
                                           "unit" VARCHAR(255),
                                           "details" JSON,
                                           "createdAt" TIMESTAMP(3) NOT NULL,
                                           "updatedAt" TIMESTAMP(3) NOT NULL,
                                           "deletedAt" TIMESTAMP(3),

                                           CONSTRAINT "VitalTemplates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vitals" (
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

                                   CONSTRAINT "Vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DrugInteractions" (
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

                                             CONSTRAINT "DrugInteractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientAllergies" (
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

                                             CONSTRAINT "PatientAllergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MedicationSafetyAlerts" (
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

                                                   CONSTRAINT "MedicationSafetyAlerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmergencyAlerts" (
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

                                            CONSTRAINT "EmergencyAlerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VitalAlertRules" (
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

                                            CONSTRAINT "VitalAlertRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmergencyContacts" (
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

                                              CONSTRAINT "EmergencyContacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoConsultations" (
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

                                               CONSTRAINT "VideoConsultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConsultationPrescriptions" (
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

                                                      CONSTRAINT "ConsultationPrescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConsultationNotes" (
                                              "id" UUID NOT NULL,
                                              "consultationId" UUID NOT NULL,
                                              "noteType" VARCHAR(50) NOT NULL,
                                              "content" TEXT NOT NULL,
                                              "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                              "createdBy" UUID NOT NULL,

                                              CONSTRAINT "ConsultationNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabOrders" (
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

                                      CONSTRAINT "LabOrders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabResults" (
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

                                       CONSTRAINT "LabResults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientGameProfiles" (
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

                                                CONSTRAINT "PatientGameProfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameBadgeAwards" (
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

                                            CONSTRAINT "GameBadgeAwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameChallengeProgress" (
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

                                                  CONSTRAINT "GameChallengeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConnectedDevices" (
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

                                             CONSTRAINT "ConnectedDevices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeviceReadings" (
                                           "id" UUID NOT NULL,
                                           "deviceId" UUID NOT NULL,
                                           "patientId" UUID NOT NULL,
                                           "pluginId" VARCHAR(100) NOT NULL,
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

                                           CONSTRAINT "DeviceReadings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DevicePlugins" (
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

                                          CONSTRAINT "DevicePlugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_DeviceReadingToEmergencyAlert" (
                                                           "A" UUID NOT NULL,
                                                           "B" UUID NOT NULL,

                                                           CONSTRAINT "_DeviceReadingToEmergencyAlert_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizations_licenseNumber_key" ON "public"."Organizations"("licenseNumber");

-- CreateIndex
CREATE INDEX "organizations_is_active" ON "public"."Organizations"("isActive");

-- CreateIndex
CREATE INDEX "organizations_name" ON "public"."Organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_type" ON "public"."Organizations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "public"."Users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email_status" ON "public"."Users"("email", "accountStatus");

-- CreateIndex
CREATE INDEX "idx_users_role_status" ON "public"."Users"("role", "accountStatus");

-- CreateIndex
CREATE INDEX "users_account_status" ON "public"."Users"("accountStatus");

-- CreateIndex
CREATE INDEX "users_email_verified" ON "public"."Users"("emailVerifiedLegacy");

-- CreateIndex
CREATE INDEX "users_full_name" ON "public"."Users"("fullName");

-- CreateIndex
CREATE INDEX "users_last_login_at" ON "public"."Users"("lastLoginAt");

-- CreateIndex
CREATE INDEX "users_phone" ON "public"."Users"("phone");

-- CreateIndex
CREATE INDEX "users_role" ON "public"."Users"("role");

-- CreateIndex
CREATE INDEX "Accounts_userId_provider_idx" ON "public"."Accounts"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_provider_providerAccountId_key" ON "public"."Accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_sessionToken_key" ON "public"."Sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_user_id" ON "public"."Sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expires" ON "public"."Sessions"("expires");

-- CreateIndex
CREATE INDEX "sessions_ip_address" ON "public"."Sessions"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationTokens_token_key" ON "public"."VerificationTokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationTokens_identifier_token_key" ON "public"."VerificationTokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "account_links_user_id" ON "public"."AccountLinks"("userId");

-- CreateIndex
CREATE INDEX "account_links_provider" ON "public"."AccountLinks"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "account_links_user_provider" ON "public"."AccountLinks"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "account_links_provider_account" ON "public"."AccountLinks"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Patients_userId_key" ON "public"."Patients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Patients_medicalRecordNumber_key" ON "public"."Patients"("medicalRecordNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Patients_patientId_key" ON "public"."Patients"("patientId");

-- CreateIndex
CREATE INDEX "idx_patients_doctor_created_active" ON "public"."Patients"("primaryCareDoctorId", "createdAt", "isActive");

-- CreateIndex
CREATE INDEX "idx_patients_id_created" ON "public"."Patients"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_patients_user_doctor" ON "public"."Patients"("userId", "primaryCareDoctorId");

-- CreateIndex
CREATE INDEX "Patients_allergies_idx" ON "public"."Patients" USING GIN ("allergies");

-- CreateIndex
CREATE INDEX "Patients_isActive_idx" ON "public"."Patients"("isActive");

-- CreateIndex
CREATE INDEX "Patients_linkedProviderId_idx" ON "public"."Patients"("linkedProviderId");

-- CreateIndex
CREATE INDEX "Patients_medicalHistory_idx" ON "public"."Patients" USING GIN ("medicalHistory");

-- CreateIndex
CREATE INDEX "Patients_organizationId_idx" ON "public"."Patients"("organizationId");

-- CreateIndex
CREATE INDEX "Patients_primaryCareDoctorId_idx" ON "public"."Patients"("primaryCareDoctorId");

-- CreateIndex
CREATE INDEX "Patients_primaryCareHspId_idx" ON "public"."Patients"("primaryCareHspId");

-- CreateIndex
CREATE INDEX "Patients_providerConsentGiven_idx" ON "public"."Patients"("providerConsentGiven");

-- CreateIndex
CREATE INDEX "Patients_providerLinkedAt_idx" ON "public"."Patients"("providerLinkedAt");

-- CreateIndex
CREATE INDEX "Patients_riskLevel_idx" ON "public"."Patients"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProviders_userId_key" ON "public"."HealthcareProviders"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProviders_licenseNumber_key" ON "public"."HealthcareProviders"("licenseNumber");

-- CreateIndex
CREATE INDEX "HealthcareProviders_isVerified_idx" ON "public"."HealthcareProviders"("isVerified");

-- CreateIndex
CREATE INDEX "HealthcareProviders_organizationId_idx" ON "public"."HealthcareProviders"("organizationId");

-- CreateIndex
CREATE INDEX "HealthcareProviders_specialties_idx" ON "public"."HealthcareProviders" USING GIN ("specialties");

-- CreateIndex
CREATE INDEX "HealthcareProviders_verificationDate_idx" ON "public"."HealthcareProviders"("verificationDate");

-- CreateIndex
CREATE INDEX "idx_providers_org_verified" ON "public"."HealthcareProviders"("organizationId", "isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "Specialties_name_key" ON "public"."Specialties"("name");

-- CreateIndex
CREATE INDEX "Clinics_doctorId_idx" ON "public"."Clinics"("doctorId");

-- CreateIndex
CREATE INDEX "Clinics_isActive_idx" ON "public"."Clinics"("isActive");

-- CreateIndex
CREATE INDEX "Clinics_isPrimary_idx" ON "public"."Clinics"("isPrimary");

-- CreateIndex
CREATE INDEX "Clinics_organizationId_idx" ON "public"."Clinics"("organizationId");

-- CreateIndex
CREATE INDEX "idx_clinics_coordinates" ON "public"."Clinics"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_clinics_location_verified" ON "public"."Clinics"("locationVerified");

-- CreateIndex
CREATE INDEX "CarePlans_chronicConditions_idx" ON "public"."CarePlans" USING GIN ("chronicConditions");

-- CreateIndex
CREATE INDEX "CarePlans_createdByDoctorId_idx" ON "public"."CarePlans"("createdByDoctorId");

-- CreateIndex
CREATE INDEX "CarePlans_createdByHspId_idx" ON "public"."CarePlans"("createdByHspId");

-- CreateIndex
CREATE INDEX "CarePlans_monitoringParameters_idx" ON "public"."CarePlans" USING GIN ("monitoringParameters");

-- CreateIndex
CREATE INDEX "CarePlans_nextReviewDate_idx" ON "public"."CarePlans"("nextReviewDate");

-- CreateIndex
CREATE INDEX "CarePlans_organizationId_idx" ON "public"."CarePlans"("organizationId");

-- CreateIndex
CREATE INDEX "CarePlans_patientId_idx" ON "public"."CarePlans"("patientId");

-- CreateIndex
CREATE INDEX "CarePlans_priority_idx" ON "public"."CarePlans"("priority");

-- CreateIndex
CREATE INDEX "CarePlans_startDate_idx" ON "public"."CarePlans"("startDate");

-- CreateIndex
CREATE INDEX "CarePlans_status_idx" ON "public"."CarePlans"("status");

-- CreateIndex
CREATE INDEX "idx_careplans_patient_status_start_fixed" ON "public"."CarePlans"("patientId", "status", "startDate");

-- CreateIndex
CREATE INDEX "Medications_medicineId_idx" ON "public"."Medications"("medicineId");

-- CreateIndex
CREATE INDEX "Medications_organizerType_organizerId_idx" ON "public"."Medications"("organizerType", "organizerId");

-- CreateIndex
CREATE INDEX "Medications_participantId_idx" ON "public"."Medications"("participantId");

-- CreateIndex
CREATE INDEX "Appointments_organizerId_organizerType_idx" ON "public"."Appointments"("organizerId", "organizerType");

-- CreateIndex
CREATE INDEX "Appointments_participantOneId_participantOneType_idx" ON "public"."Appointments"("participantOneId", "participantOneType");

-- CreateIndex
CREATE INDEX "Appointments_participantTwoId_participantTwoType_idx" ON "public"."Appointments"("participantTwoId", "participantTwoType");

-- CreateIndex
CREATE INDEX "Appointments_slotId_idx" ON "public"."Appointments"("slotId");

-- CreateIndex
CREATE INDEX "Appointments_startDate_idx" ON "public"."Appointments"("startDate");

-- CreateIndex
CREATE INDEX "idx_appointments_organizer_time" ON "public"."Appointments"("organizerType", "organizerId", "startTime");

-- CreateIndex
CREATE INDEX "idx_appointments_patient_time" ON "public"."Appointments"("patientId", "startTime");

-- CreateIndex
CREATE INDEX "idx_appointments_provider_time" ON "public"."Appointments"("providerId", "startTime");

-- CreateIndex
CREATE INDEX "DoctorAvailability_doctorId_dayOfWeek_idx" ON "public"."DoctorAvailability"("doctorId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "DoctorAvailability_doctorId_isAvailable_idx" ON "public"."DoctorAvailability"("doctorId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "VitalTypes_name_key" ON "public"."VitalTypes"("name");

-- CreateIndex
CREATE INDEX "VitalTypes_unit_idx" ON "public"."VitalTypes"("unit");

-- CreateIndex
CREATE INDEX "idx_vitals_patient_time_type" ON "public"."VitalReadings"("patientId", "readingTime", "vitalTypeId");

-- CreateIndex
CREATE INDEX "idx_vitals_patient_type_time_desc" ON "public"."VitalReadings"("patientId", "vitalTypeId", "readingTime");

-- CreateIndex
CREATE INDEX "idx_vitals_time_patient" ON "public"."VitalReadings"("readingTime", "patientId");

-- CreateIndex
CREATE INDEX "VitalReadings_alertLevel_idx" ON "public"."VitalReadings"("alertLevel");

-- CreateIndex
CREATE INDEX "vital_readings_blood_pressure_idx" ON "public"."VitalReadings"("systolicValue", "diastolicValue");

-- CreateIndex
CREATE INDEX "VitalReadings_isFlagged_idx" ON "public"."VitalReadings"("isFlagged");

-- CreateIndex
CREATE INDEX "VitalReadings_isValidated_idx" ON "public"."VitalReadings"("isValidated");

-- CreateIndex
CREATE INDEX "VitalReadings_patientId_idx" ON "public"."VitalReadings"("patientId");

-- CreateIndex
CREATE INDEX "vital_readings_patient_id_vital_type_id_reading_time" ON "public"."VitalReadings"("patientId", "vitalTypeId", "readingTime");

-- CreateIndex
CREATE INDEX "VitalReadings_readingTime_idx" ON "public"."VitalReadings"("readingTime");

-- CreateIndex
CREATE INDEX "VitalReadings_vitalTypeId_idx" ON "public"."VitalReadings"("vitalTypeId");

-- CreateIndex
CREATE INDEX "idx_symptoms_patient_onset_severity" ON "public"."Symptoms"("patientId", "onsetTime", "severity");

-- CreateIndex
CREATE INDEX "Symptoms_carePlanId_idx" ON "public"."Symptoms"("carePlanId");

-- CreateIndex
CREATE INDEX "Symptoms_onsetTime_idx" ON "public"."Symptoms"("onsetTime");

-- CreateIndex
CREATE INDEX "Symptoms_patientId_idx" ON "public"."Symptoms"("patientId");

-- CreateIndex
CREATE INDEX "symptoms_patient_id_recorded_at" ON "public"."Symptoms"("patientId", "recordedAt");

-- CreateIndex
CREATE INDEX "Symptoms_recordedAt_idx" ON "public"."Symptoms"("recordedAt");

-- CreateIndex
CREATE INDEX "Symptoms_severity_idx" ON "public"."Symptoms"("severity");

-- CreateIndex
CREATE INDEX "Symptoms_symptomName_idx" ON "public"."Symptoms"("symptomName");

-- CreateIndex
CREATE INDEX "AdherenceRecords_adherenceType_idx" ON "public"."AdherenceRecords"("adherenceType");

-- CreateIndex
CREATE INDEX "AdherenceRecords_dueAt_idx" ON "public"."AdherenceRecords"("dueAt");

-- CreateIndex
CREATE INDEX "AdherenceRecords_isCompleted_isMissed_idx" ON "public"."AdherenceRecords"("isCompleted", "isMissed");

-- CreateIndex
CREATE INDEX "AdherenceRecords_patientId_idx" ON "public"."AdherenceRecords"("patientId");

-- CreateIndex
CREATE INDEX "AdherenceRecords_patientId_adherenceType_dueAt_idx" ON "public"."AdherenceRecords"("patientId", "adherenceType", "dueAt");

-- CreateIndex
CREATE INDEX "AdherenceRecords_patientId_dueAt_idx" ON "public"."AdherenceRecords"("patientId", "dueAt");

-- CreateIndex
CREATE INDEX "AdherenceRecords_scheduledEventId_idx" ON "public"."AdherenceRecords"("scheduledEventId");

-- CreateIndex
CREATE INDEX "idx_adherence_event_status_completed" ON "public"."AdherenceRecords"("scheduledEventId", "isCompleted", "recordedAt");

-- CreateIndex
CREATE INDEX "idx_adherence_patient_due_status" ON "public"."AdherenceRecords"("patientId", "dueAt", "isCompleted");

-- CreateIndex
CREATE INDEX "ServicePlans_billingCycle_idx" ON "public"."ServicePlans"("billingCycle");

-- CreateIndex
CREATE INDEX "ServicePlans_isActive_idx" ON "public"."ServicePlans"("isActive");

-- CreateIndex
CREATE INDEX "ServicePlans_name_idx" ON "public"."ServicePlans"("name");

-- CreateIndex
CREATE INDEX "ServicePlans_price_idx" ON "public"."ServicePlans"("price");

-- CreateIndex
CREATE INDEX "ServicePlans_providerId_idx" ON "public"."ServicePlans"("providerId");

-- CreateIndex
CREATE INDEX "ServicePlans_serviceType_idx" ON "public"."ServicePlans"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "PatientSubscriptions_stripeSubscriptionId_key" ON "public"."PatientSubscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "PatientSubscriptions_nextBillingDate_idx" ON "public"."PatientSubscriptions"("nextBillingDate");

-- CreateIndex
CREATE INDEX "PatientSubscriptions_patientId_idx" ON "public"."PatientSubscriptions"("patientId");

-- CreateIndex
CREATE INDEX "PatientSubscriptions_patientId_providerId_idx" ON "public"."PatientSubscriptions"("patientId", "providerId");

-- CreateIndex
CREATE INDEX "PatientSubscriptions_providerId_idx" ON "public"."PatientSubscriptions"("providerId");

-- CreateIndex
CREATE INDEX "PatientSubscriptions_servicePlanId_idx" ON "public"."PatientSubscriptions"("servicePlanId");

-- CreateIndex
CREATE INDEX "PatientSubscriptions_status_idx" ON "public"."PatientSubscriptions"("status");

-- CreateIndex
CREATE INDEX "PatientSubscriptions_stripeCustomerId_idx" ON "public"."PatientSubscriptions"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "PatientSubscriptions_stripeSubscriptionId_idx" ON "public"."PatientSubscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "idx_assignments_doctor_active_created" ON "public"."PatientDoctorAssignments"("doctorId", "isActive", "createdAt");

-- CreateIndex
CREATE INDEX "idx_assignments_patient_type_active" ON "public"."PatientDoctorAssignments"("patientId", "assignmentType", "isActive");

-- CreateIndex
CREATE INDEX "PatientDoctorAssignments_assignmentType_idx" ON "public"."PatientDoctorAssignments"("assignmentType");

-- CreateIndex
CREATE INDEX "PatientDoctorAssignments_doctorId_idx" ON "public"."PatientDoctorAssignments"("doctorId");

-- CreateIndex
CREATE INDEX "PatientDoctorAssignments_isActive_idx" ON "public"."PatientDoctorAssignments"("isActive");

-- CreateIndex
CREATE INDEX "PatientDoctorAssignments_patientConsentStatus_idx" ON "public"."PatientDoctorAssignments"("patientConsentStatus");

-- CreateIndex
CREATE INDEX "PatientDoctorAssignments_patientId_idx" ON "public"."PatientDoctorAssignments"("patientId");

-- CreateIndex
CREATE INDEX "UserDevices_deviceType_idx" ON "public"."UserDevices"("deviceType");

-- CreateIndex
CREATE INDEX "UserDevices_isActive_idx" ON "public"."UserDevices"("isActive");

-- CreateIndex
CREATE INDEX "UserDevices_lastUsedAt_idx" ON "public"."UserDevices"("lastUsedAt");

-- CreateIndex
CREATE INDEX "UserDevices_pushToken_idx" ON "public"."UserDevices"("pushToken");

-- CreateIndex
CREATE INDEX "UserDevices_userId_idx" ON "public"."UserDevices"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevices_userId_pushToken_key" ON "public"."UserDevices"("userId", "pushToken");

-- CreateIndex
CREATE INDEX "idx_notifications_type_priority_created" ON "public"."Notifications"("type", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "Notifications_doctorId_idx" ON "public"."Notifications"("doctorId");

-- CreateIndex
CREATE INDEX "Notifications_expiresAt_idx" ON "public"."Notifications"("expiresAt");

-- CreateIndex
CREATE INDEX "Notifications_hspId_idx" ON "public"."Notifications"("hspId");

-- CreateIndex
CREATE INDEX "Notifications_isUrgent_idx" ON "public"."Notifications"("isUrgent");

-- CreateIndex
CREATE INDEX "Notifications_organizationId_idx" ON "public"."Notifications"("organizationId");

-- CreateIndex
CREATE INDEX "Notifications_patientId_idx" ON "public"."Notifications"("patientId");

-- CreateIndex
CREATE INDEX "notifications_patient_id_status_created_at" ON "public"."Notifications"("patientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notifications_priority_idx" ON "public"."Notifications"("priority");

-- CreateIndex
CREATE INDEX "Notifications_requiresAction_actionTaken_idx" ON "public"."Notifications"("requiresAction", "actionTaken");

-- CreateIndex
CREATE INDEX "Notifications_scheduledFor_idx" ON "public"."Notifications"("scheduledFor");

-- CreateIndex
CREATE INDEX "Notifications_status_idx" ON "public"."Notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_status_scheduled_for_expires_at" ON "public"."Notifications"("status", "scheduledFor", "expiresAt");

-- CreateIndex
CREATE INDEX "Notifications_type_idx" ON "public"."Notifications"("type");

-- CreateIndex
CREATE INDEX "AuditLogs_accessGranted_idx" ON "public"."AuditLogs"("accessGranted");

-- CreateIndex
CREATE INDEX "AuditLogs_action_idx" ON "public"."AuditLogs"("action");

-- CreateIndex
CREATE INDEX "AuditLogs_ipAddress_idx" ON "public"."AuditLogs"("ipAddress");

-- CreateIndex
CREATE INDEX "AuditLogs_organizationId_idx" ON "public"."AuditLogs"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLogs_patientId_idx" ON "public"."AuditLogs"("patientId");

-- CreateIndex
CREATE INDEX "AuditLogs_patientId_phiAccessed_timestamp_idx" ON "public"."AuditLogs"("patientId", "phiAccessed", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLogs_phiAccessed_idx" ON "public"."AuditLogs"("phiAccessed");

-- CreateIndex
CREATE INDEX "AuditLogs_retentionDate_idx" ON "public"."AuditLogs"("retentionDate");

-- CreateIndex
CREATE INDEX "AuditLogs_riskLevel_idx" ON "public"."AuditLogs"("riskLevel");

-- CreateIndex
CREATE INDEX "AuditLogs_riskLevel_accessGranted_timestamp_idx" ON "public"."AuditLogs"("riskLevel", "accessGranted", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLogs_sessionId_idx" ON "public"."AuditLogs"("sessionId");

-- CreateIndex
CREATE INDEX "AuditLogs_timestamp_idx" ON "public"."AuditLogs"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLogs_userId_idx" ON "public"."AuditLogs"("userId");

-- CreateIndex
CREATE INDEX "AuditLogs_userId_timestamp_idx" ON "public"."AuditLogs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "idx_audit_user_created_action" ON "public"."AuditLogs"("userId", "createdAt", "action");

-- CreateIndex
CREATE INDEX "AppointmentSlot_date_isAvailable_idx" ON "public"."AppointmentSlot"("date", "isAvailable");

-- CreateIndex
CREATE INDEX "AppointmentSlot_doctorId_date_startTime_idx" ON "public"."AppointmentSlot"("doctorId", "date", "startTime");

-- CreateIndex
CREATE INDEX "AppointmentSlot_doctorId_isAvailable_idx" ON "public"."AppointmentSlot"("doctorId", "isAvailable");

-- CreateIndex
CREATE INDEX "CarePlanTemplates_conditions_idx" ON "public"."CarePlanTemplates" USING GIN ("conditions");

-- CreateIndex
CREATE INDEX "CarePlanTemplates_createdBy_idx" ON "public"."CarePlanTemplates"("createdBy");

-- CreateIndex
CREATE INDEX "CarePlanTemplates_isApproved_idx" ON "public"."CarePlanTemplates"("isApproved");

-- CreateIndex
CREATE INDEX "CarePlanTemplates_isPublic_idx" ON "public"."CarePlanTemplates"("isPublic");

-- CreateIndex
CREATE INDEX "CarePlanTemplates_name_idx" ON "public"."CarePlanTemplates"("name");

-- CreateIndex
CREATE INDEX "CarePlanTemplates_organizationId_idx" ON "public"."CarePlanTemplates"("organizationId");

-- CreateIndex
CREATE INDEX "CarePlanTemplates_specialties_idx" ON "public"."CarePlanTemplates" USING GIN ("specialties");

-- CreateIndex
CREATE INDEX "CarePlanTemplates_tags_idx" ON "public"."CarePlanTemplates" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "DashboardMetrics_calculatedAt_validUntil_idx" ON "public"."DashboardMetrics"("calculatedAt", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardMetrics_entityType_entityId_metricType_key" ON "public"."DashboardMetrics"("entityType", "entityId", "metricType");

-- CreateIndex
CREATE UNIQUE INDEX "Doctors_userId_key" ON "public"."Doctors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctors_doctorId_key" ON "public"."Doctors"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctors_medicalLicenseNumber_key" ON "public"."Doctors"("medicalLicenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Doctors_npiNumber_key" ON "public"."Doctors"("npiNumber");

-- CreateIndex
CREATE INDEX "Doctors_boardCertifications_idx" ON "public"."Doctors" USING GIN ("boardCertifications");

-- CreateIndex
CREATE INDEX "Doctors_gender_idx" ON "public"."Doctors"("gender");

-- CreateIndex
CREATE INDEX "Doctors_isVerified_idx" ON "public"."Doctors"("isVerified");

-- CreateIndex
CREATE INDEX "Doctors_isVerified_gender_idx" ON "public"."Doctors"("isVerified", "gender");

-- CreateIndex
CREATE INDEX "Doctors_organizationId_idx" ON "public"."Doctors"("organizationId");

-- CreateIndex
CREATE INDEX "Doctors_specialties_idx" ON "public"."Doctors" USING GIN ("specialties");

-- CreateIndex
CREATE UNIQUE INDEX "HSPs_userId_key" ON "public"."HSPs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HSPs_hspId_key" ON "public"."HSPs"("hspId");

-- CreateIndex
CREATE UNIQUE INDEX "HSPs_licenseNumber_key" ON "public"."HSPs"("licenseNumber");

-- CreateIndex
CREATE INDEX "HSPs_departments_idx" ON "public"."HSPs" USING GIN ("departments");

-- CreateIndex
CREATE INDEX "HSPs_hspType_idx" ON "public"."HSPs"("hspType");

-- CreateIndex
CREATE INDEX "HSPs_isVerified_idx" ON "public"."HSPs"("isVerified");

-- CreateIndex
CREATE INDEX "HSPs_organizationId_idx" ON "public"."HSPs"("organizationId");

-- CreateIndex
CREATE INDEX "HSPs_specializations_idx" ON "public"."HSPs" USING GIN ("specializations");

-- CreateIndex
CREATE INDEX "HSPs_supervisingDoctorId_idx" ON "public"."HSPs"("supervisingDoctorId");

-- CreateIndex
CREATE INDEX "MedicationLogs_adherenceStatus_scheduledAt_idx" ON "public"."MedicationLogs"("adherenceStatus", "scheduledAt");

-- CreateIndex
CREATE INDEX "MedicationLogs_medicationId_scheduledAt_idx" ON "public"."MedicationLogs"("medicationId", "scheduledAt");

-- CreateIndex
CREATE INDEX "MedicationLogs_patientId_scheduledAt_idx" ON "public"."MedicationLogs"("patientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "PatientAlerts_acknowledged_resolved_idx" ON "public"."PatientAlerts"("acknowledged", "resolved");

-- CreateIndex
CREATE INDEX "PatientAlerts_createdAt_idx" ON "public"."PatientAlerts"("createdAt");

-- CreateIndex
CREATE INDEX "PatientAlerts_patientId_alertType_severity_idx" ON "public"."PatientAlerts"("patientId", "alertType", "severity");

-- CreateIndex
CREATE INDEX "PatientConsentOtp_expiresAt_idx" ON "public"."PatientConsentOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "PatientConsentOtp_generatedAt_idx" ON "public"."PatientConsentOtp"("generatedAt");

-- CreateIndex
CREATE INDEX "PatientConsentOtp_isBlocked_idx" ON "public"."PatientConsentOtp"("isBlocked");

-- CreateIndex
CREATE INDEX "PatientConsentOtp_isExpired_idx" ON "public"."PatientConsentOtp"("isExpired");

-- CreateIndex
CREATE INDEX "PatientConsentOtp_isVerified_idx" ON "public"."PatientConsentOtp"("isVerified");

-- CreateIndex
CREATE INDEX "PatientConsentOtp_otpCode_idx" ON "public"."PatientConsentOtp"("otpCode");

-- CreateIndex
CREATE INDEX "PatientConsentOtp_patientId_idx" ON "public"."PatientConsentOtp"("patientId");

-- CreateIndex
CREATE INDEX "PatientConsentOtp_requestedByUserId_idx" ON "public"."PatientConsentOtp"("requestedByUserId");

-- CreateIndex
CREATE INDEX "PatientConsentOtp_secondaryAssignmentId_idx" ON "public"."PatientConsentOtp"("secondaryAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProviderAssignments_patientId_providerId_role_endedA_key" ON "public"."PatientProviderAssignments"("patientId", "providerId", "role", "endedAt");

-- CreateIndex
CREATE INDEX "PatientProviderConsentHistory_consentRequestedAt_idx" ON "public"."PatientProviderConsentHistory"("consentRequestedAt");

-- CreateIndex
CREATE INDEX "PatientProviderConsentHistory_doctorId_idx" ON "public"."PatientProviderConsentHistory"("doctorId");

-- CreateIndex
CREATE INDEX "PatientProviderConsentHistory_hspId_idx" ON "public"."PatientProviderConsentHistory"("hspId");

-- CreateIndex
CREATE INDEX "PatientProviderConsentHistory_newProviderId_idx" ON "public"."PatientProviderConsentHistory"("newProviderId");

-- CreateIndex
CREATE INDEX "PatientProviderConsentHistory_patientId_status_idx" ON "public"."PatientProviderConsentHistory"("patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethods_stripePaymentMethodId_key" ON "public"."PaymentMethods"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "PaymentMethods_isActive_idx" ON "public"."PaymentMethods"("isActive");

-- CreateIndex
CREATE INDEX "PaymentMethods_isDefault_idx" ON "public"."PaymentMethods"("isDefault");

-- CreateIndex
CREATE INDEX "PaymentMethods_patientId_idx" ON "public"."PaymentMethods"("patientId");

-- CreateIndex
CREATE INDEX "PaymentMethods_stripePaymentMethodId_idx" ON "public"."PaymentMethods"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "PaymentMethods_type_idx" ON "public"."PaymentMethods"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Payments_stripePaymentIntentId_key" ON "public"."Payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payments_billingPeriodStart_billingPeriodEnd_idx" ON "public"."Payments"("billingPeriodStart", "billingPeriodEnd");

-- CreateIndex
CREATE INDEX "Payments_createdAt_idx" ON "public"."Payments"("createdAt");

-- CreateIndex
CREATE INDEX "Payments_patientId_idx" ON "public"."Payments"("patientId");

-- CreateIndex
CREATE INDEX "Payments_providerId_idx" ON "public"."Payments"("providerId");

-- CreateIndex
CREATE INDEX "Payments_status_idx" ON "public"."Payments"("status");

-- CreateIndex
CREATE INDEX "Payments_stripePaymentIntentId_idx" ON "public"."Payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payments_subscriptionId_idx" ON "public"."Payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "Payments_paymentMethodId_idx" ON "public"."Payments"("paymentMethodId");

-- CreateIndex
CREATE INDEX "ProviderChanges_changeDate_idx" ON "public"."ProviderChanges"("changeDate");

-- CreateIndex
CREATE INDEX "ProviderChanges_newProviderId_idx" ON "public"."ProviderChanges"("newProviderId");

-- CreateIndex
CREATE INDEX "ProviderChanges_practitionerType_practitionerId_idx" ON "public"."ProviderChanges"("practitionerType", "practitionerId");

-- CreateIndex
CREATE INDEX "ProviderChanges_status_idx" ON "public"."ProviderChanges"("status");

-- CreateIndex
CREATE INDEX "Providers_userId_idx" ON "public"."Providers"("userId");

-- CreateIndex
CREATE INDEX "ScheduleEvents_eventId_eventType_idx" ON "public"."ScheduleEvents"("eventId", "eventType");

-- CreateIndex
CREATE INDEX "ScheduleEvents_eventType_status_date_startTime_idx" ON "public"."ScheduleEvents"("eventType", "status", "date", "startTime");

-- CreateIndex
CREATE INDEX "ScheduleEvents_status_date_idx" ON "public"."ScheduleEvents"("status", "date");

-- CreateIndex
CREATE INDEX "idx_events_careplan_time_type" ON "public"."ScheduledEvents"("carePlanId", "scheduledFor", "eventType");

-- CreateIndex
CREATE INDEX "idx_events_patient_time_status" ON "public"."ScheduledEvents"("patientId", "scheduledFor", "status");

-- CreateIndex
CREATE INDEX "ScheduledEvents_carePlanId_idx" ON "public"."ScheduledEvents"("carePlanId");

-- CreateIndex
CREATE INDEX "SecondaryDoctorAssignments_accessGranted_idx" ON "public"."SecondaryDoctorAssignments"("accessGranted");

-- CreateIndex
CREATE INDEX "SecondaryDoctorAssignments_consentExpiresAt_idx" ON "public"."SecondaryDoctorAssignments"("consentExpiresAt");

-- CreateIndex
CREATE INDEX "SecondaryDoctorAssignments_consentStatus_idx" ON "public"."SecondaryDoctorAssignments"("consentStatus");

-- CreateIndex
CREATE INDEX "SecondaryDoctorAssignments_isActive_idx" ON "public"."SecondaryDoctorAssignments"("isActive");

-- CreateIndex
CREATE INDEX "SecondaryDoctorAssignments_patientId_idx" ON "public"."SecondaryDoctorAssignments"("patientId");

-- CreateIndex
CREATE INDEX "SecondaryDoctorAssignments_primaryDoctorId_idx" ON "public"."SecondaryDoctorAssignments"("primaryDoctorId");

-- CreateIndex
CREATE INDEX "SecondaryDoctorAssignments_secondaryDoctorId_idx" ON "public"."SecondaryDoctorAssignments"("secondaryDoctorId");

-- CreateIndex
CREATE INDEX "SecondaryDoctorAssignments_secondaryHspId_idx" ON "public"."SecondaryDoctorAssignments"("secondaryHspId");

-- CreateIndex
CREATE UNIQUE INDEX "SymptomsDatabase_diagnosisName_key" ON "public"."SymptomsDatabase"("diagnosisName");

-- CreateIndex
CREATE INDEX "SymptomsDatabase_category_idx" ON "public"."SymptomsDatabase"("category");

-- CreateIndex
CREATE INDEX "SymptomsDatabase_isActive_idx" ON "public"."SymptomsDatabase"("isActive");

-- CreateIndex
CREATE INDEX "SymptomsDatabase_symptoms_idx" ON "public"."SymptomsDatabase" USING GIN ("symptoms");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentDatabase_treatmentName_key" ON "public"."TreatmentDatabase"("treatmentName");

-- CreateIndex
CREATE INDEX "TreatmentDatabase_applicableConditions_idx" ON "public"."TreatmentDatabase" USING GIN ("applicableConditions");

-- CreateIndex
CREATE INDEX "TreatmentDatabase_category_idx" ON "public"."TreatmentDatabase"("category");

-- CreateIndex
CREATE INDEX "TreatmentDatabase_isActive_idx" ON "public"."TreatmentDatabase"("isActive");

-- CreateIndex
CREATE INDEX "TreatmentDatabase_severityLevel_idx" ON "public"."TreatmentDatabase"("severityLevel");

-- CreateIndex
CREATE INDEX "TreatmentDatabase_treatmentType_idx" ON "public"."TreatmentDatabase"("treatmentType");

-- CreateIndex
CREATE INDEX "TreatmentPlans_doctorId_idx" ON "public"."TreatmentPlans"("doctorId");

-- CreateIndex
CREATE INDEX "TreatmentPlans_endDate_idx" ON "public"."TreatmentPlans"("endDate");

-- CreateIndex
CREATE INDEX "TreatmentPlans_followUpDate_idx" ON "public"."TreatmentPlans"("followUpDate");

-- CreateIndex
CREATE INDEX "TreatmentPlans_organizationId_idx" ON "public"."TreatmentPlans"("organizationId");

-- CreateIndex
CREATE INDEX "TreatmentPlans_patientId_idx" ON "public"."TreatmentPlans"("patientId");

-- CreateIndex
CREATE INDEX "TreatmentPlans_primaryDiagnosis_idx" ON "public"."TreatmentPlans"("primaryDiagnosis");

-- CreateIndex
CREATE INDEX "TreatmentPlans_priority_idx" ON "public"."TreatmentPlans"("priority");

-- CreateIndex
CREATE INDEX "TreatmentPlans_secondaryDiagnoses_idx" ON "public"."TreatmentPlans" USING GIN ("secondaryDiagnoses");

-- CreateIndex
CREATE INDEX "TreatmentPlans_startDate_idx" ON "public"."TreatmentPlans"("startDate");

-- CreateIndex
CREATE INDEX "TreatmentPlans_status_idx" ON "public"."TreatmentPlans"("status");

-- CreateIndex
CREATE INDEX "TreatmentPlans_symptoms_idx" ON "public"."TreatmentPlans" USING GIN ("symptoms");

-- CreateIndex
CREATE INDEX "idx_userroles_identity_linked" ON "public"."UserRoleAssignments"("userIdentity", "linkedWith");

-- CreateIndex
CREATE INDEX "VitalRequirements_carePlanId_idx" ON "public"."VitalRequirements"("carePlanId");

-- CreateIndex
CREATE INDEX "VitalRequirements_frequency_idx" ON "public"."VitalRequirements"("frequency");

-- CreateIndex
CREATE INDEX "VitalRequirements_isCritical_idx" ON "public"."VitalRequirements"("isCritical");

-- CreateIndex
CREATE INDEX "VitalRequirements_vitalTypeId_idx" ON "public"."VitalRequirements"("vitalTypeId");

-- CreateIndex
CREATE INDEX "Vitals_carePlanId_idx" ON "public"."Vitals"("carePlanId");

-- CreateIndex
CREATE INDEX "Vitals_vitalTemplateId_idx" ON "public"."Vitals"("vitalTemplateId");

-- CreateIndex
CREATE INDEX "DrugInteractions_severityLevel_idx" ON "public"."DrugInteractions"("severityLevel");

-- CreateIndex
CREATE INDEX "DrugInteractions_drugNameOne_drugNameTwo_idx" ON "public"."DrugInteractions"("drugNameOne", "drugNameTwo");

-- CreateIndex
CREATE UNIQUE INDEX "DrugInteractions_rxcuiOne_rxcuiTwo_key" ON "public"."DrugInteractions"("rxcuiOne", "rxcuiTwo");

-- CreateIndex
CREATE INDEX "PatientAllergies_patientId_isActive_idx" ON "public"."PatientAllergies"("patientId", "isActive");

-- CreateIndex
CREATE INDEX "PatientAllergies_allergenType_allergenName_idx" ON "public"."PatientAllergies"("allergenType", "allergenName");

-- CreateIndex
CREATE INDEX "MedicationSafetyAlerts_patientId_severity_resolved_idx" ON "public"."MedicationSafetyAlerts"("patientId", "severity", "resolved");

-- CreateIndex
CREATE INDEX "MedicationSafetyAlerts_alertType_createdAt_idx" ON "public"."MedicationSafetyAlerts"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "MedicationSafetyAlerts_resolved_createdAt_idx" ON "public"."MedicationSafetyAlerts"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "EmergencyAlerts_patientId_priorityLevel_acknowledged_resolv_idx" ON "public"."EmergencyAlerts"("patientId", "priorityLevel", "acknowledged", "resolved");

-- CreateIndex
CREATE INDEX "EmergencyAlerts_alertType_createdAt_idx" ON "public"."EmergencyAlerts"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "EmergencyAlerts_resolved_createdAt_idx" ON "public"."EmergencyAlerts"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "VitalAlertRules_vitalType_isActive_idx" ON "public"."VitalAlertRules"("vitalType", "isActive");

-- CreateIndex
CREATE INDEX "VitalAlertRules_alertLevel_idx" ON "public"."VitalAlertRules"("alertLevel");

-- CreateIndex
CREATE INDEX "EmergencyContacts_patientId_priorityOrder_idx" ON "public"."EmergencyContacts"("patientId", "priorityOrder");

-- CreateIndex
CREATE INDEX "EmergencyContacts_patientId_isActive_idx" ON "public"."EmergencyContacts"("patientId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VideoConsultations_consultationId_key" ON "public"."VideoConsultations"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoConsultations_roomId_key" ON "public"."VideoConsultations"("roomId");

-- CreateIndex
CREATE INDEX "VideoConsultations_doctorId_scheduledStart_idx" ON "public"."VideoConsultations"("doctorId", "scheduledStart");

-- CreateIndex
CREATE INDEX "VideoConsultations_patientId_status_idx" ON "public"."VideoConsultations"("patientId", "status");

-- CreateIndex
CREATE INDEX "VideoConsultations_status_scheduledStart_idx" ON "public"."VideoConsultations"("status", "scheduledStart");

-- CreateIndex
CREATE INDEX "VideoConsultations_consultationType_priority_idx" ON "public"."VideoConsultations"("consultationType", "priority");

-- CreateIndex
CREATE INDEX "ConsultationPrescriptions_consultationId_idx" ON "public"."ConsultationPrescriptions"("consultationId");

-- CreateIndex
CREATE INDEX "ConsultationNotes_consultationId_noteType_idx" ON "public"."ConsultationNotes"("consultationId", "noteType");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrders_orderNumber_key" ON "public"."LabOrders"("orderNumber");

-- CreateIndex
CREATE INDEX "LabOrders_patientId_status_idx" ON "public"."LabOrders"("patientId", "status");

-- CreateIndex
CREATE INDEX "LabOrders_doctorId_orderDate_idx" ON "public"."LabOrders"("doctorId", "orderDate");

-- CreateIndex
CREATE INDEX "LabOrders_status_expectedResultDate_idx" ON "public"."LabOrders"("status", "expectedResultDate");

-- CreateIndex
CREATE INDEX "LabResults_labOrderId_idx" ON "public"."LabResults"("labOrderId");

-- CreateIndex
CREATE INDEX "LabResults_testName_resultDate_idx" ON "public"."LabResults"("testName", "resultDate");

-- CreateIndex
CREATE INDEX "LabResults_criticalFlag_resultDate_idx" ON "public"."LabResults"("criticalFlag", "resultDate");

-- CreateIndex
CREATE UNIQUE INDEX "PatientGameProfiles_patientId_key" ON "public"."PatientGameProfiles"("patientId");

-- CreateIndex
CREATE INDEX "PatientGameProfiles_totalPoints_currentLevel_idx" ON "public"."PatientGameProfiles"("totalPoints", "currentLevel");

-- CreateIndex
CREATE INDEX "PatientGameProfiles_patientId_lastActivity_idx" ON "public"."PatientGameProfiles"("patientId", "lastActivity");

-- CreateIndex
CREATE INDEX "GameBadgeAwards_patientId_awardedDate_idx" ON "public"."GameBadgeAwards"("patientId", "awardedDate");

-- CreateIndex
CREATE INDEX "GameBadgeAwards_badgeType_idx" ON "public"."GameBadgeAwards"("badgeType");

-- CreateIndex
CREATE INDEX "GameChallengeProgress_patientId_isCompleted_idx" ON "public"."GameChallengeProgress"("patientId", "isCompleted");

-- CreateIndex
CREATE INDEX "GameChallengeProgress_challengeType_endDate_idx" ON "public"."GameChallengeProgress"("challengeType", "endDate");

-- CreateIndex
CREATE INDEX "ConnectedDevices_pluginId_deviceType_idx" ON "public"."ConnectedDevices"("pluginId", "deviceType");

-- CreateIndex
CREATE INDEX "ConnectedDevices_patientId_connectionStatus_idx" ON "public"."ConnectedDevices"("patientId", "connectionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedDevices_patientId_deviceIdentifier_key" ON "public"."ConnectedDevices"("patientId", "deviceIdentifier");

-- CreateIndex
CREATE INDEX "DeviceReadings_patientId_readingType_measurementTimestamp_idx" ON "public"."DeviceReadings"("patientId", "readingType", "measurementTimestamp");

-- CreateIndex
CREATE INDEX "DeviceReadings_deviceId_measurementTimestamp_idx" ON "public"."DeviceReadings"("deviceId", "measurementTimestamp");

-- CreateIndex
CREATE INDEX "DeviceReadings_pluginId_readingType_idx" ON "public"."DeviceReadings"("pluginId", "readingType");

-- CreateIndex
CREATE INDEX "DeviceReadings_triggeredAlerts_measurementTimestamp_idx" ON "public"."DeviceReadings"("triggeredAlerts", "measurementTimestamp");

-- CreateIndex
CREATE INDEX "_DeviceReadingToEmergencyAlert_B_index" ON "public"."_DeviceReadingToEmergencyAlert"("B");

-- AddForeignKey
ALTER TABLE "public"."Accounts" ADD CONSTRAINT "Accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountLinks" ADD CONSTRAINT "AccountLinks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Patients" ADD CONSTRAINT "Patients_linkedProviderId_fkey" FOREIGN KEY ("linkedProviderId") REFERENCES "public"."Organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Patients" ADD CONSTRAINT "Patients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Patients" ADD CONSTRAINT "Patients_primaryCareDoctorId_fkey" FOREIGN KEY ("primaryCareDoctorId") REFERENCES "public"."Doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Patients" ADD CONSTRAINT "Patients_primaryCareHspId_fkey" FOREIGN KEY ("primaryCareHspId") REFERENCES "public"."HSPs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Patients" ADD CONSTRAINT "Patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HealthcareProviders" ADD CONSTRAINT "HealthcareProviders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."HealthcareProviders" ADD CONSTRAINT "HealthcareProviders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."HealthcareProviders" ADD CONSTRAINT "HealthcareProviders_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Clinics" ADD CONSTRAINT "Clinics_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Clinics" ADD CONSTRAINT "Clinics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CarePlans" ADD CONSTRAINT "CarePlans_createdByDoctorId_fkey" FOREIGN KEY ("createdByDoctorId") REFERENCES "public"."Doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlans" ADD CONSTRAINT "CarePlans_createdByHspId_fkey" FOREIGN KEY ("createdByHspId") REFERENCES "public"."HSPs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CarePlans" ADD CONSTRAINT "CarePlans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CarePlans" ADD CONSTRAINT "CarePlans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Medications" ADD CONSTRAINT "Medications_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."CarePlans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Medications" ADD CONSTRAINT "Medications_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "public"."Medicines"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointments" ADD CONSTRAINT "Appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointments" ADD CONSTRAINT "Appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointments" ADD CONSTRAINT "Appointments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Appointments" ADD CONSTRAINT "Appointments_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "public"."AppointmentSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorAvailability" ADD CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."VitalReadings" ADD CONSTRAINT "VitalReadings_adherenceRecordId_fkey" FOREIGN KEY ("adherenceRecordId") REFERENCES "public"."AdherenceRecords"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."VitalReadings" ADD CONSTRAINT "VitalReadings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VitalReadings" ADD CONSTRAINT "VitalReadings_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "public"."HealthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."VitalReadings" ADD CONSTRAINT "VitalReadings_vitalTypeId_fkey" FOREIGN KEY ("vitalTypeId") REFERENCES "public"."VitalTypes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Symptoms" ADD CONSTRAINT "Symptoms_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."CarePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Symptoms" ADD CONSTRAINT "Symptoms_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."AdherenceRecords" ADD CONSTRAINT "AdherenceRecords_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."AdherenceRecords" ADD CONSTRAINT "AdherenceRecords_scheduledEventId_fkey" FOREIGN KEY ("scheduledEventId") REFERENCES "public"."ScheduledEvents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ServicePlans" ADD CONSTRAINT "ServicePlans_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."HealthcareProviders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientSubscriptions" ADD CONSTRAINT "PatientSubscriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientSubscriptions" ADD CONSTRAINT "PatientSubscriptions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."HealthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientSubscriptions" ADD CONSTRAINT "PatientSubscriptions_servicePlanId_fkey" FOREIGN KEY ("servicePlanId") REFERENCES "public"."ServicePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientDoctorAssignments" ADD CONSTRAINT "PatientDoctorAssignments_assignedByAdminId_fkey" FOREIGN KEY ("assignedByAdminId") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientDoctorAssignments" ADD CONSTRAINT "PatientDoctorAssignments_assignedByDoctorId_fkey" FOREIGN KEY ("assignedByDoctorId") REFERENCES "public"."Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientDoctorAssignments" ADD CONSTRAINT "PatientDoctorAssignments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientDoctorAssignments" ADD CONSTRAINT "PatientDoctorAssignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."UserDevices" ADD CONSTRAINT "UserDevices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."HSPs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_relatedAppointmentId_fkey" FOREIGN KEY ("relatedAppointmentId") REFERENCES "public"."Appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_relatedCarePlanId_fkey" FOREIGN KEY ("relatedCarePlanId") REFERENCES "public"."CarePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_relatedMedicationId_fkey" FOREIGN KEY ("relatedMedicationId") REFERENCES "public"."Medications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_relatedTreatmentPlanId_fkey" FOREIGN KEY ("relatedTreatmentPlanId") REFERENCES "public"."TreatmentPlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."AuditLogs" ADD CONSTRAINT "AuditLogs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."AuditLogs" ADD CONSTRAINT "AuditLogs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."AuditLogs" ADD CONSTRAINT "AuditLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CarePlanTemplates" ADD CONSTRAINT "CarePlanTemplates_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CarePlanTemplates" ADD CONSTRAINT "CarePlanTemplates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."HealthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CarePlanTemplates" ADD CONSTRAINT "CarePlanTemplates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CarePlanTemplates" ADD CONSTRAINT "CarePlanTemplates_parentTemplateId_fkey" FOREIGN KEY ("parentTemplateId") REFERENCES "public"."CarePlanTemplates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Doctors" ADD CONSTRAINT "Doctors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Doctors" ADD CONSTRAINT "Doctors_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."Specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Doctors" ADD CONSTRAINT "Doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Doctors" ADD CONSTRAINT "Doctors_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."HSPs" ADD CONSTRAINT "HSPs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."HSPs" ADD CONSTRAINT "HSPs_supervisingDoctorId_fkey" FOREIGN KEY ("supervisingDoctorId") REFERENCES "public"."Doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."HSPs" ADD CONSTRAINT "HSPs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."HSPs" ADD CONSTRAINT "HSPs_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."MedicationLogs" ADD CONSTRAINT "MedicationLogs_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "public"."Medications"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicationLogs" ADD CONSTRAINT "MedicationLogs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientAlerts" ADD CONSTRAINT "PatientAlerts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientConsentOtp" ADD CONSTRAINT "PatientConsentOtp_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientConsentOtp" ADD CONSTRAINT "PatientConsentOtp_primaryDoctorId_fkey" FOREIGN KEY ("primaryDoctorId") REFERENCES "public"."Doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientConsentOtp" ADD CONSTRAINT "PatientConsentOtp_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientConsentOtp" ADD CONSTRAINT "PatientConsentOtp_secondaryAssignmentId_fkey" FOREIGN KEY ("secondaryAssignmentId") REFERENCES "public"."SecondaryDoctorAssignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientConsentOtp" ADD CONSTRAINT "PatientConsentOtp_secondaryDoctorId_fkey" FOREIGN KEY ("secondaryDoctorId") REFERENCES "public"."Doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientConsentOtp" ADD CONSTRAINT "PatientConsentOtp_secondaryHspId_fkey" FOREIGN KEY ("secondaryHspId") REFERENCES "public"."HSPs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientProviderAssignments" ADD CONSTRAINT "PatientProviderAssignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientProviderAssignments" ADD CONSTRAINT "PatientProviderAssignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientProviderAssignments" ADD CONSTRAINT "PatientProviderAssignments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."HealthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientProviderConsentHistory" ADD CONSTRAINT "PatientProviderConsentHistory_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientProviderConsentHistory" ADD CONSTRAINT "PatientProviderConsentHistory_hspId_fkey" FOREIGN KEY ("hspId") REFERENCES "public"."HSPs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientProviderConsentHistory" ADD CONSTRAINT "PatientProviderConsentHistory_newProviderId_fkey" FOREIGN KEY ("newProviderId") REFERENCES "public"."Organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientProviderConsentHistory" ADD CONSTRAINT "PatientProviderConsentHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PatientProviderConsentHistory" ADD CONSTRAINT "PatientProviderConsentHistory_previousProviderId_fkey" FOREIGN KEY ("previousProviderId") REFERENCES "public"."Organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."PaymentMethods" ADD CONSTRAINT "PaymentMethods_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Payments" ADD CONSTRAINT "Payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."PaymentMethods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payments" ADD CONSTRAINT "Payments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Payments" ADD CONSTRAINT "Payments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."HealthcareProviders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Payments" ADD CONSTRAINT "Payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."PatientSubscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ProviderChanges" ADD CONSTRAINT "ProviderChanges_newProviderId_fkey" FOREIGN KEY ("newProviderId") REFERENCES "public"."Organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ProviderChanges" ADD CONSTRAINT "ProviderChanges_previousProviderId_fkey" FOREIGN KEY ("previousProviderId") REFERENCES "public"."Organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Providers" ADD CONSTRAINT "Providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ScheduledEvents" ADD CONSTRAINT "ScheduledEvents_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."CarePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ScheduledEvents" ADD CONSTRAINT "ScheduledEvents_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ScheduledEvents" ADD CONSTRAINT "ScheduledEvents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."SecondaryDoctorAssignments" ADD CONSTRAINT "SecondaryDoctorAssignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecondaryDoctorAssignments" ADD CONSTRAINT "SecondaryDoctorAssignments_primaryDoctorId_fkey" FOREIGN KEY ("primaryDoctorId") REFERENCES "public"."Doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecondaryDoctorAssignments" ADD CONSTRAINT "SecondaryDoctorAssignments_primaryDoctorProviderId_fkey" FOREIGN KEY ("primaryDoctorProviderId") REFERENCES "public"."Organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecondaryDoctorAssignments" ADD CONSTRAINT "SecondaryDoctorAssignments_secondaryDoctorId_fkey" FOREIGN KEY ("secondaryDoctorId") REFERENCES "public"."Doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecondaryDoctorAssignments" ADD CONSTRAINT "SecondaryDoctorAssignments_secondaryDoctorProviderId_fkey" FOREIGN KEY ("secondaryDoctorProviderId") REFERENCES "public"."Organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecondaryDoctorAssignments" ADD CONSTRAINT "SecondaryDoctorAssignments_secondaryHspId_fkey" FOREIGN KEY ("secondaryHspId") REFERENCES "public"."HSPs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreatmentPlans" ADD CONSTRAINT "TreatmentPlans_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctors"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TreatmentPlans" ADD CONSTRAINT "TreatmentPlans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."TreatmentPlans" ADD CONSTRAINT "TreatmentPlans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRoleAssignments" ADD CONSTRAINT "UserRoleAssignments_userIdentity_fkey" FOREIGN KEY ("userIdentity") REFERENCES "public"."Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."VitalRequirements" ADD CONSTRAINT "VitalRequirements_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."CarePlans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."VitalRequirements" ADD CONSTRAINT "VitalRequirements_vitalTypeId_fkey" FOREIGN KEY ("vitalTypeId") REFERENCES "public"."VitalTypes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vitals" ADD CONSTRAINT "Vitals_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."CarePlans"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vitals" ADD CONSTRAINT "Vitals_vitalTemplateId_fkey" FOREIGN KEY ("vitalTemplateId") REFERENCES "public"."VitalTemplates"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientAllergies" ADD CONSTRAINT "PatientAllergies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientAllergies" ADD CONSTRAINT "PatientAllergies_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicationSafetyAlerts" ADD CONSTRAINT "MedicationSafetyAlerts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicationSafetyAlerts" ADD CONSTRAINT "MedicationSafetyAlerts_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "public"."Medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicationSafetyAlerts" ADD CONSTRAINT "MedicationSafetyAlerts_drugInteractionId_fkey" FOREIGN KEY ("drugInteractionId") REFERENCES "public"."DrugInteractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicationSafetyAlerts" ADD CONSTRAINT "MedicationSafetyAlerts_patientAllergyId_fkey" FOREIGN KEY ("patientAllergyId") REFERENCES "public"."PatientAllergies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicationSafetyAlerts" ADD CONSTRAINT "MedicationSafetyAlerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicationSafetyAlerts" ADD CONSTRAINT "MedicationSafetyAlerts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyAlerts" ADD CONSTRAINT "EmergencyAlerts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyAlerts" ADD CONSTRAINT "EmergencyAlerts_vitalReadingId_fkey" FOREIGN KEY ("vitalReadingId") REFERENCES "public"."VitalReadings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyAlerts" ADD CONSTRAINT "EmergencyAlerts_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyAlerts" ADD CONSTRAINT "EmergencyAlerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VitalAlertRules" ADD CONSTRAINT "VitalAlertRules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyContacts" ADD CONSTRAINT "EmergencyContacts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoConsultations" ADD CONSTRAINT "VideoConsultations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoConsultations" ADD CONSTRAINT "VideoConsultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoConsultations" ADD CONSTRAINT "VideoConsultations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoConsultations" ADD CONSTRAINT "VideoConsultations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsultationPrescriptions" ADD CONSTRAINT "ConsultationPrescriptions_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "public"."VideoConsultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsultationNotes" ADD CONSTRAINT "ConsultationNotes_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "public"."VideoConsultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsultationNotes" ADD CONSTRAINT "ConsultationNotes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabOrders" ADD CONSTRAINT "LabOrders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabOrders" ADD CONSTRAINT "LabOrders_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabOrders" ADD CONSTRAINT "LabOrders_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "public"."VideoConsultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabResults" ADD CONSTRAINT "LabResults_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "public"."LabOrders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientGameProfiles" ADD CONSTRAINT "PatientGameProfiles_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameBadgeAwards" ADD CONSTRAINT "GameBadgeAwards_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientGameProfiles"("patientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameChallengeProgress" ADD CONSTRAINT "GameChallengeProgress_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientGameProfiles"("patientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConnectedDevices" ADD CONSTRAINT "ConnectedDevices_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConnectedDevices" ADD CONSTRAINT "ConnectedDevices_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceReadings" ADD CONSTRAINT "DeviceReadings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."ConnectedDevices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceReadings" ADD CONSTRAINT "DeviceReadings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceReadings" ADD CONSTRAINT "DeviceReadings_vitalReadingId_fkey" FOREIGN KEY ("vitalReadingId") REFERENCES "public"."VitalReadings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" ADD CONSTRAINT "_DeviceReadingToEmergencyAlert_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."DeviceReadings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" ADD CONSTRAINT "_DeviceReadingToEmergencyAlert_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."EmergencyAlerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;