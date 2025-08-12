-- CreateEnum
CREATE TYPE "public"."enum_adherence_records_adherence_type" AS ENUM ('MEDICATION', 'APPOINTMENT', 'VITAL_CHECK', 'SYMPTOM_LOG', 'DIET_LOG', 'EXERCISE', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."enum_appointment_slots_slot_type" AS ENUM ('regular', 'emergency', 'consultation', 'follow_up');

-- CreateEnum
CREATE TYPE "public"."enum_appointments_organizer_type" AS ENUM ('doctor', 'patient', 'care_taker', 'hsp', 'provider', 'admin');

-- CreateEnum
CREATE TYPE "public"."enum_appointments_participant_one_type" AS ENUM ('doctor', 'patient', 'hsp');

-- CreateEnum
CREATE TYPE "public"."enum_appointments_participant_two_type" AS ENUM ('doctor', 'patient', 'hsp');

-- CreateEnum
CREATE TYPE "public"."enum_dashboard_metrics_entity_type" AS ENUM ('patient', 'doctor', 'organization', 'system');

-- CreateEnum
CREATE TYPE "public"."enum_medication_logs_adherence_status" AS ENUM ('taken', 'missed', 'late', 'partial');

-- CreateEnum
CREATE TYPE "public"."enum_medications_organizer_type" AS ENUM ('doctor', 'patient', 'care_taker', 'hsp', 'provider', 'admin');

-- CreateEnum
CREATE TYPE "public"."enum_patient_alerts_alert_type" AS ENUM ('medication', 'vital', 'appointment', 'symptom', 'system');

-- CreateEnum
CREATE TYPE "public"."enum_patient_alerts_severity" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "public"."enum_patient_consent_otp_otp_method" AS ENUM ('sms', 'email', 'both');

-- CreateEnum
CREATE TYPE "public"."enum_patient_provider_consent_history_consent_method" AS ENUM ('sms', 'email', 'in_person', 'phone', 'automatic');

-- CreateEnum
CREATE TYPE "public"."enum_patient_provider_consent_history_status" AS ENUM ('pending', 'consent_requested', 'approved', 'denied', 'expired', 'completed');

-- CreateEnum
CREATE TYPE "public"."enum_patient_subscriptions_status" AS ENUM ('ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIALING');

-- CreateEnum
CREATE TYPE "public"."enum_patients_provider_consent_method" AS ENUM ('sms', 'email', 'in_person', 'phone', 'automatic');

-- CreateEnum
CREATE TYPE "public"."enum_payment_methods_type" AS ENUM ('card', 'bank_account', 'paypal');

-- CreateEnum
CREATE TYPE "public"."enum_payments_payment_method" AS ENUM ('card', 'bank_account', 'paypal', 'apple_pay', 'google_pay');

-- CreateEnum
CREATE TYPE "public"."enum_payments_status" AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "public"."enum_provider_change_history_practitioner_type" AS ENUM ('doctor', 'hsp');

-- CreateEnum
CREATE TYPE "public"."enum_provider_change_history_status" AS ENUM ('active', 'processing', 'completed');

-- CreateEnum
CREATE TYPE "public"."enum_schedule_events_event_type" AS ENUM ('appointment', 'reminder', 'medication-reminder', 'vitals', 'careplan-activation', 'diet', 'workout');

-- CreateEnum
CREATE TYPE "public"."enum_schedule_events_status" AS ENUM ('scheduled', 'pending', 'completed', 'expired', 'cancelled', 'started', 'prior');

-- CreateEnum
CREATE TYPE "public"."enum_scheduled_events_event_type" AS ENUM ('MEDICATION', 'APPOINTMENT', 'VITAL_CHECK', 'SYMPTOM_LOG', 'DIET_LOG', 'EXERCISE', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."enum_scheduled_events_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."enum_scheduled_events_status" AS ENUM ('SCHEDULED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."enum_secondary_doctor_assignments_consent_status" AS ENUM ('pending', 'requested', 'granted', 'denied', 'expired');

-- CreateEnum
CREATE TYPE "public"."enum_service_plans_billing_cycle" AS ENUM ('monthly', 'yearly', 'one-time', 'weekly');

-- CreateEnum
CREATE TYPE "public"."enum_user_roles_linked_with" AS ENUM ('doctor', 'patient', 'care_taker', 'hsp', 'provider', 'admin');

-- CreateEnum
CREATE TYPE "public"."enum_users_account_status" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "public"."enum_users_gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "public"."enum_users_role" AS ENUM ('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'HSP', 'PATIENT', 'CAREGIVER');

-- CreateEnum
CREATE TYPE "public"."enum_vital_readings_alert_level" AS ENUM ('normal', 'warning', 'critical', 'emergency');

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) DEFAULT 'clinic',
    "license_number" VARCHAR(100),
    "contact_info" JSONB DEFAULT '{}',
    "address" JSONB DEFAULT '{}',
    "settings" JSONB DEFAULT '{"timezone": "UTC", "working_hours": {"friday": {"end": "17:00", "start": "09:00"}, "monday": {"end": "17:00", "start": "09:00"}, "sunday": {"closed": true}, "tuesday": {"end": "17:00", "start": "09:00"}, "saturday": {"end": "13:00", "start": "09:00"}, "thursday": {"end": "17:00", "start": "09:00"}, "wednesday": {"end": "17:00", "start": "09:00"}}, "notification_preferences": {"sms_enabled": false, "push_enabled": true, "email_enabled": true}}',
    "is_active" BOOLEAN DEFAULT true,
    "hipaa_covered_entity" BOOLEAN DEFAULT true,
    "business_associate_agreement" JSONB,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "public"."enum_users_role" NOT NULL,
    "account_status" "public"."enum_users_account_status" DEFAULT 'PENDING_VERIFICATION',
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "middle_name" VARCHAR(100),
    "phone" VARCHAR(20),
    "date_of_birth" DATE,
    "gender" "public"."enum_users_gender",
    "email_verified" BOOLEAN DEFAULT false,
    "email_verification_token" VARCHAR(255),
    "password_reset_token" VARCHAR(255),
    "password_reset_expires" TIMESTAMPTZ(6),
    "two_factor_enabled" BOOLEAN DEFAULT false,
    "two_factor_secret" VARCHAR(255),
    "failed_login_attempts" INTEGER DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "profile_picture_url" VARCHAR(500),
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "locale" VARCHAR(10) DEFAULT 'en',
    "preferences" JSONB DEFAULT '{"privacy": {"profile_visible": true, "share_data_for_research": false}, "accessibility": {"large_text": false, "high_contrast": false}, "notifications": {"sms": false, "push": true, "email": true}}',
    "terms_accepted_at" TIMESTAMPTZ(6),
    "privacy_policy_accepted_at" TIMESTAMPTZ(6),
    "hipaa_consent_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "full_name" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patients" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "medical_record_number" VARCHAR(50),
    "patient_id" VARCHAR(100),
    "emergency_contacts" JSONB DEFAULT '[]',
    "insurance_information" JSONB DEFAULT '{}',
    "medical_history" JSONB DEFAULT '[]',
    "allergies" JSONB DEFAULT '[]',
    "current_medications" JSONB DEFAULT '[]',
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "blood_type" VARCHAR(5),
    "primary_language" VARCHAR(10) DEFAULT 'en',
    "risk_level" VARCHAR(20) DEFAULT 'low',
    "risk_factors" JSONB DEFAULT '[]',
    "communication_preferences" JSONB DEFAULT '{"language": "en", "time_zone": "UTC", "health_tips": false, "medication_reminders": true, "appointment_reminders": true, "research_participation": false, "preferred_contact_method": "email"}',
    "privacy_settings" JSONB DEFAULT '{"share_with_family": false, "share_for_research": false, "data_sharing_consent": false, "marketing_communications": false, "provider_directory_listing": true}',
    "primary_care_doctor_id" UUID,
    "primary_care_hsp_id" UUID,
    "care_coordinator_id" UUID,
    "care_coordinator_type" VARCHAR(10),
    "overall_adherence_score" DECIMAL(5,2),
    "last_adherence_calculation" TIMESTAMPTZ(6),
    "total_appointments" INTEGER DEFAULT 0,
    "missed_appointments" INTEGER DEFAULT 0,
    "last_visit_date" TIMESTAMPTZ(6),
    "next_appointment_date" TIMESTAMPTZ(6),
    "is_active" BOOLEAN DEFAULT true,
    "requires_interpreter" BOOLEAN DEFAULT false,
    "has_mobility_issues" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "linked_provider_id" UUID,
    "provider_linked_at" TIMESTAMPTZ(6),
    "provider_consent_given" BOOLEAN DEFAULT false,
    "provider_consent_given_at" TIMESTAMPTZ(6),
    "provider_consent_method" "public"."enum_patients_provider_consent_method",

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."healthcare_providers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "license_number" VARCHAR(100),
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sub_specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualifications" JSONB DEFAULT '[]',
    "years_of_experience" INTEGER,
    "is_verified" BOOLEAN DEFAULT false,
    "verification_documents" JSONB DEFAULT '[]',
    "verification_date" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "consultation_fee" DECIMAL(10,2),
    "availability_schedule" JSONB DEFAULT '{"friday": {"end": "17:00", "start": "09:00", "available": true}, "monday": {"end": "17:00", "start": "09:00", "available": true}, "sunday": {"available": false}, "tuesday": {"end": "17:00", "start": "09:00", "available": true}, "saturday": {"available": false}, "thursday": {"end": "17:00", "start": "09:00", "available": true}, "wednesday": {"end": "17:00", "start": "09:00", "available": true}}',
    "notification_preferences" JSONB DEFAULT '{"patient_updates": true, "marketing_emails": false, "sms_notifications": true, "push_notifications": true, "system_notifications": true, "appointment_reminders": true}',
    "practice_name" VARCHAR(255),
    "practice_address" JSONB DEFAULT '{}',
    "practice_phone" VARCHAR(20),
    "practice_website" VARCHAR(255),
    "total_patients" INTEGER DEFAULT 0,
    "active_care_plans" INTEGER DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "total_reviews" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "healthcare_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."specialities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),
    "user_created" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "specialities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clinics" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "doctor_id" UUID NOT NULL,
    "organization_id" UUID,
    "address" JSONB NOT NULL DEFAULT '{}',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "location_verified" BOOLEAN DEFAULT false,
    "location_accuracy" VARCHAR(20),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(500),
    "operating_hours" JSONB NOT NULL DEFAULT '{}',
    "services_offered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clinic_images" JSONB DEFAULT '[]',
    "banner_image" TEXT,
    "description" TEXT,
    "consultation_fee" DECIMAL(10,2),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "registration_number" VARCHAR(100),
    "established_year" INTEGER,
    "facilities" JSONB DEFAULT '[]',
    "insurance_accepted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."care_plans" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "created_by_doctor_id" UUID,
    "created_by_hsp_id" UUID,
    "organization_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "plan_type" VARCHAR(20) DEFAULT 'care_plan',
    "chronic_conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "condition_severity" JSONB DEFAULT '{}',
    "risk_factors" JSONB DEFAULT '[]',
    "long_term_goals" JSONB DEFAULT '[]',
    "short_term_milestones" JSONB DEFAULT '[]',
    "interventions" JSONB DEFAULT '[]',
    "lifestyle_modifications" JSONB DEFAULT '[]',
    "monitoring_parameters" JSONB DEFAULT '[]',
    "monitoring_frequency" JSONB DEFAULT '{}',
    "target_values" JSONB DEFAULT '{}',
    "medications" JSONB DEFAULT '[]',
    "medication_management" JSONB DEFAULT '{}',
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6),
    "review_frequency_months" INTEGER DEFAULT 3,
    "next_review_date" TIMESTAMPTZ(6),
    "status" VARCHAR(20) DEFAULT 'ACTIVE',
    "priority" VARCHAR(20) DEFAULT 'MEDIUM',
    "primary_care_manager_id" UUID,
    "care_team_members" JSONB DEFAULT '[]',
    "specialist_referrals" JSONB DEFAULT '[]',
    "patient_education_materials" JSONB DEFAULT '[]',
    "self_management_tasks" JSONB DEFAULT '[]',
    "patient_goals" JSONB DEFAULT '[]',
    "progress_notes" JSONB DEFAULT '[]',
    "outcome_measures" JSONB DEFAULT '{}',
    "quality_of_life_scores" JSONB DEFAULT '{}',
    "emergency_action_plan" JSONB DEFAULT '{}',
    "warning_signs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emergency_contacts" JSONB DEFAULT '[]',
    "details" JSONB,
    "channel_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "care_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medicines" (
    "id" UUID NOT NULL,
    "name" VARCHAR(1000) NOT NULL,
    "type" VARCHAR(1000) DEFAULT 'tablet',
    "description" VARCHAR(1000),
    "details" JSON,
    "creator_id" INTEGER,
    "public_medicine" BOOLEAN DEFAULT true,
    "algolia_object_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medications" (
    "id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "organizer_type" "public"."enum_medications_organizer_type",
    "organizer_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "description" VARCHAR(1000),
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "rr_rule" VARCHAR(1000),
    "details" JSON,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "care_plan_id" UUID,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" UUID NOT NULL,
    "participant_one_type" "public"."enum_appointments_participant_one_type",
    "participant_one_id" UUID,
    "participant_two_type" "public"."enum_appointments_participant_two_type",
    "participant_two_id" UUID,
    "organizer_type" "public"."enum_appointments_organizer_type",
    "organizer_id" UUID,
    "provider_id" UUID,
    "provider_name" VARCHAR(100),
    "description" VARCHAR(1000),
    "start_date" DATE,
    "end_date" DATE,
    "start_time" TIMESTAMPTZ(6),
    "end_time" TIMESTAMPTZ(6),
    "rr_rule" VARCHAR(1000),
    "details" JSON,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "doctor_id" UUID,
    "patient_id" UUID,
    "slot_id" UUID,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doctor_availability" (
    "id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "is_available" BOOLEAN DEFAULT true,
    "slot_duration" INTEGER DEFAULT 30,
    "max_appointments_per_slot" INTEGER DEFAULT 1,
    "break_start_time" TIME(6),
    "break_end_time" TIME(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vital_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(20),
    "normal_range_min" DECIMAL(10,2),
    "normal_range_max" DECIMAL(10,2),
    "description" TEXT,
    "validation_rules" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vital_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vital_readings" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "vital_type_id" UUID NOT NULL,
    "adherence_record_id" UUID,
    "value" DECIMAL(10,2),
    "unit" VARCHAR(20),
    "reading_time" TIMESTAMPTZ(6) NOT NULL,
    "device_info" JSONB DEFAULT '{}',
    "is_flagged" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "is_validated" BOOLEAN DEFAULT false,
    "validated_by" UUID,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "systolic_value" DECIMAL(5,2),
    "diastolic_value" DECIMAL(5,2),
    "pulse_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "oxygen_saturation" DECIMAL(5,2),
    "alert_level" "public"."enum_vital_readings_alert_level" DEFAULT 'normal',
    "alert_reasons" JSONB DEFAULT '[]',

    CONSTRAINT "vital_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."symptoms" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "care_plan_id" UUID,
    "symptom_name" VARCHAR(255) NOT NULL,
    "severity" INTEGER,
    "description" TEXT,
    "body_location" JSONB DEFAULT '{}',
    "onset_time" TIMESTAMPTZ(6),
    "recorded_at" TIMESTAMPTZ(6),
    "triggers" JSONB DEFAULT '[]',
    "relieving_factors" JSONB DEFAULT '[]',
    "associated_symptoms" JSONB DEFAULT '[]',
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adherence_records" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "scheduled_event_id" UUID,
    "adherence_type" "public"."enum_adherence_records_adherence_type" NOT NULL,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "recorded_at" TIMESTAMPTZ(6),
    "is_completed" BOOLEAN DEFAULT false,
    "is_partial" BOOLEAN DEFAULT false,
    "is_missed" BOOLEAN DEFAULT false,
    "response_data" JSONB DEFAULT '{}',
    "notes" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "adherence_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_plans" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "service_type" VARCHAR(100),
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "billing_cycle" "public"."enum_service_plans_billing_cycle" NOT NULL DEFAULT 'monthly',
    "features" JSON DEFAULT '[]',
    "patient_limit" INTEGER,
    "trial_period_days" INTEGER DEFAULT 0,
    "setup_fee" DECIMAL(10,2) DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "stripe_price_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "service_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_subscriptions" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "service_plan_id" UUID NOT NULL,
    "status" "public"."enum_patient_subscriptions_status" DEFAULT 'ACTIVE',
    "current_period_start" DATE NOT NULL,
    "current_period_end" DATE NOT NULL,
    "next_billing_date" DATE,
    "trial_start" DATE,
    "trial_end" DATE,
    "payment_method_id" VARCHAR(255),
    "stripe_subscription_id" VARCHAR(255),
    "stripe_customer_id" VARCHAR(255),
    "last_payment_date" TIMESTAMPTZ(6),
    "last_payment_amount" DECIMAL(10,2),
    "failure_count" INTEGER DEFAULT 0,
    "metadata" JSON DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "patient_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_doctor_assignments" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "assignment_type" VARCHAR(50) NOT NULL,
    "permissions" JSONB DEFAULT '{"can_prescribe": false, "can_order_tests": false, "can_view_patient": true, "can_create_care_plans": false, "can_modify_care_plans": false, "can_access_full_history": false}',
    "specialty_focus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "care_plan_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "assigned_by_doctor_id" UUID,
    "assigned_by_admin_id" UUID,
    "patient_consent_required" BOOLEAN DEFAULT false,
    "patient_consent_status" VARCHAR(20) DEFAULT 'not_required',
    "consent_method" VARCHAR(20),
    "consent_otp" VARCHAR(10),
    "consent_otp_expires_at" TIMESTAMPTZ(6),
    "consent_granted_at" TIMESTAMPTZ(6),
    "assignment_start_date" TIMESTAMPTZ(6),
    "assignment_end_date" TIMESTAMPTZ(6),
    "is_active" BOOLEAN DEFAULT true,
    "assignment_reason" TEXT,
    "notes" TEXT,
    "requires_same_organization" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "patient_doctor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_devices" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_type" VARCHAR(50) NOT NULL,
    "push_token" VARCHAR(500) NOT NULL,
    "device_id" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "notification_settings" JSONB DEFAULT '{"vitals": true, "symptoms": true, "emergency": true, "reminders": true, "medications": true, "appointments": true}',
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "patient_id" UUID,
    "doctor_id" UUID,
    "hsp_id" UUID,
    "organization_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" VARCHAR(20) DEFAULT 'MEDIUM',
    "is_urgent" BOOLEAN DEFAULT false,
    "channels" VARCHAR(255)[] DEFAULT ARRAY['PUSH']::VARCHAR(255)[],
    "scheduled_for" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) DEFAULT 'pending',
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "delivery_attempts" INTEGER DEFAULT 0,
    "delivery_log" JSONB DEFAULT '[]',
    "read_at" TIMESTAMPTZ(6),
    "acknowledged_at" TIMESTAMPTZ(6),
    "related_appointment_id" UUID,
    "related_medication_id" UUID,
    "related_care_plan_id" UUID,
    "related_treatment_plan_id" UUID,
    "metadata" JSONB DEFAULT '{}',
    "requires_action" BOOLEAN DEFAULT false,
    "action_url" VARCHAR(500),
    "action_taken" BOOLEAN DEFAULT false,
    "action_taken_at" TIMESTAMPTZ(6),
    "template_id" VARCHAR(100),
    "personalization_data" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "recipient_id" UUID,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "user_role" VARCHAR(50),
    "organization_id" UUID,
    "action" VARCHAR(10) NOT NULL,
    "resource" VARCHAR(500) NOT NULL,
    "patient_id" UUID,
    "phi_accessed" BOOLEAN DEFAULT false,
    "access_granted" BOOLEAN NOT NULL,
    "denial_reason" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "session_id" VARCHAR(255),
    "request_id" UUID,
    "data_changes" JSONB,
    "encrypted_data" JSONB,
    "risk_level" VARCHAR(10) DEFAULT 'low',
    "security_alerts" JSONB DEFAULT '[]',
    "retention_date" TIMESTAMPTZ(6),
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SequelizeMeta" (
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "public"."appointment_slots" (
    "id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "max_appointments" INTEGER DEFAULT 1,
    "booked_appointments" INTEGER DEFAULT 0,
    "is_available" BOOLEAN DEFAULT true,
    "slot_type" "public"."enum_appointment_slots_slot_type" DEFAULT 'regular',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "appointment_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."care_plan_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "template_data" JSONB NOT NULL DEFAULT '{}',
    "created_by" UUID NOT NULL,
    "organization_id" UUID,
    "is_public" BOOLEAN DEFAULT false,
    "is_approved" BOOLEAN DEFAULT false,
    "approved_by" UUID,
    "version" VARCHAR(20) DEFAULT '1.0',
    "parent_template_id" UUID,
    "usage_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "care_plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dashboard_metrics" (
    "id" UUID NOT NULL,
    "entity_type" "public"."enum_dashboard_metrics_entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "metric_type" VARCHAR(100) NOT NULL,
    "metric_data" JSONB NOT NULL DEFAULT '{}',
    "calculated_at" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "dashboard_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doctors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "doctor_id" VARCHAR(50) NOT NULL,
    "organization_id" UUID,
    "medical_license_number" VARCHAR(100) NOT NULL,
    "npi_number" VARCHAR(20),
    "board_certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medical_school" VARCHAR(255),
    "residency_programs" JSONB DEFAULT '[]',
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sub_specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "years_of_experience" INTEGER,
    "capabilities" TEXT[] DEFAULT ARRAY['prescribe_medications', 'order_tests', 'diagnose', 'create_treatment_plans', 'create_care_plans', 'modify_medications', 'monitor_vitals', 'patient_education', 'care_coordination', 'emergency_response']::TEXT[],
    "is_verified" BOOLEAN DEFAULT false,
    "verification_documents" JSONB DEFAULT '[]',
    "verification_date" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "consultation_fee" DECIMAL(10,2),
    "availability_schedule" JSONB DEFAULT '{"friday": {"end": "17:00", "start": "09:00", "available": true}, "monday": {"end": "17:00", "start": "09:00", "available": true}, "sunday": {"available": false}, "tuesday": {"end": "17:00", "start": "09:00", "available": true}, "saturday": {"available": false}, "thursday": {"end": "17:00", "start": "09:00", "available": true}, "wednesday": {"end": "17:00", "start": "09:00", "available": true}}',
    "languages_spoken" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "notification_preferences" JSONB DEFAULT '{"patient_updates": true, "emergency_alerts": true, "peer_consultations": true, "system_notifications": true, "appointment_reminders": true}',
    "practice_name" VARCHAR(255),
    "practice_address" JSONB DEFAULT '{}',
    "practice_phone" VARCHAR(20),
    "signature_pic" TEXT,
    "razorpay_account_id" VARCHAR(255),
    "total_patients" INTEGER DEFAULT 0,
    "active_treatment_plans" INTEGER DEFAULT 0,
    "active_care_plans" INTEGER DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "total_reviews" INTEGER DEFAULT 0,
    "is_available_online" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "speciality_id" INTEGER,
    "profile_picture_url" TEXT,
    "banner_image_url" TEXT,
    "qualification_details" JSONB DEFAULT '[]',
    "registration_details" JSONB DEFAULT '{}',
    "subscription_details" JSONB DEFAULT '{}',
    "signature_image_url" TEXT,
    "signature_data" TEXT,
    "gender" VARCHAR(20),
    "mobile_number" VARCHAR(20),

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hsps" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "hsp_id" VARCHAR(50) NOT NULL,
    "organization_id" UUID,
    "hsp_type" VARCHAR(50) NOT NULL,
    "license_number" VARCHAR(100),
    "certification_number" VARCHAR(100),
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" JSONB DEFAULT '[]',
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "years_of_experience" INTEGER,
    "capabilities" TEXT[] DEFAULT ARRAY['monitor_vitals', 'patient_education', 'care_coordination']::TEXT[],
    "requires_supervision" BOOLEAN DEFAULT true,
    "supervising_doctor_id" UUID,
    "supervision_level" VARCHAR(20) DEFAULT 'direct',
    "is_verified" BOOLEAN DEFAULT false,
    "verification_documents" JSONB DEFAULT '[]',
    "verification_date" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "hourly_rate" DECIMAL(8,2),
    "availability_schedule" JSONB DEFAULT '{"friday": {"end": "18:00", "start": "08:00", "available": true}, "monday": {"end": "18:00", "start": "08:00", "available": true}, "sunday": {"available": false}, "tuesday": {"end": "18:00", "start": "08:00", "available": true}, "saturday": {"available": false}, "thursday": {"end": "18:00", "start": "08:00", "available": true}, "wednesday": {"end": "18:00", "start": "08:00", "available": true}}',
    "languages_spoken" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "notification_preferences" JSONB DEFAULT '{"patient_updates": true, "shift_reminders": true, "emergency_alerts": true, "system_notifications": true}',
    "departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shift_preferences" JSONB DEFAULT '{"preferred_shifts": ["day"], "weekend_availability": false, "night_shift_available": false}',
    "total_patients_assisted" INTEGER DEFAULT 0,
    "active_care_plans" INTEGER DEFAULT 0,
    "tasks_completed" INTEGER DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "total_reviews" INTEGER DEFAULT 0,
    "is_available" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "hsps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medication_logs" (
    "id" UUID NOT NULL,
    "medication_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "taken_at" TIMESTAMPTZ(6),
    "dosage_taken" VARCHAR(100),
    "notes" TEXT,
    "adherence_status" "public"."enum_medication_logs_adherence_status" DEFAULT 'missed',
    "reminder_sent" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "medication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_alerts" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "alert_type" "public"."enum_patient_alerts_alert_type" NOT NULL,
    "severity" "public"."enum_patient_alerts_severity" DEFAULT 'medium',
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "action_required" BOOLEAN DEFAULT false,
    "acknowledged" BOOLEAN DEFAULT false,
    "acknowledged_at" TIMESTAMPTZ(6),
    "acknowledged_by" UUID,
    "resolved" BOOLEAN DEFAULT false,
    "resolved_at" TIMESTAMPTZ(6),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "patient_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_consent_otp" (
    "id" UUID NOT NULL,
    "secondary_assignment_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "primary_doctor_id" UUID NOT NULL,
    "secondary_doctor_id" UUID,
    "secondary_hsp_id" UUID,
    "otp_code" VARCHAR(10) NOT NULL,
    "otp_method" "public"."enum_patient_consent_otp_otp_method" DEFAULT 'both',
    "patient_phone" VARCHAR(20),
    "patient_email" VARCHAR(255),
    "generated_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempts_count" INTEGER DEFAULT 0,
    "max_attempts" INTEGER DEFAULT 3,
    "is_verified" BOOLEAN DEFAULT false,
    "verified_at" TIMESTAMPTZ(6),
    "is_expired" BOOLEAN DEFAULT false,
    "is_blocked" BOOLEAN DEFAULT false,
    "blocked_at" TIMESTAMPTZ(6),
    "requested_by_user_id" UUID NOT NULL,
    "request_ip_address" INET,
    "request_user_agent" TEXT,
    "sms_sent" BOOLEAN DEFAULT false,
    "sms_sent_at" TIMESTAMPTZ(6),
    "sms_error" TEXT,
    "email_sent" BOOLEAN DEFAULT false,
    "email_sent_at" TIMESTAMPTZ(6),
    "email_error" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "patient_consent_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_provider_assignments" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "role" VARCHAR(50) DEFAULT 'primary',
    "assigned_at" TIMESTAMPTZ(6),
    "assigned_by" UUID,
    "ended_at" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "patient_provider_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_provider_consent_history" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "previous_provider_id" UUID,
    "new_provider_id" UUID NOT NULL,
    "doctor_id" UUID,
    "hsp_id" UUID,
    "consent_required" BOOLEAN DEFAULT false,
    "consent_requested" BOOLEAN DEFAULT false,
    "consent_requested_at" TIMESTAMPTZ(6),
    "consent_given" BOOLEAN DEFAULT false,
    "consent_given_at" TIMESTAMPTZ(6),
    "consent_method" "public"."enum_patient_provider_consent_history_consent_method",
    "consent_token" VARCHAR(100),
    "consent_token_expires_at" TIMESTAMPTZ(6),
    "consent_verified" BOOLEAN DEFAULT false,
    "consent_denied" BOOLEAN DEFAULT false,
    "consent_denied_at" TIMESTAMPTZ(6),
    "reason" TEXT,
    "initiated_by" UUID,
    "status" "public"."enum_patient_provider_consent_history_status" DEFAULT 'pending',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "patient_provider_consent_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "stripe_payment_method_id" VARCHAR(255) NOT NULL,
    "type" "public"."enum_payment_methods_type" NOT NULL,
    "card_brand" VARCHAR(50),
    "card_last4" VARCHAR(4),
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "bank_name" VARCHAR(100),
    "bank_last4" VARCHAR(4),
    "is_default" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "billing_address" JSON,
    "metadata" JSON DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "status" "public"."enum_payments_status" DEFAULT 'pending',
    "payment_method" "public"."enum_payments_payment_method" NOT NULL,
    "stripe_payment_intent_id" VARCHAR(255),
    "stripe_charge_id" VARCHAR(255),
    "failure_code" VARCHAR(100),
    "failure_message" TEXT,
    "refund_amount" DECIMAL(10,2) DEFAULT 0,
    "refund_reason" VARCHAR(255),
    "invoice_id" VARCHAR(255),
    "billing_period_start" DATE,
    "billing_period_end" DATE,
    "metadata" JSON DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_change_history" (
    "id" UUID NOT NULL,
    "practitioner_type" "public"."enum_provider_change_history_practitioner_type" NOT NULL,
    "practitioner_id" UUID NOT NULL,
    "previous_provider_id" UUID,
    "new_provider_id" UUID NOT NULL,
    "change_date" TIMESTAMPTZ(6) NOT NULL,
    "affected_patients_count" INTEGER DEFAULT 0,
    "consent_required_count" INTEGER DEFAULT 0,
    "consent_obtained_count" INTEGER DEFAULT 0,
    "reason" TEXT,
    "status" "public"."enum_provider_change_history_status" DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "provider_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."providers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(255),
    "state" VARCHAR(255),
    "activated_on" TIMESTAMPTZ(6),
    "details" JSON,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedule_events" (
    "id" UUID NOT NULL,
    "critical" BOOLEAN,
    "event_type" "public"."enum_schedule_events_event_type",
    "event_id" UUID,
    "details" JSON,
    "status" "public"."enum_schedule_events_status" NOT NULL DEFAULT 'pending',
    "date" DATE,
    "start_time" TIMESTAMPTZ(6),
    "end_time" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "schedule_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheduled_events" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "care_plan_id" UUID,
    "event_type" "public"."enum_scheduled_events_event_type" NOT NULL,
    "event_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scheduled_for" TIMESTAMPTZ(6) NOT NULL,
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "status" "public"."enum_scheduled_events_status" DEFAULT 'SCHEDULED',
    "priority" "public"."enum_scheduled_events_priority" DEFAULT 'MEDIUM',
    "event_data" JSONB DEFAULT '{}',
    "completed_at" TIMESTAMPTZ(6),
    "completed_by" UUID,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "scheduled_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."secondary_doctor_assignments" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "primary_doctor_id" UUID NOT NULL,
    "secondary_doctor_id" UUID,
    "secondary_hsp_id" UUID,
    "assignment_reason" TEXT,
    "specialty_focus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "care_plan_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "primary_doctor_provider_id" UUID,
    "secondary_doctor_provider_id" UUID,
    "consent_required" BOOLEAN DEFAULT true,
    "consent_status" "public"."enum_secondary_doctor_assignments_consent_status" DEFAULT 'pending',
    "access_granted" BOOLEAN DEFAULT false,
    "first_access_attempt_at" TIMESTAMPTZ(6),
    "access_granted_at" TIMESTAMPTZ(6),
    "consent_expires_at" TIMESTAMPTZ(6),
    "consent_duration_months" INTEGER DEFAULT 6,
    "is_active" BOOLEAN DEFAULT true,
    "assignment_start_date" TIMESTAMPTZ(6),
    "assignment_end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "secondary_doctor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."symptoms_database" (
    "id" UUID NOT NULL,
    "diagnosis_name" VARCHAR(255) NOT NULL,
    "symptoms" JSONB DEFAULT '{}',
    "category" VARCHAR(100),
    "severity_indicators" JSONB DEFAULT '{}',
    "common_age_groups" JSONB DEFAULT '[]',
    "gender_specific" VARCHAR(20),
    "is_active" BOOLEAN DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "symptoms_database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatment_database" (
    "id" UUID NOT NULL,
    "treatment_name" VARCHAR(255) NOT NULL,
    "treatment_type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "applicable_conditions" JSONB DEFAULT '[]',
    "duration" VARCHAR(100),
    "frequency" VARCHAR(100),
    "dosage_info" JSONB DEFAULT '{}',
    "category" VARCHAR(100),
    "severity_level" VARCHAR(20),
    "age_restrictions" JSONB DEFAULT '{}',
    "contraindications" JSONB DEFAULT '[]',
    "side_effects" JSONB DEFAULT '[]',
    "monitoring_required" JSONB DEFAULT '[]',
    "is_active" BOOLEAN DEFAULT true,
    "requires_specialist" BOOLEAN DEFAULT false,
    "prescription_required" BOOLEAN DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "treatment_database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treatment_plans" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "organization_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "plan_type" VARCHAR(20) DEFAULT 'treatment_plan',
    "primary_diagnosis" VARCHAR(255) NOT NULL,
    "secondary_diagnoses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chief_complaint" TEXT,
    "symptoms" JSONB DEFAULT '[]',
    "treatment_goals" JSONB DEFAULT '[]',
    "interventions" JSONB DEFAULT '[]',
    "medications" JSONB DEFAULT '[]',
    "instructions" TEXT,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "expected_duration_days" INTEGER,
    "end_date" TIMESTAMPTZ(6),
    "follow_up_required" BOOLEAN DEFAULT true,
    "follow_up_date" TIMESTAMPTZ(6),
    "follow_up_instructions" TEXT,
    "status" VARCHAR(20) DEFAULT 'ACTIVE',
    "priority" VARCHAR(20) DEFAULT 'MEDIUM',
    "progress_notes" JSONB DEFAULT '[]',
    "completion_percentage" INTEGER DEFAULT 0,
    "outcome" TEXT,
    "emergency_contacts" JSONB DEFAULT '[]',
    "warning_signs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assigned_hsps" UUID[] DEFAULT ARRAY[]::UUID[],
    "care_team_notes" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" UUID NOT NULL,
    "user_identity" UUID NOT NULL,
    "linked_with" "public"."enum_user_roles_linked_with",
    "linked_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vital_requirements" (
    "id" UUID NOT NULL,
    "care_plan_id" UUID NOT NULL,
    "vital_type_id" UUID NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "preferred_time" TIME(6),
    "is_critical" BOOLEAN DEFAULT false,
    "monitoring_notes" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vital_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vital_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "unit" VARCHAR(255),
    "details" JSON,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vital_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vitals" (
    "id" UUID NOT NULL,
    "vital_template_id" UUID NOT NULL,
    "care_plan_id" UUID NOT NULL,
    "details" JSON,
    "description" VARCHAR(1000),
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "vitals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_license_number_key" ON "public"."organizations"("license_number");

-- CreateIndex
CREATE INDEX "organizations_is_active" ON "public"."organizations"("is_active");

-- CreateIndex
CREATE INDEX "organizations_name" ON "public"."organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_type" ON "public"."organizations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email_status" ON "public"."users"("email", "account_status");

-- CreateIndex
CREATE INDEX "idx_users_role_status" ON "public"."users"("role", "account_status");

-- CreateIndex
CREATE INDEX "users_account_status" ON "public"."users"("account_status");

-- CreateIndex
CREATE INDEX "users_email_verified" ON "public"."users"("email_verified");

-- CreateIndex
CREATE INDEX "users_full_name" ON "public"."users"("full_name");

-- CreateIndex
CREATE INDEX "users_last_login_at" ON "public"."users"("last_login_at");

-- CreateIndex
CREATE INDEX "users_phone" ON "public"."users"("phone");

-- CreateIndex
CREATE INDEX "users_role" ON "public"."users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "patients_user_id" ON "public"."patients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_medical_record_number_key" ON "public"."patients"("medical_record_number");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patient_id_key" ON "public"."patients"("patient_id");

-- CreateIndex
CREATE INDEX "idx_patients_doctor_created_active" ON "public"."patients"("primary_care_doctor_id", "created_at", "is_active");

-- CreateIndex
CREATE INDEX "idx_patients_id_created" ON "public"."patients"("patient_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_patients_user_doctor" ON "public"."patients"("user_id", "primary_care_doctor_id");

-- CreateIndex
CREATE INDEX "patients_allergies" ON "public"."patients" USING GIN ("allergies");

-- CreateIndex
CREATE INDEX "patients_is_active" ON "public"."patients"("is_active");

-- CreateIndex
CREATE INDEX "patients_linked_provider_id" ON "public"."patients"("linked_provider_id");

-- CreateIndex
CREATE INDEX "patients_medical_history" ON "public"."patients" USING GIN ("medical_history");

-- CreateIndex
CREATE INDEX "patients_organization_id" ON "public"."patients"("organization_id");

-- CreateIndex
CREATE INDEX "patients_primary_care_doctor_id" ON "public"."patients"("primary_care_doctor_id");

-- CreateIndex
CREATE INDEX "patients_primary_care_hsp_id" ON "public"."patients"("primary_care_hsp_id");

-- CreateIndex
CREATE INDEX "patients_provider_consent_given" ON "public"."patients"("provider_consent_given");

-- CreateIndex
CREATE INDEX "patients_provider_linked_at" ON "public"."patients"("provider_linked_at");

-- CreateIndex
CREATE INDEX "patients_risk_level" ON "public"."patients"("risk_level");

-- CreateIndex
CREATE UNIQUE INDEX "healthcare_providers_user_id" ON "public"."healthcare_providers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "healthcare_providers_license_number_key" ON "public"."healthcare_providers"("license_number");

-- CreateIndex
CREATE INDEX "healthcare_providers_is_verified" ON "public"."healthcare_providers"("is_verified");

-- CreateIndex
CREATE INDEX "healthcare_providers_organization_id" ON "public"."healthcare_providers"("organization_id");

-- CreateIndex
CREATE INDEX "healthcare_providers_specialties" ON "public"."healthcare_providers" USING GIN ("specialties");

-- CreateIndex
CREATE INDEX "healthcare_providers_verification_date" ON "public"."healthcare_providers"("verification_date");

-- CreateIndex
CREATE INDEX "idx_providers_org_verified" ON "public"."healthcare_providers"("organization_id", "is_verified");

-- CreateIndex
CREATE INDEX "clinics_doctor_id" ON "public"."clinics"("doctor_id");

-- CreateIndex
CREATE INDEX "clinics_is_active" ON "public"."clinics"("is_active");

-- CreateIndex
CREATE INDEX "clinics_is_primary" ON "public"."clinics"("is_primary");

-- CreateIndex
CREATE INDEX "clinics_organization_id" ON "public"."clinics"("organization_id");

-- CreateIndex
CREATE INDEX "idx_clinics_coordinates" ON "public"."clinics"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_clinics_location_verified" ON "public"."clinics"("location_verified");

-- CreateIndex
CREATE INDEX "care_plans_chronic_conditions" ON "public"."care_plans" USING GIN ("chronic_conditions");

-- CreateIndex
CREATE INDEX "care_plans_created_by_doctor_id" ON "public"."care_plans"("created_by_doctor_id");

-- CreateIndex
CREATE INDEX "care_plans_created_by_hsp_id" ON "public"."care_plans"("created_by_hsp_id");

-- CreateIndex
CREATE INDEX "care_plans_monitoring_parameters" ON "public"."care_plans" USING GIN ("monitoring_parameters");

-- CreateIndex
CREATE INDEX "care_plans_next_review_date" ON "public"."care_plans"("next_review_date");

-- CreateIndex
CREATE INDEX "care_plans_organization_id" ON "public"."care_plans"("organization_id");

-- CreateIndex
CREATE INDEX "care_plans_patient_id" ON "public"."care_plans"("patient_id");

-- CreateIndex
CREATE INDEX "care_plans_priority" ON "public"."care_plans"("priority");

-- CreateIndex
CREATE INDEX "care_plans_start_date" ON "public"."care_plans"("start_date");

-- CreateIndex
CREATE INDEX "care_plans_status" ON "public"."care_plans"("status");

-- CreateIndex
CREATE INDEX "idx_careplans_patient_status_start_fixed" ON "public"."care_plans"("patient_id", "status", "start_date");

-- CreateIndex
CREATE INDEX "medications_medicine_id" ON "public"."medications"("medicine_id");

-- CreateIndex
CREATE INDEX "medications_organizer_type_organizer_id" ON "public"."medications"("organizer_type", "organizer_id");

-- CreateIndex
CREATE INDEX "medications_participant_id" ON "public"."medications"("participant_id");

-- CreateIndex
CREATE INDEX "appointments_organizer_id_organizer_type" ON "public"."appointments"("organizer_id", "organizer_type");

-- CreateIndex
CREATE INDEX "appointments_participant_one_id_participant_one_type" ON "public"."appointments"("participant_one_id", "participant_one_type");

-- CreateIndex
CREATE INDEX "appointments_participant_two_id_participant_two_type" ON "public"."appointments"("participant_two_id", "participant_two_type");

-- CreateIndex
CREATE INDEX "appointments_slot_id" ON "public"."appointments"("slot_id");

-- CreateIndex
CREATE INDEX "appointments_start_date" ON "public"."appointments"("start_date");

-- CreateIndex
CREATE INDEX "idx_appointments_organizer_time" ON "public"."appointments"("organizer_type", "organizer_id", "start_time");

-- CreateIndex
CREATE INDEX "idx_appointments_patient_time" ON "public"."appointments"("patient_id", "start_time");

-- CreateIndex
CREATE INDEX "idx_appointments_provider_time" ON "public"."appointments"("provider_id", "start_time");

-- CreateIndex
CREATE INDEX "doctor_availability_doctor_id_day_of_week" ON "public"."doctor_availability"("doctor_id", "day_of_week");

-- CreateIndex
CREATE INDEX "doctor_availability_doctor_id_is_available" ON "public"."doctor_availability"("doctor_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "vital_types_name" ON "public"."vital_types"("name");

-- CreateIndex
CREATE INDEX "vital_types_unit" ON "public"."vital_types"("unit");

-- CreateIndex
CREATE INDEX "idx_vitals_patient_time_type" ON "public"."vital_readings"("patient_id", "reading_time", "vital_type_id");

-- CreateIndex
CREATE INDEX "idx_vitals_patient_type_time_desc" ON "public"."vital_readings"("patient_id", "vital_type_id", "reading_time");

-- CreateIndex
CREATE INDEX "idx_vitals_time_patient" ON "public"."vital_readings"("reading_time", "patient_id");

-- CreateIndex
CREATE INDEX "vital_readings_alert_level_idx" ON "public"."vital_readings"("alert_level");

-- CreateIndex
CREATE INDEX "vital_readings_blood_pressure_idx" ON "public"."vital_readings"("systolic_value", "diastolic_value");

-- CreateIndex
CREATE INDEX "vital_readings_is_flagged" ON "public"."vital_readings"("is_flagged");

-- CreateIndex
CREATE INDEX "vital_readings_is_validated" ON "public"."vital_readings"("is_validated");

-- CreateIndex
CREATE INDEX "vital_readings_patient_id" ON "public"."vital_readings"("patient_id");

-- CreateIndex
CREATE INDEX "vital_readings_patient_id_vital_type_id_reading_time" ON "public"."vital_readings"("patient_id", "vital_type_id", "reading_time");

-- CreateIndex
CREATE INDEX "vital_readings_reading_time" ON "public"."vital_readings"("reading_time");

-- CreateIndex
CREATE INDEX "vital_readings_vital_type_id" ON "public"."vital_readings"("vital_type_id");

-- CreateIndex
CREATE INDEX "idx_symptoms_patient_onset_severity" ON "public"."symptoms"("patient_id", "onset_time", "severity");

-- CreateIndex
CREATE INDEX "symptoms_care_plan_id" ON "public"."symptoms"("care_plan_id");

-- CreateIndex
CREATE INDEX "symptoms_onset_time" ON "public"."symptoms"("onset_time");

-- CreateIndex
CREATE INDEX "symptoms_patient_id" ON "public"."symptoms"("patient_id");

-- CreateIndex
CREATE INDEX "symptoms_patient_id_recorded_at" ON "public"."symptoms"("patient_id", "recorded_at");

-- CreateIndex
CREATE INDEX "symptoms_recorded_at" ON "public"."symptoms"("recorded_at");

-- CreateIndex
CREATE INDEX "symptoms_severity" ON "public"."symptoms"("severity");

-- CreateIndex
CREATE INDEX "symptoms_symptom_name" ON "public"."symptoms"("symptom_name");

-- CreateIndex
CREATE INDEX "adherence_records_adherence_type" ON "public"."adherence_records"("adherence_type");

-- CreateIndex
CREATE INDEX "adherence_records_due_at" ON "public"."adherence_records"("due_at");

-- CreateIndex
CREATE INDEX "adherence_records_is_completed_is_missed" ON "public"."adherence_records"("is_completed", "is_missed");

-- CreateIndex
CREATE INDEX "adherence_records_patient_id" ON "public"."adherence_records"("patient_id");

-- CreateIndex
CREATE INDEX "adherence_records_patient_id_adherence_type_due_at" ON "public"."adherence_records"("patient_id", "adherence_type", "due_at");

-- CreateIndex
CREATE INDEX "adherence_records_patient_id_due_at" ON "public"."adherence_records"("patient_id", "due_at");

-- CreateIndex
CREATE INDEX "adherence_records_scheduled_event_id" ON "public"."adherence_records"("scheduled_event_id");

-- CreateIndex
CREATE INDEX "idx_adherence_event_status_completed" ON "public"."adherence_records"("scheduled_event_id", "is_completed", "recorded_at");

-- CreateIndex
CREATE INDEX "idx_adherence_patient_due_status" ON "public"."adherence_records"("patient_id", "due_at", "is_completed");

-- CreateIndex
CREATE INDEX "service_plans_billing_cycle" ON "public"."service_plans"("billing_cycle");

-- CreateIndex
CREATE INDEX "service_plans_is_active" ON "public"."service_plans"("is_active");

-- CreateIndex
CREATE INDEX "service_plans_name" ON "public"."service_plans"("name");

-- CreateIndex
CREATE INDEX "service_plans_price" ON "public"."service_plans"("price");

-- CreateIndex
CREATE INDEX "service_plans_provider_id" ON "public"."service_plans"("provider_id");

-- CreateIndex
CREATE INDEX "service_plans_service_type" ON "public"."service_plans"("service_type");

-- CreateIndex
CREATE UNIQUE INDEX "patient_subscriptions_stripe_subscription_id_key" ON "public"."patient_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "patient_subscriptions_next_billing_date" ON "public"."patient_subscriptions"("next_billing_date");

-- CreateIndex
CREATE INDEX "patient_subscriptions_patient_id" ON "public"."patient_subscriptions"("patient_id");

-- CreateIndex
CREATE INDEX "patient_subscriptions_patient_id_provider_id" ON "public"."patient_subscriptions"("patient_id", "provider_id");

-- CreateIndex
CREATE INDEX "patient_subscriptions_provider_id" ON "public"."patient_subscriptions"("provider_id");

-- CreateIndex
CREATE INDEX "patient_subscriptions_service_plan_id" ON "public"."patient_subscriptions"("service_plan_id");

-- CreateIndex
CREATE INDEX "patient_subscriptions_status" ON "public"."patient_subscriptions"("status");

-- CreateIndex
CREATE INDEX "patient_subscriptions_stripe_customer_id" ON "public"."patient_subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "patient_subscriptions_stripe_subscription_id" ON "public"."patient_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "idx_assignments_doctor_active_created" ON "public"."patient_doctor_assignments"("doctor_id", "is_active", "created_at");

-- CreateIndex
CREATE INDEX "idx_assignments_patient_type_active" ON "public"."patient_doctor_assignments"("patient_id", "assignment_type", "is_active");

-- CreateIndex
CREATE INDEX "patient_doctor_assignments_assignment_type" ON "public"."patient_doctor_assignments"("assignment_type");

-- CreateIndex
CREATE INDEX "patient_doctor_assignments_doctor_id" ON "public"."patient_doctor_assignments"("doctor_id");

-- CreateIndex
CREATE INDEX "patient_doctor_assignments_is_active" ON "public"."patient_doctor_assignments"("is_active");

-- CreateIndex
CREATE INDEX "patient_doctor_assignments_patient_consent_status" ON "public"."patient_doctor_assignments"("patient_consent_status");

-- CreateIndex
CREATE INDEX "patient_doctor_assignments_patient_id" ON "public"."patient_doctor_assignments"("patient_id");

-- CreateIndex
CREATE INDEX "user_devices_device_type" ON "public"."user_devices"("device_type");

-- CreateIndex
CREATE INDEX "user_devices_is_active" ON "public"."user_devices"("is_active");

-- CreateIndex
CREATE INDEX "user_devices_last_used_at" ON "public"."user_devices"("last_used_at");

-- CreateIndex
CREATE INDEX "user_devices_push_token" ON "public"."user_devices"("push_token");

-- CreateIndex
CREATE INDEX "user_devices_user_id" ON "public"."user_devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_push_token" ON "public"."user_devices"("user_id", "push_token");

-- CreateIndex
CREATE INDEX "idx_notifications_type_priority_created" ON "public"."notifications"("type", "priority", "created_at");

-- CreateIndex
CREATE INDEX "notifications_doctor_id" ON "public"."notifications"("doctor_id");

-- CreateIndex
CREATE INDEX "notifications_expires_at" ON "public"."notifications"("expires_at");

-- CreateIndex
CREATE INDEX "notifications_hsp_id" ON "public"."notifications"("hsp_id");

-- CreateIndex
CREATE INDEX "notifications_is_urgent" ON "public"."notifications"("is_urgent");

-- CreateIndex
CREATE INDEX "notifications_organization_id" ON "public"."notifications"("organization_id");

-- CreateIndex
CREATE INDEX "notifications_patient_id" ON "public"."notifications"("patient_id");

-- CreateIndex
CREATE INDEX "notifications_patient_id_status_created_at" ON "public"."notifications"("patient_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "notifications_priority" ON "public"."notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_requires_action_action_taken" ON "public"."notifications"("requires_action", "action_taken");

-- CreateIndex
CREATE INDEX "notifications_scheduled_for" ON "public"."notifications"("scheduled_for");

-- CreateIndex
CREATE INDEX "notifications_status" ON "public"."notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_status_scheduled_for_expires_at" ON "public"."notifications"("status", "scheduled_for", "expires_at");

-- CreateIndex
CREATE INDEX "notifications_type" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "audit_logs_access_granted" ON "public"."audit_logs"("access_granted");

-- CreateIndex
CREATE INDEX "audit_logs_action" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_ip_address" ON "public"."audit_logs"("ip_address");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id" ON "public"."audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_patient_id" ON "public"."audit_logs"("patient_id");

-- CreateIndex
CREATE INDEX "audit_logs_patient_id_phi_accessed_timestamp" ON "public"."audit_logs"("patient_id", "phi_accessed", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_phi_accessed" ON "public"."audit_logs"("phi_accessed");

-- CreateIndex
CREATE INDEX "audit_logs_retention_date" ON "public"."audit_logs"("retention_date");

-- CreateIndex
CREATE INDEX "audit_logs_risk_level" ON "public"."audit_logs"("risk_level");

-- CreateIndex
CREATE INDEX "audit_logs_risk_level_access_granted_timestamp" ON "public"."audit_logs"("risk_level", "access_granted", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_session_id" ON "public"."audit_logs"("session_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp" ON "public"."audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_user_id" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_timestamp" ON "public"."audit_logs"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "idx_audit_user_created_action" ON "public"."audit_logs"("user_id", "created_at", "action");

-- CreateIndex
CREATE INDEX "appointment_slots_date_is_available" ON "public"."appointment_slots"("date", "is_available");

-- CreateIndex
CREATE INDEX "appointment_slots_doctor_id_date_start_time" ON "public"."appointment_slots"("doctor_id", "date", "start_time");

-- CreateIndex
CREATE INDEX "appointment_slots_doctor_id_is_available" ON "public"."appointment_slots"("doctor_id", "is_available");

-- CreateIndex
CREATE INDEX "idx_templates_conditions" ON "public"."care_plan_templates" USING GIN ("conditions");

-- CreateIndex
CREATE INDEX "idx_templates_created_by" ON "public"."care_plan_templates"("created_by");

-- CreateIndex
CREATE INDEX "idx_templates_is_approved" ON "public"."care_plan_templates"("is_approved");

-- CreateIndex
CREATE INDEX "idx_templates_is_public" ON "public"."care_plan_templates"("is_public");

-- CreateIndex
CREATE INDEX "idx_templates_name" ON "public"."care_plan_templates"("name");

-- CreateIndex
CREATE INDEX "idx_templates_organization_id" ON "public"."care_plan_templates"("organization_id");

-- CreateIndex
CREATE INDEX "idx_templates_specialties" ON "public"."care_plan_templates" USING GIN ("specialties");

-- CreateIndex
CREATE INDEX "idx_templates_tags" ON "public"."care_plan_templates" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "dashboard_metrics_calculated_at_valid_until" ON "public"."dashboard_metrics"("calculated_at", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_metrics_entity_type_entity_id_metric_type" ON "public"."dashboard_metrics"("entity_type", "entity_id", "metric_type");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_user_id" ON "public"."doctors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_doctor_id" ON "public"."doctors"("doctor_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_medical_license_number" ON "public"."doctors"("medical_license_number");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_npi_number_key" ON "public"."doctors"("npi_number");

-- CreateIndex
CREATE INDEX "doctors_board_certifications" ON "public"."doctors" USING GIN ("board_certifications");

-- CreateIndex
CREATE INDEX "doctors_gender" ON "public"."doctors"("gender");

-- CreateIndex
CREATE INDEX "doctors_is_verified" ON "public"."doctors"("is_verified");

-- CreateIndex
CREATE INDEX "doctors_is_verified_gender" ON "public"."doctors"("is_verified", "gender");

-- CreateIndex
CREATE INDEX "doctors_organization_id" ON "public"."doctors"("organization_id");

-- CreateIndex
CREATE INDEX "doctors_specialties" ON "public"."doctors" USING GIN ("specialties");

-- CreateIndex
CREATE UNIQUE INDEX "hsps_user_id" ON "public"."hsps"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hsps_hsp_id" ON "public"."hsps"("hsp_id");

-- CreateIndex
CREATE UNIQUE INDEX "hsps_license_number_key" ON "public"."hsps"("license_number");

-- CreateIndex
CREATE INDEX "hsps_departments" ON "public"."hsps" USING GIN ("departments");

-- CreateIndex
CREATE INDEX "hsps_hsp_type" ON "public"."hsps"("hsp_type");

-- CreateIndex
CREATE INDEX "hsps_is_verified" ON "public"."hsps"("is_verified");

-- CreateIndex
CREATE INDEX "hsps_organization_id" ON "public"."hsps"("organization_id");

-- CreateIndex
CREATE INDEX "hsps_specializations" ON "public"."hsps" USING GIN ("specializations");

-- CreateIndex
CREATE INDEX "hsps_supervising_doctor_id" ON "public"."hsps"("supervising_doctor_id");

-- CreateIndex
CREATE INDEX "medication_logs_adherence_status_scheduled_at" ON "public"."medication_logs"("adherence_status", "scheduled_at");

-- CreateIndex
CREATE INDEX "medication_logs_medication_id_scheduled_at" ON "public"."medication_logs"("medication_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "medication_logs_patient_id_scheduled_at" ON "public"."medication_logs"("patient_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "patient_alerts_acknowledged_resolved" ON "public"."patient_alerts"("acknowledged", "resolved");

-- CreateIndex
CREATE INDEX "patient_alerts_created_at" ON "public"."patient_alerts"("created_at");

-- CreateIndex
CREATE INDEX "patient_alerts_patient_id_alert_type_severity" ON "public"."patient_alerts"("patient_id", "alert_type", "severity");

-- CreateIndex
CREATE INDEX "patient_consent_otp_expires_at" ON "public"."patient_consent_otp"("expires_at");

-- CreateIndex
CREATE INDEX "patient_consent_otp_generated_at" ON "public"."patient_consent_otp"("generated_at");

-- CreateIndex
CREATE INDEX "patient_consent_otp_is_blocked" ON "public"."patient_consent_otp"("is_blocked");

-- CreateIndex
CREATE INDEX "patient_consent_otp_is_expired" ON "public"."patient_consent_otp"("is_expired");

-- CreateIndex
CREATE INDEX "patient_consent_otp_is_verified" ON "public"."patient_consent_otp"("is_verified");

-- CreateIndex
CREATE INDEX "patient_consent_otp_otp_code" ON "public"."patient_consent_otp"("otp_code");

-- CreateIndex
CREATE INDEX "patient_consent_otp_patient_id" ON "public"."patient_consent_otp"("patient_id");

-- CreateIndex
CREATE INDEX "patient_consent_otp_requested_by_user_id" ON "public"."patient_consent_otp"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "patient_consent_otp_secondary_assignment_id" ON "public"."patient_consent_otp"("secondary_assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_provider_role_unique" ON "public"."patient_provider_assignments"("patient_id", "provider_id", "role", "ended_at");

-- CreateIndex
CREATE INDEX "patient_provider_consent_history_consent_requested_at" ON "public"."patient_provider_consent_history"("consent_requested_at");

-- CreateIndex
CREATE INDEX "patient_provider_consent_history_doctor_id" ON "public"."patient_provider_consent_history"("doctor_id");

-- CreateIndex
CREATE INDEX "patient_provider_consent_history_hsp_id" ON "public"."patient_provider_consent_history"("hsp_id");

-- CreateIndex
CREATE INDEX "patient_provider_consent_history_new_provider_id" ON "public"."patient_provider_consent_history"("new_provider_id");

-- CreateIndex
CREATE INDEX "patient_provider_consent_history_patient_id_status" ON "public"."patient_provider_consent_history"("patient_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_stripe_payment_method_id_key" ON "public"."payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE INDEX "payment_methods_is_active" ON "public"."payment_methods"("is_active");

-- CreateIndex
CREATE INDEX "payment_methods_is_default" ON "public"."payment_methods"("is_default");

-- CreateIndex
CREATE INDEX "payment_methods_patient_id" ON "public"."payment_methods"("patient_id");

-- CreateIndex
CREATE INDEX "payment_methods_stripe_payment_method_id" ON "public"."payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE INDEX "payment_methods_type" ON "public"."payment_methods"("type");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "public"."payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "payments_billing_period_start_billing_period_end" ON "public"."payments"("billing_period_start", "billing_period_end");

-- CreateIndex
CREATE INDEX "payments_created_at" ON "public"."payments"("created_at");

-- CreateIndex
CREATE INDEX "payments_patient_id" ON "public"."payments"("patient_id");

-- CreateIndex
CREATE INDEX "payments_provider_id" ON "public"."payments"("provider_id");

-- CreateIndex
CREATE INDEX "payments_status" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_stripe_payment_intent_id" ON "public"."payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "payments_subscription_id" ON "public"."payments"("subscription_id");

-- CreateIndex
CREATE INDEX "provider_change_history_change_date" ON "public"."provider_change_history"("change_date");

-- CreateIndex
CREATE INDEX "provider_change_history_new_provider_id" ON "public"."provider_change_history"("new_provider_id");

-- CreateIndex
CREATE INDEX "provider_change_history_practitioner_type_practitioner_id" ON "public"."provider_change_history"("practitioner_type", "practitioner_id");

-- CreateIndex
CREATE INDEX "provider_change_history_status" ON "public"."provider_change_history"("status");

-- CreateIndex
CREATE INDEX "providers_user_id" ON "public"."providers"("user_id");

-- CreateIndex
CREATE INDEX "schedule_events_event_id_event_type" ON "public"."schedule_events"("event_id", "event_type");

-- CreateIndex
CREATE INDEX "schedule_events_event_type_status_date_start_time" ON "public"."schedule_events"("event_type", "status", "date", "start_time");

-- CreateIndex
CREATE INDEX "schedule_events_status_date" ON "public"."schedule_events"("status", "date");

-- CreateIndex
CREATE INDEX "idx_events_careplan_time_type" ON "public"."scheduled_events"("care_plan_id", "scheduled_for", "event_type");

-- CreateIndex
CREATE INDEX "idx_events_patient_time_status" ON "public"."scheduled_events"("patient_id", "scheduled_for", "status");

-- CreateIndex
CREATE INDEX "scheduled_events_care_plan_id" ON "public"."scheduled_events"("care_plan_id");

-- CreateIndex
CREATE INDEX "secondary_doctor_assignments_access_granted" ON "public"."secondary_doctor_assignments"("access_granted");

-- CreateIndex
CREATE INDEX "secondary_doctor_assignments_consent_expires_at" ON "public"."secondary_doctor_assignments"("consent_expires_at");

-- CreateIndex
CREATE INDEX "secondary_doctor_assignments_consent_status" ON "public"."secondary_doctor_assignments"("consent_status");

-- CreateIndex
CREATE INDEX "secondary_doctor_assignments_is_active" ON "public"."secondary_doctor_assignments"("is_active");

-- CreateIndex
CREATE INDEX "secondary_doctor_assignments_patient_id" ON "public"."secondary_doctor_assignments"("patient_id");

-- CreateIndex
CREATE INDEX "secondary_doctor_assignments_primary_doctor_id" ON "public"."secondary_doctor_assignments"("primary_doctor_id");

-- CreateIndex
CREATE INDEX "secondary_doctor_assignments_secondary_doctor_id" ON "public"."secondary_doctor_assignments"("secondary_doctor_id");

-- CreateIndex
CREATE INDEX "secondary_doctor_assignments_secondary_hsp_id" ON "public"."secondary_doctor_assignments"("secondary_hsp_id");

-- CreateIndex
CREATE UNIQUE INDEX "symptoms_database_diagnosis_name" ON "public"."symptoms_database"("diagnosis_name");

-- CreateIndex
CREATE INDEX "symptoms_database_category" ON "public"."symptoms_database"("category");

-- CreateIndex
CREATE INDEX "symptoms_database_is_active" ON "public"."symptoms_database"("is_active");

-- CreateIndex
CREATE INDEX "symptoms_database_symptoms" ON "public"."symptoms_database" USING GIN ("symptoms");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_database_treatment_name" ON "public"."treatment_database"("treatment_name");

-- CreateIndex
CREATE INDEX "treatment_database_applicable_conditions" ON "public"."treatment_database" USING GIN ("applicable_conditions");

-- CreateIndex
CREATE INDEX "treatment_database_category" ON "public"."treatment_database"("category");

-- CreateIndex
CREATE INDEX "treatment_database_is_active" ON "public"."treatment_database"("is_active");

-- CreateIndex
CREATE INDEX "treatment_database_severity_level" ON "public"."treatment_database"("severity_level");

-- CreateIndex
CREATE INDEX "treatment_database_treatment_type" ON "public"."treatment_database"("treatment_type");

-- CreateIndex
CREATE INDEX "treatment_plans_doctor_id" ON "public"."treatment_plans"("doctor_id");

-- CreateIndex
CREATE INDEX "treatment_plans_end_date" ON "public"."treatment_plans"("end_date");

-- CreateIndex
CREATE INDEX "treatment_plans_follow_up_date" ON "public"."treatment_plans"("follow_up_date");

-- CreateIndex
CREATE INDEX "treatment_plans_organization_id" ON "public"."treatment_plans"("organization_id");

-- CreateIndex
CREATE INDEX "treatment_plans_patient_id" ON "public"."treatment_plans"("patient_id");

-- CreateIndex
CREATE INDEX "treatment_plans_primary_diagnosis" ON "public"."treatment_plans"("primary_diagnosis");

-- CreateIndex
CREATE INDEX "treatment_plans_priority" ON "public"."treatment_plans"("priority");

-- CreateIndex
CREATE INDEX "treatment_plans_secondary_diagnoses" ON "public"."treatment_plans" USING GIN ("secondary_diagnoses");

-- CreateIndex
CREATE INDEX "treatment_plans_start_date" ON "public"."treatment_plans"("start_date");

-- CreateIndex
CREATE INDEX "treatment_plans_status" ON "public"."treatment_plans"("status");

-- CreateIndex
CREATE INDEX "treatment_plans_symptoms" ON "public"."treatment_plans" USING GIN ("symptoms");

-- CreateIndex
CREATE INDEX "idx_userroles_identity_linked" ON "public"."user_roles"("user_identity", "linked_with");

-- CreateIndex
CREATE INDEX "vital_requirements_care_plan_id" ON "public"."vital_requirements"("care_plan_id");

-- CreateIndex
CREATE INDEX "vital_requirements_frequency" ON "public"."vital_requirements"("frequency");

-- CreateIndex
CREATE INDEX "vital_requirements_is_critical" ON "public"."vital_requirements"("is_critical");

-- CreateIndex
CREATE INDEX "vital_requirements_vital_type_id" ON "public"."vital_requirements"("vital_type_id");

-- CreateIndex
CREATE INDEX "vitals_care_plan_id" ON "public"."vitals"("care_plan_id");

-- CreateIndex
CREATE INDEX "vitals_vital_template_id" ON "public"."vitals"("vital_template_id");

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_linked_provider_id_fkey" FOREIGN KEY ("linked_provider_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_primary_care_doctor_id_fkey" FOREIGN KEY ("primary_care_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_primary_care_hsp_id_fkey" FOREIGN KEY ("primary_care_hsp_id") REFERENCES "public"."hsps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."healthcare_providers" ADD CONSTRAINT "healthcare_providers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."healthcare_providers" ADD CONSTRAINT "healthcare_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."healthcare_providers" ADD CONSTRAINT "healthcare_providers_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."clinics" ADD CONSTRAINT "clinics_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clinics" ADD CONSTRAINT "clinics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."care_plans" ADD CONSTRAINT "care_plans_created_by_doctor_id_fkey" FOREIGN KEY ("created_by_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."care_plans" ADD CONSTRAINT "care_plans_created_by_hsp_id_fkey" FOREIGN KEY ("created_by_hsp_id") REFERENCES "public"."hsps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."care_plans" ADD CONSTRAINT "care_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."care_plans" ADD CONSTRAINT "care_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medications" ADD CONSTRAINT "medications_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "public"."care_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medications" ADD CONSTRAINT "medications_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."appointment_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vital_readings" ADD CONSTRAINT "vital_readings_adherence_record_id_fkey" FOREIGN KEY ("adherence_record_id") REFERENCES "public"."adherence_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vital_readings" ADD CONSTRAINT "vital_readings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vital_readings" ADD CONSTRAINT "vital_readings_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."healthcare_providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vital_readings" ADD CONSTRAINT "vital_readings_vital_type_id_fkey" FOREIGN KEY ("vital_type_id") REFERENCES "public"."vital_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."symptoms" ADD CONSTRAINT "symptoms_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "public"."care_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."symptoms" ADD CONSTRAINT "symptoms_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."adherence_records" ADD CONSTRAINT "adherence_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."adherence_records" ADD CONSTRAINT "adherence_records_scheduled_event_id_fkey" FOREIGN KEY ("scheduled_event_id") REFERENCES "public"."scheduled_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."service_plans" ADD CONSTRAINT "service_plans_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."healthcare_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_subscriptions" ADD CONSTRAINT "patient_subscriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_subscriptions" ADD CONSTRAINT "patient_subscriptions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."healthcare_providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_subscriptions" ADD CONSTRAINT "patient_subscriptions_service_plan_id_fkey" FOREIGN KEY ("service_plan_id") REFERENCES "public"."service_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_doctor_assignments" ADD CONSTRAINT "patient_doctor_assignments_assigned_by_admin_id_fkey" FOREIGN KEY ("assigned_by_admin_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_doctor_assignments" ADD CONSTRAINT "patient_doctor_assignments_assigned_by_doctor_id_fkey" FOREIGN KEY ("assigned_by_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_doctor_assignments" ADD CONSTRAINT "patient_doctor_assignments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_doctor_assignments" ADD CONSTRAINT "patient_doctor_assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_hsp_id_fkey" FOREIGN KEY ("hsp_id") REFERENCES "public"."hsps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_related_appointment_id_fkey" FOREIGN KEY ("related_appointment_id") REFERENCES "public"."appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_related_care_plan_id_fkey" FOREIGN KEY ("related_care_plan_id") REFERENCES "public"."care_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_related_medication_id_fkey" FOREIGN KEY ("related_medication_id") REFERENCES "public"."medications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_related_treatment_plan_id_fkey" FOREIGN KEY ("related_treatment_plan_id") REFERENCES "public"."treatment_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointment_slots" ADD CONSTRAINT "appointment_slots_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."care_plan_templates" ADD CONSTRAINT "care_plan_templates_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."care_plan_templates" ADD CONSTRAINT "care_plan_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."healthcare_providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."care_plan_templates" ADD CONSTRAINT "care_plan_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."care_plan_templates" ADD CONSTRAINT "care_plan_templates_parent_template_id_fkey" FOREIGN KEY ("parent_template_id") REFERENCES "public"."care_plan_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_speciality_id_fkey" FOREIGN KEY ("speciality_id") REFERENCES "public"."specialities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."doctors" ADD CONSTRAINT "doctors_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."hsps" ADD CONSTRAINT "hsps_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."hsps" ADD CONSTRAINT "hsps_supervising_doctor_id_fkey" FOREIGN KEY ("supervising_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."hsps" ADD CONSTRAINT "hsps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."hsps" ADD CONSTRAINT "hsps_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."medication_logs" ADD CONSTRAINT "medication_logs_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_logs" ADD CONSTRAINT "medication_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_alerts" ADD CONSTRAINT "patient_alerts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_consent_otp" ADD CONSTRAINT "patient_consent_otp_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_consent_otp" ADD CONSTRAINT "patient_consent_otp_primary_doctor_id_fkey" FOREIGN KEY ("primary_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_consent_otp" ADD CONSTRAINT "patient_consent_otp_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_consent_otp" ADD CONSTRAINT "patient_consent_otp_secondary_assignment_id_fkey" FOREIGN KEY ("secondary_assignment_id") REFERENCES "public"."secondary_doctor_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_consent_otp" ADD CONSTRAINT "patient_consent_otp_secondary_doctor_id_fkey" FOREIGN KEY ("secondary_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_consent_otp" ADD CONSTRAINT "patient_consent_otp_secondary_hsp_id_fkey" FOREIGN KEY ("secondary_hsp_id") REFERENCES "public"."hsps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_provider_assignments" ADD CONSTRAINT "patient_provider_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_provider_assignments" ADD CONSTRAINT "patient_provider_assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_provider_assignments" ADD CONSTRAINT "patient_provider_assignments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."healthcare_providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_provider_consent_history" ADD CONSTRAINT "patient_provider_consent_history_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_provider_consent_history" ADD CONSTRAINT "patient_provider_consent_history_hsp_id_fkey" FOREIGN KEY ("hsp_id") REFERENCES "public"."hsps"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_provider_consent_history" ADD CONSTRAINT "patient_provider_consent_history_new_provider_id_fkey" FOREIGN KEY ("new_provider_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_provider_consent_history" ADD CONSTRAINT "patient_provider_consent_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."patient_provider_consent_history" ADD CONSTRAINT "patient_provider_consent_history_previous_provider_id_fkey" FOREIGN KEY ("previous_provider_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."healthcare_providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."patient_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."provider_change_history" ADD CONSTRAINT "provider_change_history_new_provider_id_fkey" FOREIGN KEY ("new_provider_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."provider_change_history" ADD CONSTRAINT "provider_change_history_previous_provider_id_fkey" FOREIGN KEY ("previous_provider_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."providers" ADD CONSTRAINT "providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scheduled_events" ADD CONSTRAINT "scheduled_events_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "public"."care_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scheduled_events" ADD CONSTRAINT "scheduled_events_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scheduled_events" ADD CONSTRAINT "scheduled_events_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."secondary_doctor_assignments" ADD CONSTRAINT "secondary_doctor_assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondary_doctor_assignments" ADD CONSTRAINT "secondary_doctor_assignments_primary_doctor_id_fkey" FOREIGN KEY ("primary_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondary_doctor_assignments" ADD CONSTRAINT "secondary_doctor_assignments_primary_doctor_provider_id_fkey" FOREIGN KEY ("primary_doctor_provider_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondary_doctor_assignments" ADD CONSTRAINT "secondary_doctor_assignments_secondary_doctor_id_fkey" FOREIGN KEY ("secondary_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondary_doctor_assignments" ADD CONSTRAINT "secondary_doctor_assignments_secondary_doctor_provider_id_fkey" FOREIGN KEY ("secondary_doctor_provider_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondary_doctor_assignments" ADD CONSTRAINT "secondary_doctor_assignments_secondary_hsp_id_fkey" FOREIGN KEY ("secondary_hsp_id") REFERENCES "public"."hsps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_plans" ADD CONSTRAINT "treatment_plans_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treatment_plans" ADD CONSTRAINT "treatment_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."treatment_plans" ADD CONSTRAINT "treatment_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_identity_fkey" FOREIGN KEY ("user_identity") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vital_requirements" ADD CONSTRAINT "vital_requirements_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "public"."care_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vital_requirements" ADD CONSTRAINT "vital_requirements_vital_type_id_fkey" FOREIGN KEY ("vital_type_id") REFERENCES "public"."vital_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."vitals" ADD CONSTRAINT "vitals_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "public"."care_plans"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vitals" ADD CONSTRAINT "vitals_vital_template_id_fkey" FOREIGN KEY ("vital_template_id") REFERENCES "public"."vital_templates"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
