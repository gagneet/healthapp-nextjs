-- Healthcare Management Platform PostgreSQL Schema
-- Generated for Auth.js v5 + Healthcare Application
-- Updated: 2025-08-14
-- Compatible with Prisma ORM and Auth.js v5

-- =============================================
-- ENUMS (Custom Types)
-- =============================================

-- User roles for healthcare platform
CREATE TYPE enum_users_role AS ENUM (
    'PATIENT',
    'DOCTOR', 
    'HSP',
    'SYSTEM_ADMIN',
    'HOSPITAL_ADMIN',
    'CAREGIVER'
);

-- Account status for user management
CREATE TYPE enum_users_account_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'PENDING_VERIFICATION',
    'DEACTIVATED'
);

-- Gender options
CREATE TYPE enum_users_gender AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER',
    'PREFER_NOT_TO_SAY'
);

-- Appointment statuses
CREATE TYPE enum_appointments_status AS ENUM (
    'SCHEDULED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'RESCHEDULED'
);

-- Care plan statuses
CREATE TYPE enum_care_plans_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'COMPLETED',
    'DISCONTINUED',
    'PENDING_APPROVAL'
);

-- Medication adherence levels
CREATE TYPE enum_medication_adherence_level AS ENUM (
    'EXCELLENT',
    'GOOD',
    'FAIR',
    'POOR',
    'UNKNOWN'
);

-- =============================================
-- AUTH.JS V5 REQUIRED TABLES
-- =============================================

-- Users table (extends Auth.js schema for healthcare)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified TIMESTAMPTZ,
    name VARCHAR(255),
    image VARCHAR(500),
    password_hash VARCHAR(255), -- For credentials users
    role enum_users_role NOT NULL DEFAULT 'PATIENT',
    account_status enum_users_account_status DEFAULT 'PENDING_VERIFICATION',
    
    -- Personal information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender enum_users_gender,
    profile_picture_url VARCHAR(500),
    
    -- Security fields
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Privacy and preferences
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    preferences JSON DEFAULT '{"privacy": {"profile_visible": true, "share_data_for_research": false}, "accessibility": {"large_text": false, "high_contrast": false}, "notifications": {"sms": false, "push": true, "email": true}}',
    
    -- Legal compliance
    terms_accepted_at TIMESTAMPTZ,
    privacy_policy_accepted_at TIMESTAMPTZ,
    hipaa_consent_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Auth.js Accounts table (OAuth providers)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

-- Auth.js Sessions table  
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auth.js Verification tokens table
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- This schema includes all phases of the healthcare platform:
-- - Phase 1: Critical Safety & Compliance Features (Medical Safety, HIPAA)
-- - Phase 3: Advanced Medical Device Integration (IoT Devices, Bluetooth)
-- - Phase 4: Telemedicine & Advanced Features (Video Consultations, Lab Integration, Gamification)
--
-- Phases included:
-- ✅ Phase 1: drug_interactions, patient_allergies, medication_safety_alerts, emergency_alerts
-- ✅ Phase 3: connected_devices, device_readings, device_plugins (with Phase 3 device integration)
-- ✅ Phase 4: video_consultations, lab_orders, patient_game_profiles, game_badges
--
-- Usage:
-- To restore this schema: psql -U healthapp_user -d healthapp_dev < docs/postgresql-schema.sql
-- To update schema: PGPASSWORD=pg_password pg_dump -h localhost -p 5434 -U healthapp_user -d healthapp_dev --schema-only --no-owner --no-privileges > docs/postgresql-schema.sql
--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AlertSeverity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AlertSeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: AllergenType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AllergenType" AS ENUM (
    'MEDICATION',
    'FOOD',
    'ENVIRONMENTAL',
    'LATEX',
    'OTHER'
);


--
-- Name: AllergySeverity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AllergySeverity" AS ENUM (
    'MILD',
    'MODERATE',
    'SEVERE',
    'ANAPHYLAXIS'
);


--
-- Name: ConsultationPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConsultationPriority" AS ENUM (
    'ROUTINE',
    'URGENT',
    'EMERGENCY',
    'FOLLOW_UP'
);


--
-- Name: ConsultationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConsultationStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'RESCHEDULED',
    'INTERRUPTED'
);


--
-- Name: ConsultationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConsultationType" AS ENUM (
    'VIDEO_CONSULTATION',
    'AUDIO_CONSULTATION',
    'CHAT_CONSULTATION',
    'EMERGENCY_CONSULTATION',
    'FOLLOW_UP_CONSULTATION',
    'SPECIALIST_REFERRAL'
);


--
-- Name: DrugInteractionSeverity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DrugInteractionSeverity" AS ENUM (
    'MINOR',
    'MODERATE',
    'MAJOR',
    'CONTRAINDICATION'
);


--
-- Name: EmergencyAlertType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmergencyAlertType" AS ENUM (
    'VITAL_CRITICAL',
    'MEDICATION_MISSED_CRITICAL',
    'DEVICE_OFFLINE',
    'PATIENT_UNRESPONSIVE',
    'EMERGENCY_BUTTON',
    'FALL_DETECTED',
    'MEDICATION_OVERDOSE'
);


--
-- Name: EmergencyPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmergencyPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'EMERGENCY',
    'LIFE_THREATENING'
);


--
-- Name: GameBadgeType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GameBadgeType" AS ENUM (
    'ADHERENCE_STREAK',
    'APPOINTMENT_KEEPER',
    'VITAL_TRACKER',
    'EXERCISE_CHAMPION',
    'MEDICATION_MASTER',
    'HEALTH_IMPROVEMENT',
    'GOAL_ACHIEVER'
);


--
-- Name: GameChallengeType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GameChallengeType" AS ENUM (
    'DAILY_MEDICATION',
    'WEEKLY_VITALS',
    'MONTHLY_CHECKUP',
    'EXERCISE_MINUTES',
    'WEIGHT_MANAGEMENT',
    'BLOOD_PRESSURE_CONTROL',
    'GLUCOSE_MANAGEMENT'
);


--
-- Name: LabOrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LabOrderStatus" AS ENUM (
    'ORDERED',
    'SAMPLE_COLLECTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'REPORT_READY'
);


--
-- Name: LabTestCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LabTestCategory" AS ENUM (
    'BLOOD_CHEMISTRY',
    'HEMATOLOGY',
    'MICROBIOLOGY',
    'PATHOLOGY',
    'RADIOLOGY',
    'CARDIOLOGY',
    'ENDOCRINOLOGY',
    'IMMUNOLOGY'
);


--
-- Name: MedicationAlertType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MedicationAlertType" AS ENUM (
    'DRUG_INTERACTION',
    'ALLERGY_CONFLICT',
    'DOSE_LIMIT_EXCEEDED',
    'DUPLICATE_THERAPY',
    'AGE_INAPPROPRIATE',
    'CONTRAINDICATION',
    'MONITORING_REQUIRED'
);


--
-- Name: VitalConditionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VitalConditionType" AS ENUM (
    'GREATER_THAN',
    'LESS_THAN',
    'BETWEEN',
    'OUTSIDE_RANGE',
    'PERCENTAGE_CHANGE'
);


--
-- Name: enum_adherence_records_adherence_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_adherence_records_adherence_type AS ENUM (
    'MEDICATION',
    'APPOINTMENT',
    'VITAL_CHECK',
    'SYMPTOM_LOG',
    'DIET_LOG',
    'EXERCISE',
    'REMINDER'
);


--
-- Name: enum_appointment_slots_slot_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_appointment_slots_slot_type AS ENUM (
    'regular',
    'emergency',
    'consultation',
    'follow_up'
);


--
-- Name: enum_appointments_organizer_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_appointments_organizer_type AS ENUM (
    'doctor',
    'patient',
    'care_taker',
    'hsp',
    'provider',
    'admin'
);


--
-- Name: enum_appointments_participant_one_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_appointments_participant_one_type AS ENUM (
    'doctor',
    'patient',
    'hsp'
);


--
-- Name: enum_appointments_participant_two_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_appointments_participant_two_type AS ENUM (
    'doctor',
    'patient',
    'hsp'
);


--
-- Name: enum_dashboard_metrics_entity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_dashboard_metrics_entity_type AS ENUM (
    'patient',
    'doctor',
    'organization',
    'system'
);


--
-- Name: enum_medication_logs_adherence_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_medication_logs_adherence_status AS ENUM (
    'taken',
    'missed',
    'late',
    'partial'
);


--
-- Name: enum_medications_organizer_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_medications_organizer_type AS ENUM (
    'doctor',
    'patient',
    'care_taker',
    'hsp',
    'provider',
    'admin'
);


--
-- Name: enum_patient_alerts_alert_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_alerts_alert_type AS ENUM (
    'medication',
    'vital',
    'appointment',
    'symptom',
    'system'
);


--
-- Name: enum_patient_alerts_severity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_alerts_severity AS ENUM (
    'critical',
    'high',
    'medium',
    'low'
);


--
-- Name: enum_patient_consent_otp_otp_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_consent_otp_otp_method AS ENUM (
    'sms',
    'email',
    'both'
);


--
-- Name: enum_patient_provider_consent_history_consent_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_provider_consent_history_consent_method AS ENUM (
    'sms',
    'email',
    'in_person',
    'phone',
    'automatic'
);


--
-- Name: enum_patient_provider_consent_history_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_provider_consent_history_status AS ENUM (
    'pending',
    'consent_requested',
    'approved',
    'denied',
    'expired',
    'completed'
);


--
-- Name: enum_patient_subscriptions_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patient_subscriptions_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
    'TRIALING'
);


--
-- Name: enum_patients_provider_consent_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_patients_provider_consent_method AS ENUM (
    'sms',
    'email',
    'in_person',
    'phone',
    'automatic'
);


--
-- Name: enum_payment_methods_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_payment_methods_type AS ENUM (
    'card',
    'bank_account',
    'paypal'
);


--
-- Name: enum_payments_payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_payments_payment_method AS ENUM (
    'card',
    'bank_account',
    'paypal',
    'apple_pay',
    'google_pay'
);


--
-- Name: enum_payments_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_payments_status AS ENUM (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'cancelled',
    'refunded'
);


--
-- Name: enum_provider_change_history_practitioner_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_provider_change_history_practitioner_type AS ENUM (
    'doctor',
    'hsp'
);


--
-- Name: enum_provider_change_history_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_provider_change_history_status AS ENUM (
    'active',
    'processing',
    'completed'
);


--
-- Name: enum_schedule_events_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_schedule_events_event_type AS ENUM (
    'appointment',
    'reminder',
    'medication-reminder',
    'vitals',
    'careplan-activation',
    'diet',
    'workout'
);


--
-- Name: enum_schedule_events_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_schedule_events_status AS ENUM (
    'scheduled',
    'pending',
    'completed',
    'expired',
    'cancelled',
    'started',
    'prior'
);


--
-- Name: enum_scheduled_events_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_scheduled_events_event_type AS ENUM (
    'MEDICATION',
    'APPOINTMENT',
    'VITAL_CHECK',
    'SYMPTOM_LOG',
    'DIET_LOG',
    'EXERCISE',
    'REMINDER'
);


--
-- Name: enum_scheduled_events_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_scheduled_events_priority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: enum_scheduled_events_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_scheduled_events_status AS ENUM (
    'SCHEDULED',
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'MISSED',
    'CANCELLED',
    'EXPIRED'
);


--
-- Name: enum_secondary_doctor_assignments_consent_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_secondary_doctor_assignments_consent_status AS ENUM (
    'pending',
    'requested',
    'granted',
    'denied',
    'expired'
);


--
-- Name: enum_service_plans_billing_cycle; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_service_plans_billing_cycle AS ENUM (
    'monthly',
    'yearly',
    'one-time',
    'weekly'
);


--
-- Name: enum_user_roles_linked_with; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_user_roles_linked_with AS ENUM (
    'doctor',
    'patient',
    'care_taker',
    'hsp',
    'provider',
    'admin'
);


--
-- Name: enum_users_account_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_account_status AS ENUM (
    'PENDING_VERIFICATION',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'DEACTIVATED'
);


--
-- Name: enum_users_gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_gender AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER',
    'PREFER_NOT_TO_SAY'
);


--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_role AS ENUM (
    'SYSTEM_ADMIN',
    'HOSPITAL_ADMIN',
    'DOCTOR',
    'HSP',
    'PATIENT',
    'CAREGIVER'
);


--
-- Name: enum_vital_readings_alert_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_vital_readings_alert_level AS ENUM (
    'normal',
    'warning',
    'critical',
    'emergency'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: adherence_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adherence_records (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    scheduled_event_id uuid,
    adherence_type public.enum_adherence_records_adherence_type NOT NULL,
    due_at timestamp(6) with time zone NOT NULL,
    recordedAt timestamp(6) with time zone,
    is_completed boolean DEFAULT false,
    is_partial boolean DEFAULT false,
    is_missed boolean DEFAULT false,
    response_data jsonb DEFAULT '{}'::jsonb,
    notes text,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: appointment_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_slots (
    id uuid NOT NULL,
    doctorId uuid NOT NULL,
    date date NOT NULL,
    start_time time(6) without time zone NOT NULL,
    end_time time(6) without time zone NOT NULL,
    max_appointments integer DEFAULT 1,
    booked_appointments integer DEFAULT 0,
    is_available boolean DEFAULT true,
    slot_type public.enum_appointment_slots_slot_type DEFAULT 'regular'::public.enum_appointment_slots_slot_type,
    notes text,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid NOT NULL,
    participant_one_type public.enum_appointments_participant_one_type,
    participant_one_id uuid,
    participant_two_type public.enum_appointments_participant_two_type,
    participant_two_id uuid,
    organizer_type public.enum_appointments_organizer_type,
    organizer_id uuid,
    provider_id uuid,
    provider_name character varying(100),
    description character varying(1000),
    start_date date,
    end_date date,
    start_time timestamp(6) with time zone,
    end_time timestamp(6) with time zone,
    rr_rule character varying(1000),
    details json,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone,
    doctorId uuid,
    patientId uuid,
    slot_id uuid
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    userId uuid,
    user_role character varying(50),
    organization_id uuid,
    action character varying(10) NOT NULL,
    resource character varying(500) NOT NULL,
    patientId uuid,
    phi_accessed boolean DEFAULT false,
    accessGranted boolean NOT NULL,
    denial_reason text,
    ip_address inet,
    user_agent text,
    session_id character varying(255),
    request_id uuid,
    data_changes jsonb,
    encrypted_data jsonb,
    risk_level character varying(10) DEFAULT 'low'::character varying,
    security_alerts jsonb DEFAULT '[]'::jsonb,
    retention_date timestamp(6) with time zone,
    "timestamp" timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone
);


--
-- Name: care_plan_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_plan_templates (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    conditions text[] DEFAULT ARRAY[]::text[],
    specialties text[] DEFAULT ARRAY[]::text[],
    tags text[] DEFAULT ARRAY[]::text[],
    template_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid NOT NULL,
    organization_id uuid,
    is_public boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    approved_by uuid,
    version character varying(20) DEFAULT '1.0'::character varying,
    parent_template_id uuid,
    usage_count integer DEFAULT 0,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: care_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_plans (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    created_by_doctor_id uuid,
    created_by_hsp_id uuid,
    organization_id uuid,
    title character varying(255) NOT NULL,
    description text,
    plan_type character varying(20) DEFAULT 'care_plan'::character varying,
    chronic_conditions text[] DEFAULT ARRAY[]::text[],
    condition_severity jsonb DEFAULT '{}'::jsonb,
    risk_factors jsonb DEFAULT '[]'::jsonb,
    long_term_goals jsonb DEFAULT '[]'::jsonb,
    short_term_milestones jsonb DEFAULT '[]'::jsonb,
    interventions jsonb DEFAULT '[]'::jsonb,
    lifestyle_modifications jsonb DEFAULT '[]'::jsonb,
    monitoring_parameters jsonb DEFAULT '[]'::jsonb,
    monitoring_frequency jsonb DEFAULT '{}'::jsonb,
    target_values jsonb DEFAULT '{}'::jsonb,
    medications jsonb DEFAULT '[]'::jsonb,
    medication_management jsonb DEFAULT '{}'::jsonb,
    start_date timestamp(6) with time zone NOT NULL,
    end_date timestamp(6) with time zone,
    review_frequency_months integer DEFAULT 3,
    next_review_date timestamp(6) with time zone,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying,
    primary_care_manager_id uuid,
    care_team_members jsonb DEFAULT '[]'::jsonb,
    specialist_referrals jsonb DEFAULT '[]'::jsonb,
    patient_education_materials jsonb DEFAULT '[]'::jsonb,
    self_management_tasks jsonb DEFAULT '[]'::jsonb,
    patient_goals jsonb DEFAULT '[]'::jsonb,
    progress_notes jsonb DEFAULT '[]'::jsonb,
    outcome_measures jsonb DEFAULT '{}'::jsonb,
    quality_of_life_scores jsonb DEFAULT '{}'::jsonb,
    emergency_action_plan jsonb DEFAULT '{}'::jsonb,
    warning_signs text[] DEFAULT ARRAY[]::text[],
    emergency_contacts jsonb DEFAULT '[]'::jsonb,
    details jsonb,
    channel_id character varying(255),
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: clinics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinics (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    doctorId uuid NOT NULL,
    organization_id uuid,
    address jsonb DEFAULT '{}'::jsonb NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    location_verified boolean DEFAULT false,
    location_accuracy character varying(20),
    phone character varying(20),
    email character varying(255),
    website character varying(500),
    operating_hours jsonb DEFAULT '{}'::jsonb NOT NULL,
    services_offered text[] DEFAULT ARRAY[]::text[],
    clinic_images jsonb DEFAULT '[]'::jsonb,
    banner_image text,
    description text,
    consultation_fee numeric(10,2),
    is_primary boolean DEFAULT false NOT NULL,
    isActive boolean DEFAULT true NOT NULL,
    registration_number character varying(100),
    established_year integer,
    facilities jsonb DEFAULT '[]'::jsonb,
    insurance_accepted text[] DEFAULT ARRAY[]::text[],
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: consultation_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultation_notes (
    id uuid NOT NULL,
    consultation_id uuid NOT NULL,
    note_type character varying(50) NOT NULL,
    content text NOT NULL,
    "timestamp" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid NOT NULL
);


--
-- Name: consultation_prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultation_prescriptions (
    id uuid NOT NULL,
    consultation_id uuid NOT NULL,
    medication_name character varying(255) NOT NULL,
    dosage character varying(100) NOT NULL,
    frequency character varying(100) NOT NULL,
    duration_days integer NOT NULL,
    quantity integer,
    instructions text,
    refills_allowed integer DEFAULT 0 NOT NULL,
    ndc_code character varying(50),
    generic_substitution boolean DEFAULT true NOT NULL,
    pharmacy_instructions text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: dashboard_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_metrics (
    id uuid NOT NULL,
    entity_type public.enum_dashboard_metrics_entity_type NOT NULL,
    entity_id uuid NOT NULL,
    metric_type character varying(100) NOT NULL,
    metric_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    calculated_at timestamp(6) with time zone NOT NULL,
    valid_until timestamp(6) with time zone,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone
);


--
-- Name: doctor_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_availability (
    id uuid NOT NULL,
    doctorId uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time(6) without time zone NOT NULL,
    end_time time(6) without time zone NOT NULL,
    is_available boolean DEFAULT true,
    slot_duration integer DEFAULT 30,
    max_appointments_per_slot integer DEFAULT 1,
    break_start_time time(6) without time zone,
    break_end_time time(6) without time zone,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctors (
    id uuid NOT NULL,
    userId uuid NOT NULL,
    doctorId character varying(50) NOT NULL,
    organization_id uuid,
    medical_license_number character varying(100) NOT NULL,
    npi_number character varying(20),
    board_certifications text[] DEFAULT ARRAY[]::text[],
    medical_school character varying(255),
    residency_programs jsonb DEFAULT '[]'::jsonb,
    specialties text[] DEFAULT ARRAY[]::text[],
    sub_specialties text[] DEFAULT ARRAY[]::text[],
    years_of_experience integer,
    capabilities text[] DEFAULT ARRAY['prescribe_medications'::text, 'order_tests'::text, 'diagnose'::text, 'create_treatment_plans'::text, 'create_care_plans'::text, 'modify_medications'::text, 'monitor_vitals'::text, 'patient_education'::text, 'care_coordination'::text, 'emergency_response'::text],
    is_verified boolean DEFAULT false,
    verification_documents jsonb DEFAULT '[]'::jsonb,
    verification_date timestamp(6) with time zone,
    verified_by uuid,
    consultation_fee numeric(10,2),
    availability_schedule jsonb DEFAULT '{"friday": {"end": "17:00", "start": "09:00", "available": true}, "monday": {"end": "17:00", "start": "09:00", "available": true}, "sunday": {"available": false}, "tuesday": {"end": "17:00", "start": "09:00", "available": true}, "saturday": {"available": false}, "thursday": {"end": "17:00", "start": "09:00", "available": true}, "wednesday": {"end": "17:00", "start": "09:00", "available": true}}'::jsonb,
    languages_spoken text[] DEFAULT ARRAY['en'::text],
    notification_preferences jsonb DEFAULT '{"patient_updates": true, "emergency_alerts": true, "peer_consultations": true, "system_notifications": true, "appointment_reminders": true}'::jsonb,
    practice_name character varying(255),
    practice_address jsonb DEFAULT '{}'::jsonb,
    practice_phone character varying(20),
    signature_pic text,
    razorpay_account_id character varying(255),
    total_patients integer DEFAULT 0,
    active_treatment_plans integer DEFAULT 0,
    active_care_plans integer DEFAULT 0,
    average_rating numeric(3,2),
    total_reviews integer DEFAULT 0,
    is_available_online boolean DEFAULT true,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone,
    speciality_id integer,
    profile_picture_url text,
    banner_image_url text,
    qualification_details jsonb DEFAULT '[]'::jsonb,
    registration_details jsonb DEFAULT '{}'::jsonb,
    subscription_details jsonb DEFAULT '{}'::jsonb,
    signature_image_url text,
    signature_data text,
    gender character varying(20),
    mobile_number character varying(20)
);


--
-- Name: drug_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drug_interactions (
    id uuid NOT NULL,
    rxcui_one character varying(50) NOT NULL,
    rxcui_two character varying(50) NOT NULL,
    drug_name_one character varying(255) NOT NULL,
    drug_name_two character varying(255) NOT NULL,
    severity_level public."DrugInteractionSeverity" NOT NULL,
    interaction_type character varying(100) NOT NULL,
    description text NOT NULL,
    clinical_effect text NOT NULL,
    management_advice text NOT NULL,
    evidence_level character varying(10) NOT NULL,
    source character varying(50) DEFAULT 'RxNorm'::character varying NOT NULL,
    last_updated timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: emergency_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_alerts (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    alert_type public."EmergencyAlertType" NOT NULL,
    priority_level public."EmergencyPriority" NOT NULL,
    vital_reading_id uuid,
    triggered_by_rule character varying(255),
    alert_title character varying(255) NOT NULL,
    alert_message text NOT NULL,
    clinical_context text,
    acknowledged boolean DEFAULT false NOT NULL,
    acknowledged_by uuid,
    acknowledged_at timestamp(6) with time zone,
    resolved boolean DEFAULT false NOT NULL,
    resolved_by uuid,
    resolved_at timestamp(6) with time zone,
    resolution_notes text,
    notifications_sent jsonb DEFAULT '[]'::jsonb NOT NULL,
    escalation_level integer DEFAULT 0 NOT NULL,
    max_escalations integer DEFAULT 3 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: emergency_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_contacts (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    name character varying(255) NOT NULL,
    relationship character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    address jsonb,
    priority_order integer DEFAULT 1 NOT NULL,
    can_receive_medical boolean DEFAULT false NOT NULL,
    preferred_contact character varying(20) DEFAULT 'phone'::character varying NOT NULL,
    isActive boolean DEFAULT true NOT NULL,
    hipaa_authorized boolean DEFAULT false NOT NULL,
    authorization_date timestamp(6) with time zone,
    authorization_expires timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: game_badge_awards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_badge_awards (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    badge_type public."GameBadgeType" NOT NULL,
    badge_name character varying(255) NOT NULL,
    badge_description text,
    points_awarded integer DEFAULT 0 NOT NULL,
    awarded_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    badge_icon character varying(255),
    badge_color character varying(50),
    achievement_data jsonb DEFAULT '{}'::jsonb
);


--
-- Name: game_challenge_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_challenge_progress (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    challenge_type public."GameChallengeType" NOT NULL,
    challenge_name character varying(255) NOT NULL,
    target_value integer NOT NULL,
    current_progress integer DEFAULT 0 NOT NULL,
    start_date timestamp(6) with time zone NOT NULL,
    end_date timestamp(6) with time zone NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    completion_date timestamp(6) with time zone,
    points_earned integer DEFAULT 0 NOT NULL,
    challenge_rules jsonb DEFAULT '{}'::jsonb,
    progress_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: healthcare_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.healthcare_providers (
    id uuid NOT NULL,
    userId uuid NOT NULL,
    organization_id uuid,
    license_number character varying(100),
    specialties text[] DEFAULT ARRAY[]::text[],
    sub_specialties text[] DEFAULT ARRAY[]::text[],
    qualifications jsonb DEFAULT '[]'::jsonb,
    years_of_experience integer,
    is_verified boolean DEFAULT false,
    verification_documents jsonb DEFAULT '[]'::jsonb,
    verification_date timestamp(6) with time zone,
    verified_by uuid,
    consultation_fee numeric(10,2),
    availability_schedule jsonb DEFAULT '{"friday": {"end": "17:00", "start": "09:00", "available": true}, "monday": {"end": "17:00", "start": "09:00", "available": true}, "sunday": {"available": false}, "tuesday": {"end": "17:00", "start": "09:00", "available": true}, "saturday": {"available": false}, "thursday": {"end": "17:00", "start": "09:00", "available": true}, "wednesday": {"end": "17:00", "start": "09:00", "available": true}}'::jsonb,
    notification_preferences jsonb DEFAULT '{"patient_updates": true, "marketing_emails": false, "sms_notifications": true, "push_notifications": true, "system_notifications": true, "appointment_reminders": true}'::jsonb,
    practice_name character varying(255),
    practice_address jsonb DEFAULT '{}'::jsonb,
    practice_phone character varying(20),
    practice_website character varying(255),
    total_patients integer DEFAULT 0,
    active_care_plans integer DEFAULT 0,
    average_rating numeric(3,2),
    total_reviews integer DEFAULT 0,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: hsps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hsps (
    id uuid NOT NULL,
    userId uuid NOT NULL,
    hsp_id character varying(50) NOT NULL,
    organization_id uuid,
    hsp_type character varying(50) NOT NULL,
    license_number character varying(100),
    certification_number character varying(100),
    certifications text[] DEFAULT ARRAY[]::text[],
    education jsonb DEFAULT '[]'::jsonb,
    specializations text[] DEFAULT ARRAY[]::text[],
    years_of_experience integer,
    capabilities text[] DEFAULT ARRAY['monitor_vitals'::text, 'patient_education'::text, 'care_coordination'::text],
    requires_supervision boolean DEFAULT true,
    supervising_doctor_id uuid,
    supervision_level character varying(20) DEFAULT 'direct'::character varying,
    is_verified boolean DEFAULT false,
    verification_documents jsonb DEFAULT '[]'::jsonb,
    verification_date timestamp(6) with time zone,
    verified_by uuid,
    hourly_rate numeric(8,2),
    availability_schedule jsonb DEFAULT '{"friday": {"end": "18:00", "start": "08:00", "available": true}, "monday": {"end": "18:00", "start": "08:00", "available": true}, "sunday": {"available": false}, "tuesday": {"end": "18:00", "start": "08:00", "available": true}, "saturday": {"available": false}, "thursday": {"end": "18:00", "start": "08:00", "available": true}, "wednesday": {"end": "18:00", "start": "08:00", "available": true}}'::jsonb,
    languages_spoken text[] DEFAULT ARRAY['en'::text],
    notification_preferences jsonb DEFAULT '{"patient_updates": true, "shift_reminders": true, "emergency_alerts": true, "system_notifications": true}'::jsonb,
    departments text[] DEFAULT ARRAY[]::text[],
    shift_preferences jsonb DEFAULT '{"preferred_shifts": ["day"], "weekend_availability": false, "night_shift_available": false}'::jsonb,
    total_patients_assisted integer DEFAULT 0,
    active_care_plans integer DEFAULT 0,
    tasks_completed integer DEFAULT 0,
    average_rating numeric(3,2),
    total_reviews integer DEFAULT 0,
    is_available boolean DEFAULT true,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: lab_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_orders (
    id uuid NOT NULL,
    order_number character varying(100) NOT NULL,
    patientId uuid NOT NULL,
    doctorId uuid NOT NULL,
    consultation_id uuid,
    order_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    priority character varying(50) DEFAULT 'routine'::character varying NOT NULL,
    status public."LabOrderStatus" DEFAULT 'ORDERED'::public."LabOrderStatus" NOT NULL,
    category public."LabTestCategory" DEFAULT 'BLOOD_CHEMISTRY'::public."LabTestCategory" NOT NULL,
    ordered_tests jsonb DEFAULT '[]'::jsonb NOT NULL,
    clinical_indication text,
    special_instructions text,
    lab_facility_name character varying(255),
    lab_facility_code character varying(100),
    collection_date timestamp(6) with time zone,
    expected_result_date timestamp(6) with time zone,
    results_available boolean DEFAULT false NOT NULL,
    results_data jsonb DEFAULT '{}'::jsonb,
    results_pdf_url text,
    critical_values boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: lab_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_results (
    id uuid NOT NULL,
    lab_order_id uuid NOT NULL,
    test_name character varying(255) NOT NULL,
    test_code character varying(50),
    result_value character varying(255),
    numeric_value numeric(10,3),
    result_unit character varying(50),
    reference_range character varying(255),
    result_status character varying(50) DEFAULT 'final'::character varying NOT NULL,
    abnormal_flag character varying(10),
    critical_flag boolean DEFAULT false NOT NULL,
    collection_date timestamp(6) with time zone,
    result_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    verified_date timestamp(6) with time zone,
    method character varying(255),
    specimen_type character varying(100),
    comments text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: medication_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medication_logs (
    id uuid NOT NULL,
    medication_id uuid NOT NULL,
    patientId uuid NOT NULL,
    scheduled_at timestamp(6) with time zone NOT NULL,
    taken_at timestamp(6) with time zone,
    dosage_taken character varying(100),
    notes text,
    adherence_status public.enum_medication_logs_adherence_status DEFAULT 'missed'::public.enum_medication_logs_adherence_status,
    reminder_sent boolean DEFAULT false,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone
);


--
-- Name: medication_safety_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medication_safety_alerts (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    medication_id uuid,
    drug_interaction_id uuid,
    patient_allergy_id uuid,
    alert_type public."MedicationAlertType" NOT NULL,
    severity public."AlertSeverity" NOT NULL,
    alert_title character varying(255) NOT NULL,
    alert_message text NOT NULL,
    recommendation text,
    requires_override boolean DEFAULT false NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    resolved_by uuid,
    resolved_at timestamp(6) with time zone,
    resolution_notes text,
    override_reason text,
    created_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: medications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medications (
    id uuid NOT NULL,
    participant_id uuid NOT NULL,
    organizer_type public.enum_medications_organizer_type,
    organizer_id uuid NOT NULL,
    medicine_id uuid NOT NULL,
    description character varying(1000),
    start_date timestamp(6) with time zone,
    end_date timestamp(6) with time zone,
    rr_rule character varying(1000),
    details json,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone,
    care_plan_id uuid
);


--
-- Name: medicines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicines (
    id uuid NOT NULL,
    name character varying(1000) NOT NULL,
    type character varying(1000) DEFAULT 'tablet'::character varying,
    description character varying(1000),
    details json,
    creator_id integer,
    public_medicine boolean DEFAULT true,
    algolia_object_id character varying(255),
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    patientId uuid,
    doctorId uuid,
    hsp_id uuid,
    organization_id uuid,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying,
    is_urgent boolean DEFAULT false,
    channels character varying(255)[] DEFAULT ARRAY['PUSH'::character varying(255)],
    scheduled_for timestamp(6) with time zone,
    expires_at timestamp(6) with time zone,
    status character varying(20) DEFAULT 'pending'::character varying,
    sent_at timestamp(6) with time zone,
    delivered_at timestamp(6) with time zone,
    delivery_attempts integer DEFAULT 0,
    delivery_log jsonb DEFAULT '[]'::jsonb,
    read_at timestamp(6) with time zone,
    acknowledged_at timestamp(6) with time zone,
    related_appointment_id uuid,
    related_medication_id uuid,
    related_care_plan_id uuid,
    related_treatment_plan_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    requires_action boolean DEFAULT false,
    action_url character varying(500),
    action_taken boolean DEFAULT false,
    action_taken_at timestamp(6) with time zone,
    template_id character varying(100),
    personalization_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone,
    recipient_id uuid
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) DEFAULT 'clinic'::character varying,
    license_number character varying(100),
    contact_info jsonb DEFAULT '{}'::jsonb,
    address jsonb DEFAULT '{}'::jsonb,
    settings jsonb DEFAULT '{"timezone": "UTC", "working_hours": {"friday": {"end": "17:00", "start": "09:00"}, "monday": {"end": "17:00", "start": "09:00"}, "sunday": {"closed": true}, "tuesday": {"end": "17:00", "start": "09:00"}, "saturday": {"end": "13:00", "start": "09:00"}, "thursday": {"end": "17:00", "start": "09:00"}, "wednesday": {"end": "17:00", "start": "09:00"}}, "notification_preferences": {"sms_enabled": false, "push_enabled": true, "email_enabled": true}}'::jsonb,
    isActive boolean DEFAULT true,
    hipaa_covered_entity boolean DEFAULT true,
    business_associate_agreement jsonb,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: patient_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_alerts (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    alert_type public.enum_patient_alerts_alert_type NOT NULL,
    severity public.enum_patient_alerts_severity DEFAULT 'medium'::public.enum_patient_alerts_severity,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    action_required boolean DEFAULT false,
    acknowledged boolean DEFAULT false,
    acknowledged_at timestamp(6) with time zone,
    acknowledged_by uuid,
    resolved boolean DEFAULT false,
    resolved_at timestamp(6) with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone
);


--
-- Name: patient_allergies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_allergies (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    allergen_type public."AllergenType" NOT NULL,
    allergen_name character varying(255) NOT NULL,
    allergen_rxnorm character varying(50),
    reaction_severity public."AllergySeverity" NOT NULL,
    reaction_symptoms text,
    onset_date date,
    verified_by_doctor boolean DEFAULT false NOT NULL,
    verified_by uuid,
    notes text,
    isActive boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: patient_consent_otp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_consent_otp (
    id uuid NOT NULL,
    secondary_assignment_id uuid NOT NULL,
    patientId uuid NOT NULL,
    primary_doctor_id uuid NOT NULL,
    secondary_doctor_id uuid,
    secondary_hsp_id uuid,
    otp_code character varying(10) NOT NULL,
    otp_method public.enum_patient_consent_otp_otp_method DEFAULT 'both'::public.enum_patient_consent_otp_otp_method,
    patient_phone character varying(20),
    patient_email character varying(255),
    generated_at timestamp(6) with time zone,
    expires_at timestamp(6) with time zone NOT NULL,
    attempts_count integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    is_verified boolean DEFAULT false,
    verified_at timestamp(6) with time zone,
    is_expired boolean DEFAULT false,
    is_blocked boolean DEFAULT false,
    blocked_at timestamp(6) with time zone,
    requested_by_user_id uuid NOT NULL,
    request_ip_address inet,
    request_user_agent text,
    sms_sent boolean DEFAULT false,
    sms_sent_at timestamp(6) with time zone,
    sms_error text,
    email_sent boolean DEFAULT false,
    email_sent_at timestamp(6) with time zone,
    email_error text,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: patient_doctor_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_doctor_assignments (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    doctorId uuid NOT NULL,
    assignment_type character varying(50) NOT NULL,
    permissions jsonb DEFAULT '{"can_prescribe": false, "can_order_tests": false, "can_view_patient": true, "can_create_care_plans": false, "can_modify_care_plans": false, "can_access_full_history": false}'::jsonb,
    specialtyFocus text[] DEFAULT ARRAY[]::text[],
    care_plan_ids uuid[] DEFAULT ARRAY[]::uuid[],
    assigned_by_doctor_id uuid,
    assigned_by_admin_id uuid,
    patient_consent_required boolean DEFAULT false,
    patient_consent_status character varying(20) DEFAULT 'not_required'::character varying,
    consent_method character varying(20),
    consent_otp character varying(10),
    consent_otp_expires_at timestamp(6) with time zone,
    consent_granted_at timestamp(6) with time zone,
    assignment_start_date timestamp(6) with time zone,
    assignment_end_date timestamp(6) with time zone,
    isActive boolean DEFAULT true,
    assignment_reason text,
    notes text,
    requires_same_organization boolean DEFAULT false,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: patient_game_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_game_profiles (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    current_level integer DEFAULT 1 NOT NULL,
    experience_points integer DEFAULT 0 NOT NULL,
    medication_streak integer DEFAULT 0 NOT NULL,
    appointment_streak integer DEFAULT 0 NOT NULL,
    vitals_streak integer DEFAULT 0 NOT NULL,
    longest_streak integer DEFAULT 0 NOT NULL,
    badges_earned text[] DEFAULT ARRAY[]::text[],
    challenges_completed text[] DEFAULT ARRAY[]::text[],
    login_streak integer DEFAULT 0 NOT NULL,
    last_activity timestamp(6) with time zone,
    total_activities integer DEFAULT 0 NOT NULL,
    gamification_enabled boolean DEFAULT true NOT NULL,
    notifications_enabled boolean DEFAULT true NOT NULL,
    public_profile boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: patient_provider_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_provider_assignments (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    provider_id uuid NOT NULL,
    role character varying(50) DEFAULT 'primary'::character varying,
    assigned_at timestamp(6) with time zone,
    assigned_by uuid,
    ended_at timestamp(6) with time zone,
    notes text
);


--
-- Name: patient_provider_consent_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_provider_consent_history (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    previous_provider_id uuid,
    new_provider_id uuid NOT NULL,
    doctorId uuid,
    hsp_id uuid,
    consent_required boolean DEFAULT false,
    consent_requested boolean DEFAULT false,
    consent_requested_at timestamp(6) with time zone,
    consent_given boolean DEFAULT false,
    consent_given_at timestamp(6) with time zone,
    consent_method public.enum_patient_provider_consent_history_consent_method,
    consent_token character varying(100),
    consent_token_expires_at timestamp(6) with time zone,
    consent_verified boolean DEFAULT false,
    consent_denied boolean DEFAULT false,
    consent_denied_at timestamp(6) with time zone,
    reason text,
    initiated_by uuid,
    status public.enum_patient_provider_consent_history_status DEFAULT 'pending'::public.enum_patient_provider_consent_history_status,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone
);


--
-- Name: patient_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_subscriptions (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    provider_id uuid NOT NULL,
    service_plan_id uuid NOT NULL,
    status public.enum_patient_subscriptions_status DEFAULT 'ACTIVE'::public.enum_patient_subscriptions_status,
    current_period_start date NOT NULL,
    current_period_end date NOT NULL,
    next_billing_date date,
    trial_start date,
    trial_end date,
    payment_method_id character varying(255),
    stripe_subscription_id character varying(255),
    stripe_customer_id character varying(255),
    last_payment_date timestamp(6) with time zone,
    last_payment_amount numeric(10,2),
    failure_count integer DEFAULT 0,
    metadata json DEFAULT '{}'::json,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    cancelled_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid NOT NULL,
    userId uuid NOT NULL,
    organization_id uuid,
    medical_record_number character varying(50),
    patientId character varying(100),
    emergency_contacts jsonb DEFAULT '[]'::jsonb,
    insurance_information jsonb DEFAULT '{}'::jsonb,
    medical_history jsonb DEFAULT '[]'::jsonb,
    allergies jsonb DEFAULT '[]'::jsonb,
    current_medications jsonb DEFAULT '[]'::jsonb,
    height_cm numeric(5,2),
    weight_kg numeric(5,2),
    blood_type character varying(5),
    primary_language character varying(10) DEFAULT 'en'::character varying,
    risk_level character varying(20) DEFAULT 'low'::character varying,
    risk_factors jsonb DEFAULT '[]'::jsonb,
    communication_preferences jsonb DEFAULT '{"language": "en", "time_zone": "UTC", "health_tips": false, "medication_reminders": true, "appointment_reminders": true, "research_participation": false, "preferred_contact_method": "email"}'::jsonb,
    privacy_settings jsonb DEFAULT '{"share_with_family": false, "share_for_research": false, "data_sharing_consent": false, "marketing_communications": false, "provider_directory_listing": true}'::jsonb,
    primaryCareDoctorId uuid,
    primary_care_hsp_id uuid,
    care_coordinator_id uuid,
    care_coordinator_type character varying(10),
    overallAdherenceScore numeric(5,2),
    last_adherence_calculation timestamp(6) with time zone,
    total_appointments integer DEFAULT 0,
    missed_appointments integer DEFAULT 0,
    last_visit_date timestamp(6) with time zone,
    next_appointment_date timestamp(6) with time zone,
    isActive boolean DEFAULT true,
    requires_interpreter boolean DEFAULT false,
    has_mobility_issues boolean DEFAULT false,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone,
    linked_provider_id uuid,
    provider_linked_at timestamp(6) with time zone,
    provider_consent_given boolean DEFAULT false,
    provider_consent_given_at timestamp(6) with time zone,
    provider_consent_method public.enum_patients_provider_consent_method
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    stripe_payment_method_id character varying(255) NOT NULL,
    type public.enum_payment_methods_type NOT NULL,
    card_brand character varying(50),
    card_last4 character varying(4),
    card_exp_month integer,
    card_exp_year integer,
    bank_name character varying(100),
    bank_last4 character varying(4),
    is_default boolean DEFAULT false,
    isActive boolean DEFAULT true,
    billing_address json,
    metadata json DEFAULT '{}'::json,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    subscription_id uuid NOT NULL,
    patientId uuid NOT NULL,
    provider_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    status public.enum_payments_status DEFAULT 'pending'::public.enum_payments_status,
    payment_method public.enum_payments_payment_method NOT NULL,
    stripe_payment_intent_id character varying(255),
    stripe_charge_id character varying(255),
    failure_code character varying(100),
    failure_message text,
    refund_amount numeric(10,2) DEFAULT 0,
    refund_reason character varying(255),
    invoice_id character varying(255),
    billing_period_start date,
    billing_period_end date,
    metadata json DEFAULT '{}'::json,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    processed_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: provider_change_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_change_history (
    id uuid NOT NULL,
    practitioner_type public.enum_provider_change_history_practitioner_type NOT NULL,
    practitioner_id uuid NOT NULL,
    previous_provider_id uuid,
    new_provider_id uuid NOT NULL,
    change_date timestamp(6) with time zone NOT NULL,
    affected_patients_count integer DEFAULT 0,
    consent_required_count integer DEFAULT 0,
    consent_obtained_count integer DEFAULT 0,
    reason text,
    status public.enum_provider_change_history_status DEFAULT 'active'::public.enum_provider_change_history_status,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone
);


--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id uuid NOT NULL,
    userId uuid NOT NULL,
    name character varying(100) NOT NULL,
    address character varying(255),
    city character varying(255),
    state character varying(255),
    activated_on timestamp(6) with time zone,
    details json,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: schedule_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_events (
    id uuid NOT NULL,
    critical boolean,
    event_type public.enum_schedule_events_event_type,
    event_id uuid,
    details json,
    status public.enum_schedule_events_status DEFAULT 'pending'::public.enum_schedule_events_status NOT NULL,
    date date,
    start_time timestamp(6) with time zone,
    end_time timestamp(6) with time zone,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: scheduled_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_events (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    care_plan_id uuid,
    event_type public.enum_scheduled_events_event_type NOT NULL,
    event_id uuid,
    title character varying(255) NOT NULL,
    description text,
    scheduled_for timestamp(6) with time zone NOT NULL,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    status public.enum_scheduled_events_status DEFAULT 'SCHEDULED'::public.enum_scheduled_events_status,
    priority public.enum_scheduled_events_priority DEFAULT 'MEDIUM'::public.enum_scheduled_events_priority,
    event_data jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp(6) with time zone,
    completed_by uuid,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: secondary_doctor_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.secondary_doctor_assignments (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    primary_doctor_id uuid NOT NULL,
    secondary_doctor_id uuid,
    secondary_hsp_id uuid,
    assignment_reason text,
    specialtyFocus text[] DEFAULT ARRAY[]::text[],
    care_plan_ids uuid[] DEFAULT ARRAY[]::uuid[],
    primary_doctor_provider_id uuid,
    secondary_doctor_provider_id uuid,
    consent_required boolean DEFAULT true,
    consent_status public.enum_secondary_doctor_assignments_consent_status DEFAULT 'pending'::public.enum_secondary_doctor_assignments_consent_status,
    accessGranted boolean DEFAULT false,
    first_access_attempt_at timestamp(6) with time zone,
    access_granted_at timestamp(6) with time zone,
    consent_expires_at timestamp(6) with time zone,
    consent_duration_months integer DEFAULT 6,
    isActive boolean DEFAULT true,
    assignment_start_date timestamp(6) with time zone,
    assignment_end_date timestamp(6) with time zone,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: service_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_plans (
    id uuid NOT NULL,
    provider_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    service_type character varying(100),
    price numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    billing_cycle public.enum_service_plans_billing_cycle DEFAULT 'monthly'::public.enum_service_plans_billing_cycle NOT NULL,
    features json DEFAULT '[]'::json,
    patient_limit integer,
    trial_period_days integer DEFAULT 0,
    setup_fee numeric(10,2) DEFAULT 0,
    isActive boolean DEFAULT true,
    stripe_price_id character varying(255),
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: specialities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialities (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(1000),
    user_created integer,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: specialities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.specialities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: specialities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.specialities_id_seq OWNED BY public.specialities.id;


--
-- Name: symptoms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.symptoms (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    care_plan_id uuid,
    symptom_name character varying(255) NOT NULL,
    severity integer,
    description text,
    body_location jsonb DEFAULT '{}'::jsonb,
    onset_time timestamp(6) with time zone,
    recordedAt timestamp(6) with time zone,
    triggers jsonb DEFAULT '[]'::jsonb,
    relieving_factors jsonb DEFAULT '[]'::jsonb,
    associated_symptoms jsonb DEFAULT '[]'::jsonb,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: symptoms_database; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.symptoms_database (
    id uuid NOT NULL,
    diagnosis_name character varying(255) NOT NULL,
    symptoms jsonb DEFAULT '{}'::jsonb,
    category character varying(100),
    severity_indicators jsonb DEFAULT '{}'::jsonb,
    common_age_groups jsonb DEFAULT '[]'::jsonb,
    gender_specific character varying(20),
    isActive boolean DEFAULT true,
    created_by uuid,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: treatment_database; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_database (
    id uuid NOT NULL,
    treatment_name character varying(255) NOT NULL,
    treatment_type character varying(50) NOT NULL,
    description text,
    applicable_conditions jsonb DEFAULT '[]'::jsonb,
    duration character varying(100),
    frequency character varying(100),
    dosage_info jsonb DEFAULT '{}'::jsonb,
    category character varying(100),
    severity_level character varying(20),
    age_restrictions jsonb DEFAULT '{}'::jsonb,
    contraindications jsonb DEFAULT '[]'::jsonb,
    side_effects jsonb DEFAULT '[]'::jsonb,
    monitoring_required jsonb DEFAULT '[]'::jsonb,
    isActive boolean DEFAULT true,
    requires_specialist boolean DEFAULT false,
    prescription_required boolean DEFAULT false,
    created_by uuid,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: treatment_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_plans (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    doctorId uuid NOT NULL,
    organization_id uuid,
    title character varying(255) NOT NULL,
    description text,
    plan_type character varying(20) DEFAULT 'treatment_plan'::character varying,
    primary_diagnosis character varying(255) NOT NULL,
    secondary_diagnoses text[] DEFAULT ARRAY[]::text[],
    chief_complaint text,
    symptoms jsonb DEFAULT '[]'::jsonb,
    treatment_goals jsonb DEFAULT '[]'::jsonb,
    interventions jsonb DEFAULT '[]'::jsonb,
    medications jsonb DEFAULT '[]'::jsonb,
    instructions text,
    start_date timestamp(6) with time zone NOT NULL,
    expected_duration_days integer,
    end_date timestamp(6) with time zone,
    follow_up_required boolean DEFAULT true,
    follow_up_date timestamp(6) with time zone,
    follow_up_instructions text,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying,
    progress_notes jsonb DEFAULT '[]'::jsonb,
    completion_percentage integer DEFAULT 0,
    outcome text,
    emergency_contacts jsonb DEFAULT '[]'::jsonb,
    warning_signs text[] DEFAULT ARRAY[]::text[],
    assigned_hsps uuid[] DEFAULT ARRAY[]::uuid[],
    care_team_notes jsonb DEFAULT '[]'::jsonb,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_devices (
    id uuid NOT NULL,
    userId uuid NOT NULL,
    device_type character varying(50) NOT NULL,
    push_token character varying(500) NOT NULL,
    device_id character varying(255),
    isActive boolean DEFAULT true,
    notification_settings jsonb DEFAULT '{"vitals": true, "symptoms": true, "emergency": true, "reminders": true, "medications": true, "appointments": true}'::jsonb,
    last_used_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid NOT NULL,
    user_identity uuid NOT NULL,
    linked_with public.enum_user_roles_linked_with,
    linked_id uuid,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.enum_users_role NOT NULL,
    account_status public.enum_users_account_status DEFAULT 'PENDING_VERIFICATION'::public.enum_users_account_status,
    first_name character varying(100),
    last_name character varying(100),
    middle_name character varying(100),
    phone character varying(20),
    date_of_birth date,
    gender public.enum_users_gender,
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    password_reset_token character varying(255),
    password_reset_expires timestamp(6) with time zone,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying(255),
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp(6) with time zone,
    last_login_at timestamp(6) with time zone,
    profile_picture_url character varying(500),
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    locale character varying(10) DEFAULT 'en'::character varying,
    preferences jsonb DEFAULT '{"privacy": {"profile_visible": true, "share_data_for_research": false}, "accessibility": {"large_text": false, "high_contrast": false}, "notifications": {"sms": false, "push": true, "email": true}}'::jsonb,
    terms_accepted_at timestamp(6) with time zone,
    privacy_policy_accepted_at timestamp(6) with time zone,
    hipaa_consent_date timestamp(6) with time zone,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone,
    full_name character varying(255)
);


--
-- Name: video_consultations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_consultations (
    id uuid NOT NULL,
    consultation_id character varying(255) NOT NULL,
    doctorId uuid NOT NULL,
    patientId uuid NOT NULL,
    appointment_id uuid,
    consultation_type public."ConsultationType" DEFAULT 'VIDEO_CONSULTATION'::public."ConsultationType" NOT NULL,
    status public."ConsultationStatus" DEFAULT 'SCHEDULED'::public."ConsultationStatus" NOT NULL,
    priority public."ConsultationPriority" DEFAULT 'ROUTINE'::public."ConsultationPriority" NOT NULL,
    scheduled_start timestamp(6) with time zone NOT NULL,
    scheduled_end timestamp(6) with time zone NOT NULL,
    actual_start timestamp(6) with time zone,
    actual_end timestamp(6) with time zone,
    timezone character varying(50) DEFAULT 'UTC'::character varying NOT NULL,
    room_id character varying(255),
    room_token text,
    doctor_join_url text,
    patient_join_url text,
    recording_enabled boolean DEFAULT false NOT NULL,
    recording_url text,
    chief_complaint text,
    presenting_symptoms text[] DEFAULT ARRAY[]::text[],
    consultation_notes text,
    diagnosis text,
    treatment_plan text,
    follow_up_required boolean DEFAULT false NOT NULL,
    follow_up_date timestamp(6) with time zone,
    connection_quality jsonb DEFAULT '{}'::jsonb,
    technical_issues text[] DEFAULT ARRAY[]::text[],
    duration_minutes integer,
    consultation_fee numeric(10,2),
    insurance_covered boolean DEFAULT false NOT NULL,
    payment_status character varying(50) DEFAULT 'pending'::character varying,
    created_by uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: vital_alert_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vital_alert_rules (
    id uuid NOT NULL,
    vitalType character varying(100) NOT NULL,
    isActive boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    alert_level public."AlertSeverity" NOT NULL,
    alert_message text NOT NULL,
    applies_to_all boolean DEFAULT true NOT NULL,
    condition_type public."VitalConditionType" NOT NULL,
    description text,
    gender_specific character varying(10),
    max_age integer,
    min_age integer,
    name character varying(255) NOT NULL,
    notification_delay integer DEFAULT 0 NOT NULL,
    patient_conditions jsonb DEFAULT '[]'::jsonb,
    threshold_max numeric(10,2),
    threshold_min numeric(10,2),
    threshold_value numeric(10,2),
    unit character varying(20)
);


--
-- Name: vital_readings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vital_readings (
    id uuid NOT NULL,
    patientId uuid NOT NULL,
    vital_type_id uuid NOT NULL,
    adherence_record_id uuid,
    value numeric(10,2),
    unit character varying(20),
    readingTime timestamp(6) with time zone NOT NULL,
    device_info jsonb DEFAULT '{}'::jsonb,
    isFlagged boolean DEFAULT false,
    notes text,
    attachments jsonb DEFAULT '[]'::jsonb,
    is_validated boolean DEFAULT false,
    validated_by uuid,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone,
    systolic_value numeric(5,2),
    diastolic_value numeric(5,2),
    pulse_rate integer,
    respiratory_rate integer,
    oxygen_saturation numeric(5,2),
    alert_level public.enum_vital_readings_alert_level DEFAULT 'normal'::public.enum_vital_readings_alert_level,
    alert_reasons jsonb DEFAULT '[]'::jsonb
);


--
-- Name: vitalRequirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vitalRequirements (
    id uuid NOT NULL,
    care_plan_id uuid NOT NULL,
    vital_type_id uuid NOT NULL,
    frequency character varying(100) NOT NULL,
    preferred_time time(6) without time zone,
    is_critical boolean DEFAULT false,
    monitoring_notes text,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: vital_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vital_templates (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    unit character varying(255),
    details json,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: vital_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vital_types (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    unit character varying(20),
    normalRangeMin numeric(10,2),
    normalRangeMax numeric(10,2),
    description text,
    validation_rules jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    deleted_at timestamp(6) with time zone
);


--
-- Name: vitals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vitals (
    id uuid NOT NULL,
    vital_template_id uuid NOT NULL,
    care_plan_id uuid NOT NULL,
    details json,
    description character varying(1000),
    start_date timestamp(6) with time zone,
    end_date timestamp(6) with time zone,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


--
-- Name: specialities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialities ALTER COLUMN id SET DEFAULT nextval('public.specialities_id_seq'::regclass);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: adherence_records adherence_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adherence_records
    ADD CONSTRAINT adherence_records_pkey PRIMARY KEY (id);


--
-- Name: appointment_slots appointment_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: care_plan_templates care_plan_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_pkey PRIMARY KEY (id);


--
-- Name: care_plans care_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (id);


--
-- Name: consultation_notes consultation_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_notes
    ADD CONSTRAINT consultation_notes_pkey PRIMARY KEY (id);


--
-- Name: consultation_prescriptions consultation_prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_prescriptions
    ADD CONSTRAINT consultation_prescriptions_pkey PRIMARY KEY (id);


--
-- Name: dashboard_metrics dashboard_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_metrics
    ADD CONSTRAINT dashboard_metrics_pkey PRIMARY KEY (id);


--
-- Name: doctor_availability doctor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: drug_interactions drug_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drug_interactions
    ADD CONSTRAINT drug_interactions_pkey PRIMARY KEY (id);


--
-- Name: emergency_alerts emergency_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_alerts
    ADD CONSTRAINT emergency_alerts_pkey PRIMARY KEY (id);


--
-- Name: emergency_contacts emergency_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_contacts
    ADD CONSTRAINT emergency_contacts_pkey PRIMARY KEY (id);


--
-- Name: game_badge_awards game_badge_awards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_badge_awards
    ADD CONSTRAINT game_badge_awards_pkey PRIMARY KEY (id);


--
-- Name: game_challenge_progress game_challenge_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_challenge_progress
    ADD CONSTRAINT game_challenge_progress_pkey PRIMARY KEY (id);


--
-- Name: healthcare_providers healthcare_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_pkey PRIMARY KEY (id);


--
-- Name: hsps hsps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_pkey PRIMARY KEY (id);


--
-- Name: lab_orders lab_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_pkey PRIMARY KEY (id);


--
-- Name: lab_results lab_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_pkey PRIMARY KEY (id);


--
-- Name: medication_logs medication_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_logs
    ADD CONSTRAINT medication_logs_pkey PRIMARY KEY (id);


--
-- Name: medication_safety_alerts medication_safety_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_safety_alerts
    ADD CONSTRAINT medication_safety_alerts_pkey PRIMARY KEY (id);


--
-- Name: medications medications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: patient_alerts patient_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_alerts
    ADD CONSTRAINT patient_alerts_pkey PRIMARY KEY (id);


--
-- Name: patient_allergies patient_allergies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_allergies
    ADD CONSTRAINT patient_allergies_pkey PRIMARY KEY (id);


--
-- Name: patient_consent_otp patient_consent_otp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_consent_otp
    ADD CONSTRAINT patient_consent_otp_pkey PRIMARY KEY (id);


--
-- Name: patient_doctor_assignments patient_doctor_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_pkey PRIMARY KEY (id);


--
-- Name: patient_game_profiles patient_game_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_game_profiles
    ADD CONSTRAINT patient_game_profiles_pkey PRIMARY KEY (id);


--
-- Name: patient_provider_assignments patient_provider_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_assignments
    ADD CONSTRAINT patient_provider_assignments_pkey PRIMARY KEY (id);


--
-- Name: patient_provider_consent_history patient_provider_consent_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_consent_history
    ADD CONSTRAINT patient_provider_consent_history_pkey PRIMARY KEY (id);


--
-- Name: patient_subscriptions patient_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: provider_change_history provider_change_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_change_history
    ADD CONSTRAINT provider_change_history_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: schedule_events schedule_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_events
    ADD CONSTRAINT schedule_events_pkey PRIMARY KEY (id);


--
-- Name: scheduled_events scheduled_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_events
    ADD CONSTRAINT scheduled_events_pkey PRIMARY KEY (id);


--
-- Name: secondary_doctor_assignments secondary_doctor_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_doctor_assignments
    ADD CONSTRAINT secondary_doctor_assignments_pkey PRIMARY KEY (id);


--
-- Name: service_plans service_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_plans
    ADD CONSTRAINT service_plans_pkey PRIMARY KEY (id);


--
-- Name: specialities specialities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialities
    ADD CONSTRAINT specialities_pkey PRIMARY KEY (id);


--
-- Name: symptoms_database symptoms_database_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms_database
    ADD CONSTRAINT symptoms_database_pkey PRIMARY KEY (id);


--
-- Name: symptoms symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_pkey PRIMARY KEY (id);


--
-- Name: treatment_database treatment_database_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_database
    ADD CONSTRAINT treatment_database_pkey PRIMARY KEY (id);


--
-- Name: treatment_plans treatment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: video_consultations video_consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_consultations
    ADD CONSTRAINT video_consultations_pkey PRIMARY KEY (id);


--
-- Name: vital_alert_rules vital_alert_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_alert_rules
    ADD CONSTRAINT vital_alert_rules_pkey PRIMARY KEY (id);


--
-- Name: vital_readings vital_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_pkey PRIMARY KEY (id);


--
-- Name: vitalRequirements vital_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitalRequirements
    ADD CONSTRAINT vital_requirements_pkey PRIMARY KEY (id);


--
-- Name: vital_templates vital_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_templates
    ADD CONSTRAINT vital_templates_pkey PRIMARY KEY (id);


--
-- Name: vital_types vital_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_types
    ADD CONSTRAINT vital_types_pkey PRIMARY KEY (id);


--
-- Name: vitals vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_pkey PRIMARY KEY (id);


--
-- Name: adherence_records_adherence_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adherence_records_adherence_type ON public.adherence_records USING btree (adherence_type);


--
-- Name: adherence_records_due_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adherence_records_due_at ON public.adherence_records USING btree (due_at);


--
-- Name: adherence_records_is_completed_is_missed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adherence_records_is_completed_is_missed ON public.adherence_records USING btree (is_completed, is_missed);


--
-- Name: adherence_records_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adherence_records_patient_id ON public.adherence_records USING btree (patientId);


--
-- Name: adherence_records_patient_id_adherence_type_due_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adherence_records_patient_id_adherence_type_due_at ON public.adherence_records USING btree (patientId, adherence_type, due_at);


--
-- Name: adherence_records_patient_id_due_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adherence_records_patient_id_due_at ON public.adherence_records USING btree (patientId, due_at);


--
-- Name: adherence_records_scheduled_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adherence_records_scheduled_event_id ON public.adherence_records USING btree (scheduled_event_id);


--
-- Name: appointment_slots_date_is_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointment_slots_date_is_available ON public.appointment_slots USING btree (date, is_available);


--
-- Name: appointment_slots_doctor_id_date_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointment_slots_doctor_id_date_start_time ON public.appointment_slots USING btree (doctorId, date, start_time);


--
-- Name: appointment_slots_doctor_id_is_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointment_slots_doctor_id_is_available ON public.appointment_slots USING btree (doctorId, is_available);


--
-- Name: appointments_organizer_id_organizer_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_organizer_id_organizer_type ON public.appointments USING btree (organizer_id, organizer_type);


--
-- Name: appointments_participant_one_id_participant_one_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_participant_one_id_participant_one_type ON public.appointments USING btree (participant_one_id, participant_one_type);


--
-- Name: appointments_participant_two_id_participant_two_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_participant_two_id_participant_two_type ON public.appointments USING btree (participant_two_id, participant_two_type);


--
-- Name: appointments_slot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_slot_id ON public.appointments USING btree (slot_id);


--
-- Name: appointments_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_start_date ON public.appointments USING btree (start_date);


--
-- Name: audit_logs_access_granted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_access_granted ON public.audit_logs USING btree (accessGranted);


--
-- Name: audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_ip_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_ip_address ON public.audit_logs USING btree (ip_address);


--
-- Name: audit_logs_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_organization_id ON public.audit_logs USING btree (organization_id);


--
-- Name: audit_logs_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_patient_id ON public.audit_logs USING btree (patientId);


--
-- Name: audit_logs_patient_id_phi_accessed_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_patient_id_phi_accessed_timestamp ON public.audit_logs USING btree (patientId, phi_accessed, "timestamp");


--
-- Name: audit_logs_phi_accessed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_phi_accessed ON public.audit_logs USING btree (phi_accessed);


--
-- Name: audit_logs_retention_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_retention_date ON public.audit_logs USING btree (retention_date);


--
-- Name: audit_logs_risk_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_risk_level ON public.audit_logs USING btree (risk_level);


--
-- Name: audit_logs_risk_level_access_granted_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_risk_level_access_granted_timestamp ON public.audit_logs USING btree (risk_level, accessGranted, "timestamp");


--
-- Name: audit_logs_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_session_id ON public.audit_logs USING btree (session_id);


--
-- Name: audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_id ON public.audit_logs USING btree (userId);


--
-- Name: audit_logs_user_id_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_id_timestamp ON public.audit_logs USING btree (userId, "timestamp");


--
-- Name: care_plans_chronic_conditions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_chronic_conditions ON public.care_plans USING gin (chronic_conditions);


--
-- Name: care_plans_created_by_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_created_by_doctor_id ON public.care_plans USING btree (created_by_doctor_id);


--
-- Name: care_plans_created_by_hsp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_created_by_hsp_id ON public.care_plans USING btree (created_by_hsp_id);


--
-- Name: care_plans_monitoring_parameters; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_monitoring_parameters ON public.care_plans USING gin (monitoring_parameters);


--
-- Name: care_plans_next_review_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_next_review_date ON public.care_plans USING btree (next_review_date);


--
-- Name: care_plans_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_organization_id ON public.care_plans USING btree (organization_id);


--
-- Name: care_plans_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_patient_id ON public.care_plans USING btree (patientId);


--
-- Name: care_plans_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_priority ON public.care_plans USING btree (priority);


--
-- Name: care_plans_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_start_date ON public.care_plans USING btree (start_date);


--
-- Name: care_plans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX care_plans_status ON public.care_plans USING btree (status);


--
-- Name: clinics_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinics_doctor_id ON public.clinics USING btree (doctorId);


--
-- Name: clinics_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinics_is_active ON public.clinics USING btree (isActive);


--
-- Name: clinics_is_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinics_is_primary ON public.clinics USING btree (is_primary);


--
-- Name: clinics_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinics_organization_id ON public.clinics USING btree (organization_id);


--
-- Name: consultation_notes_consultation_id_note_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consultation_notes_consultation_id_note_type_idx ON public.consultation_notes USING btree (consultation_id, note_type);


--
-- Name: consultation_prescriptions_consultation_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consultation_prescriptions_consultation_id_idx ON public.consultation_prescriptions USING btree (consultation_id);


--
-- Name: dashboard_metrics_calculated_at_valid_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dashboard_metrics_calculated_at_valid_until ON public.dashboard_metrics USING btree (calculated_at, valid_until);


--
-- Name: dashboard_metrics_entity_type_entity_id_metric_type; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX dashboard_metrics_entity_type_entity_id_metric_type ON public.dashboard_metrics USING btree (entity_type, entity_id, metric_type);


--
-- Name: doctor_availability_doctor_id_day_of_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doctor_availability_doctor_id_day_of_week ON public.doctor_availability USING btree (doctorId, day_of_week);


--
-- Name: doctor_availability_doctor_id_is_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doctor_availability_doctor_id_is_available ON public.doctor_availability USING btree (doctorId, is_available);


--
-- Name: doctors_board_certifications; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doctors_board_certifications ON public.doctors USING gin (board_certifications);


--
-- Name: doctors_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX doctors_doctor_id ON public.doctors USING btree (doctorId);


--
-- Name: doctors_gender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doctors_gender ON public.doctors USING btree (gender);


--
-- Name: doctors_is_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doctors_is_verified ON public.doctors USING btree (is_verified);


--
-- Name: doctors_is_verified_gender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doctors_is_verified_gender ON public.doctors USING btree (is_verified, gender);


--
-- Name: doctors_medical_license_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX doctors_medical_license_number ON public.doctors USING btree (medical_license_number);


--
-- Name: doctors_npi_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX doctors_npi_number_key ON public.doctors USING btree (npi_number);


--
-- Name: doctors_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doctors_organization_id ON public.doctors USING btree (organization_id);


--
-- Name: doctors_specialties; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX doctors_specialties ON public.doctors USING gin (specialties);


--
-- Name: doctors_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX doctors_user_id ON public.doctors USING btree (userId);


--
-- Name: drug_interactions_drug_name_one_drug_name_two_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX drug_interactions_drug_name_one_drug_name_two_idx ON public.drug_interactions USING btree (drug_name_one, drug_name_two);


--
-- Name: drug_interactions_rxcui_one_rxcui_two_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX drug_interactions_rxcui_one_rxcui_two_key ON public.drug_interactions USING btree (rxcui_one, rxcui_two);


--
-- Name: drug_interactions_severity_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX drug_interactions_severity_level_idx ON public.drug_interactions USING btree (severity_level);


--
-- Name: emergency_alerts_alert_type_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emergency_alerts_alert_type_created_at_idx ON public.emergency_alerts USING btree (alert_type, created_at);


--
-- Name: emergency_alerts_patient_id_priority_level_acknowledged_res_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emergency_alerts_patient_id_priority_level_acknowledged_res_idx ON public.emergency_alerts USING btree (patientId, priority_level, acknowledged, resolved);


--
-- Name: emergency_alerts_resolved_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emergency_alerts_resolved_created_at_idx ON public.emergency_alerts USING btree (resolved, created_at);


--
-- Name: emergency_contacts_patient_id_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emergency_contacts_patient_id_is_active_idx ON public.emergency_contacts USING btree (patientId, isActive);


--
-- Name: emergency_contacts_patient_id_priority_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emergency_contacts_patient_id_priority_order_idx ON public.emergency_contacts USING btree (patientId, priority_order);


--
-- Name: game_badge_awards_badge_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX game_badge_awards_badge_type_idx ON public.game_badge_awards USING btree (badge_type);


--
-- Name: game_badge_awards_patient_id_awarded_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX game_badge_awards_patient_id_awarded_date_idx ON public.game_badge_awards USING btree (patientId, awarded_date);


--
-- Name: game_challenge_progress_challenge_type_end_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX game_challenge_progress_challenge_type_end_date_idx ON public.game_challenge_progress USING btree (challenge_type, end_date);


--
-- Name: game_challenge_progress_patient_id_is_completed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX game_challenge_progress_patient_id_is_completed_idx ON public.game_challenge_progress USING btree (patientId, is_completed);


--
-- Name: healthcare_providers_is_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX healthcare_providers_is_verified ON public.healthcare_providers USING btree (is_verified);


--
-- Name: healthcare_providers_license_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX healthcare_providers_license_number_key ON public.healthcare_providers USING btree (license_number);


--
-- Name: healthcare_providers_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX healthcare_providers_organization_id ON public.healthcare_providers USING btree (organization_id);


--
-- Name: healthcare_providers_specialties; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX healthcare_providers_specialties ON public.healthcare_providers USING gin (specialties);


--
-- Name: healthcare_providers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX healthcare_providers_user_id ON public.healthcare_providers USING btree (userId);


--
-- Name: healthcare_providers_verification_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX healthcare_providers_verification_date ON public.healthcare_providers USING btree (verification_date);


--
-- Name: hsps_departments; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hsps_departments ON public.hsps USING gin (departments);


--
-- Name: hsps_hsp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX hsps_hsp_id ON public.hsps USING btree (hsp_id);


--
-- Name: hsps_hsp_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hsps_hsp_type ON public.hsps USING btree (hsp_type);


--
-- Name: hsps_is_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hsps_is_verified ON public.hsps USING btree (is_verified);


--
-- Name: hsps_license_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX hsps_license_number_key ON public.hsps USING btree (license_number);


--
-- Name: hsps_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hsps_organization_id ON public.hsps USING btree (organization_id);


--
-- Name: hsps_specializations; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hsps_specializations ON public.hsps USING gin (specializations);


--
-- Name: hsps_supervising_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hsps_supervising_doctor_id ON public.hsps USING btree (supervising_doctor_id);


--
-- Name: hsps_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX hsps_user_id ON public.hsps USING btree (userId);


--
-- Name: idx_adherence_event_status_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_adherence_event_status_completed ON public.adherence_records USING btree (scheduled_event_id, is_completed, recordedAt);


--
-- Name: idx_adherence_patient_due_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_adherence_patient_due_status ON public.adherence_records USING btree (patientId, due_at, is_completed);


--
-- Name: idx_appointments_organizer_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_organizer_time ON public.appointments USING btree (organizer_type, organizer_id, start_time);


--
-- Name: idx_appointments_patient_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_patient_time ON public.appointments USING btree (patientId, start_time);


--
-- Name: idx_appointments_provider_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_provider_time ON public.appointments USING btree (provider_id, start_time);


--
-- Name: idx_assignments_doctor_active_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_doctor_active_created ON public.patient_doctor_assignments USING btree (doctorId, isActive, created_at);


--
-- Name: idx_assignments_patient_type_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_patient_type_active ON public.patient_doctor_assignments USING btree (patientId, assignment_type, isActive);


--
-- Name: idx_audit_user_created_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_user_created_action ON public.audit_logs USING btree (userId, created_at, action);


--
-- Name: idx_careplans_patient_status_start_fixed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_careplans_patient_status_start_fixed ON public.care_plans USING btree (patientId, status, start_date);


--
-- Name: idx_clinics_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_coordinates ON public.clinics USING btree (latitude, longitude);


--
-- Name: idx_clinics_location_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_location_verified ON public.clinics USING btree (location_verified);


--
-- Name: idx_events_careplan_time_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_careplan_time_type ON public.scheduled_events USING btree (care_plan_id, scheduled_for, event_type);


--
-- Name: idx_events_patient_time_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_patient_time_status ON public.scheduled_events USING btree (patientId, scheduled_for, status);


--
-- Name: idx_notifications_type_priority_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type_priority_created ON public.notifications USING btree (type, priority, created_at);


--
-- Name: idx_patients_doctor_created_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_doctor_created_active ON public.patients USING btree (primaryCareDoctorId, created_at, isActive);


--
-- Name: idx_patients_id_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_id_created ON public.patients USING btree (patientId, created_at);


--
-- Name: idx_patients_user_doctor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_user_doctor ON public.patients USING btree (userId, primaryCareDoctorId);


--
-- Name: idx_providers_org_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_providers_org_verified ON public.healthcare_providers USING btree (organization_id, is_verified);


--
-- Name: idx_symptoms_patient_onset_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_symptoms_patient_onset_severity ON public.symptoms USING btree (patientId, onset_time, severity);


--
-- Name: idx_templates_conditions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_conditions ON public.care_plan_templates USING gin (conditions);


--
-- Name: idx_templates_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_created_by ON public.care_plan_templates USING btree (created_by);


--
-- Name: idx_templates_is_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_is_approved ON public.care_plan_templates USING btree (is_approved);


--
-- Name: idx_templates_is_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_is_public ON public.care_plan_templates USING btree (is_public);


--
-- Name: idx_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_name ON public.care_plan_templates USING btree (name);


--
-- Name: idx_templates_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_organization_id ON public.care_plan_templates USING btree (organization_id);


--
-- Name: idx_templates_specialties; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_specialties ON public.care_plan_templates USING gin (specialties);


--
-- Name: idx_templates_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_tags ON public.care_plan_templates USING gin (tags);


--
-- Name: idx_userroles_identity_linked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_userroles_identity_linked ON public.user_roles USING btree (user_identity, linked_with);


--
-- Name: idx_users_email_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email_status ON public.users USING btree (email, account_status);


--
-- Name: idx_users_role_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role_status ON public.users USING btree (role, account_status);


--
-- Name: idx_vitals_patient_time_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vitals_patient_time_type ON public.vital_readings USING btree (patientId, readingTime, vital_type_id);


--
-- Name: idx_vitals_patient_type_time_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vitals_patient_type_time_desc ON public.vital_readings USING btree (patientId, vital_type_id, readingTime);


--
-- Name: idx_vitals_time_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vitals_time_patient ON public.vital_readings USING btree (readingTime, patientId);


--
-- Name: lab_orders_doctor_id_order_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_orders_doctor_id_order_date_idx ON public.lab_orders USING btree (doctorId, order_date);


--
-- Name: lab_orders_order_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX lab_orders_order_number_key ON public.lab_orders USING btree (order_number);


--
-- Name: lab_orders_patient_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_orders_patient_id_status_idx ON public.lab_orders USING btree (patientId, status);


--
-- Name: lab_orders_status_expected_result_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_orders_status_expected_result_date_idx ON public.lab_orders USING btree (status, expected_result_date);


--
-- Name: lab_results_critical_flag_result_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_results_critical_flag_result_date_idx ON public.lab_results USING btree (critical_flag, result_date);


--
-- Name: lab_results_lab_order_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_results_lab_order_id_idx ON public.lab_results USING btree (lab_order_id);


--
-- Name: lab_results_test_name_result_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_results_test_name_result_date_idx ON public.lab_results USING btree (test_name, result_date);


--
-- Name: medication_logs_adherence_status_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_logs_adherence_status_scheduled_at ON public.medication_logs USING btree (adherence_status, scheduled_at);


--
-- Name: medication_logs_medication_id_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_logs_medication_id_scheduled_at ON public.medication_logs USING btree (medication_id, scheduled_at);


--
-- Name: medication_logs_patient_id_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_logs_patient_id_scheduled_at ON public.medication_logs USING btree (patientId, scheduled_at);


--
-- Name: medication_safety_alerts_alert_type_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_safety_alerts_alert_type_created_at_idx ON public.medication_safety_alerts USING btree (alert_type, created_at);


--
-- Name: medication_safety_alerts_patient_id_severity_resolved_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_safety_alerts_patient_id_severity_resolved_idx ON public.medication_safety_alerts USING btree (patientId, severity, resolved);


--
-- Name: medication_safety_alerts_resolved_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_safety_alerts_resolved_created_at_idx ON public.medication_safety_alerts USING btree (resolved, created_at);


--
-- Name: medications_medicine_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medications_medicine_id ON public.medications USING btree (medicine_id);


--
-- Name: medications_organizer_type_organizer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medications_organizer_type_organizer_id ON public.medications USING btree (organizer_type, organizer_id);


--
-- Name: medications_participant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medications_participant_id ON public.medications USING btree (participant_id);


--
-- Name: notifications_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_doctor_id ON public.notifications USING btree (doctorId);


--
-- Name: notifications_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_expires_at ON public.notifications USING btree (expires_at);


--
-- Name: notifications_hsp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_hsp_id ON public.notifications USING btree (hsp_id);


--
-- Name: notifications_is_urgent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_is_urgent ON public.notifications USING btree (is_urgent);


--
-- Name: notifications_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_organization_id ON public.notifications USING btree (organization_id);


--
-- Name: notifications_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_patient_id ON public.notifications USING btree (patientId);


--
-- Name: notifications_patient_id_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_patient_id_status_created_at ON public.notifications USING btree (patientId, status, created_at);


--
-- Name: notifications_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_priority ON public.notifications USING btree (priority);


--
-- Name: notifications_requires_action_action_taken; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_requires_action_action_taken ON public.notifications USING btree (requires_action, action_taken);


--
-- Name: notifications_scheduled_for; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_scheduled_for ON public.notifications USING btree (scheduled_for);


--
-- Name: notifications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_status ON public.notifications USING btree (status);


--
-- Name: notifications_status_scheduled_for_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_status_scheduled_for_expires_at ON public.notifications USING btree (status, scheduled_for, expires_at);


--
-- Name: notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_type ON public.notifications USING btree (type);


--
-- Name: organizations_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organizations_is_active ON public.organizations USING btree (isActive);


--
-- Name: organizations_license_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organizations_license_number_key ON public.organizations USING btree (license_number);


--
-- Name: organizations_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organizations_name ON public.organizations USING btree (name);


--
-- Name: organizations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organizations_type ON public.organizations USING btree (type);


--
-- Name: patient_alerts_acknowledged_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_alerts_acknowledged_resolved ON public.patient_alerts USING btree (acknowledged, resolved);


--
-- Name: patient_alerts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_alerts_created_at ON public.patient_alerts USING btree (created_at);


--
-- Name: patient_alerts_patient_id_alert_type_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_alerts_patient_id_alert_type_severity ON public.patient_alerts USING btree (patientId, alert_type, severity);


--
-- Name: patient_allergies_allergen_type_allergen_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_allergies_allergen_type_allergen_name_idx ON public.patient_allergies USING btree (allergen_type, allergen_name);


--
-- Name: patient_allergies_patient_id_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_allergies_patient_id_is_active_idx ON public.patient_allergies USING btree (patientId, isActive);


--
-- Name: patient_consent_otp_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_consent_otp_expires_at ON public.patient_consent_otp USING btree (expires_at);


--
-- Name: patient_consent_otp_generated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_consent_otp_generated_at ON public.patient_consent_otp USING btree (generated_at);


--
-- Name: patient_consent_otp_is_blocked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_consent_otp_is_blocked ON public.patient_consent_otp USING btree (is_blocked);


--
-- Name: patient_consent_otp_is_expired; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_consent_otp_is_expired ON public.patient_consent_otp USING btree (is_expired);


--
-- Name: patient_consent_otp_is_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_consent_otp_is_verified ON public.patient_consent_otp USING btree (is_verified);


--
-- Name: patient_consent_otp_otp_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_consent_otp_otp_code ON public.patient_consent_otp USING btree (otp_code);


--
-- Name: patient_consent_otp_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_consent_otp_patient_id ON public.patient_consent_otp USING btree (patientId);


--
-- Name: patient_consent_otp_requested_by_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_consent_otp_requested_by_user_id ON public.patient_consent_otp USING btree (requested_by_user_id);


--
-- Name: patient_consent_otp_secondary_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_consent_otp_secondary_assignment_id ON public.patient_consent_otp USING btree (secondary_assignment_id);


--
-- Name: patient_doctor_assignments_assignment_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_doctor_assignments_assignment_type ON public.patient_doctor_assignments USING btree (assignment_type);


--
-- Name: patient_doctor_assignments_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_doctor_assignments_doctor_id ON public.patient_doctor_assignments USING btree (doctorId);


--
-- Name: patient_doctor_assignments_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_doctor_assignments_is_active ON public.patient_doctor_assignments USING btree (isActive);


--
-- Name: patient_doctor_assignments_patient_consent_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_doctor_assignments_patient_consent_status ON public.patient_doctor_assignments USING btree (patient_consent_status);


--
-- Name: patient_doctor_assignments_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_doctor_assignments_patient_id ON public.patient_doctor_assignments USING btree (patientId);


--
-- Name: patient_game_profiles_patient_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patient_game_profiles_patient_id_key ON public.patient_game_profiles USING btree (patientId);


--
-- Name: patient_game_profiles_patient_id_last_activity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_game_profiles_patient_id_last_activity_idx ON public.patient_game_profiles USING btree (patientId, last_activity);


--
-- Name: patient_game_profiles_total_points_current_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_game_profiles_total_points_current_level_idx ON public.patient_game_profiles USING btree (total_points, current_level);


--
-- Name: patient_provider_consent_history_consent_requested_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_provider_consent_history_consent_requested_at ON public.patient_provider_consent_history USING btree (consent_requested_at);


--
-- Name: patient_provider_consent_history_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_provider_consent_history_doctor_id ON public.patient_provider_consent_history USING btree (doctorId);


--
-- Name: patient_provider_consent_history_hsp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_provider_consent_history_hsp_id ON public.patient_provider_consent_history USING btree (hsp_id);


--
-- Name: patient_provider_consent_history_new_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_provider_consent_history_new_provider_id ON public.patient_provider_consent_history USING btree (new_provider_id);


--
-- Name: patient_provider_consent_history_patient_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_provider_consent_history_patient_id_status ON public.patient_provider_consent_history USING btree (patientId, status);


--
-- Name: patient_provider_role_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patient_provider_role_unique ON public.patient_provider_assignments USING btree (patientId, provider_id, role, ended_at);


--
-- Name: patient_subscriptions_next_billing_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_subscriptions_next_billing_date ON public.patient_subscriptions USING btree (next_billing_date);


--
-- Name: patient_subscriptions_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_subscriptions_patient_id ON public.patient_subscriptions USING btree (patientId);


--
-- Name: patient_subscriptions_patient_id_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_subscriptions_patient_id_provider_id ON public.patient_subscriptions USING btree (patientId, provider_id);


--
-- Name: patient_subscriptions_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_subscriptions_provider_id ON public.patient_subscriptions USING btree (provider_id);


--
-- Name: patient_subscriptions_service_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_subscriptions_service_plan_id ON public.patient_subscriptions USING btree (service_plan_id);


--
-- Name: patient_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_subscriptions_status ON public.patient_subscriptions USING btree (status);


--
-- Name: patient_subscriptions_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_subscriptions_stripe_customer_id ON public.patient_subscriptions USING btree (stripe_customer_id);


--
-- Name: patient_subscriptions_stripe_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_subscriptions_stripe_subscription_id ON public.patient_subscriptions USING btree (stripe_subscription_id);


--
-- Name: patient_subscriptions_stripe_subscription_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patient_subscriptions_stripe_subscription_id_key ON public.patient_subscriptions USING btree (stripe_subscription_id);


--
-- Name: patients_allergies; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_allergies ON public.patients USING gin (allergies);


--
-- Name: patients_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_is_active ON public.patients USING btree (isActive);


--
-- Name: patients_linked_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_linked_provider_id ON public.patients USING btree (linked_provider_id);


--
-- Name: patients_medical_history; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_medical_history ON public.patients USING gin (medical_history);


--
-- Name: patients_medical_record_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patients_medical_record_number_key ON public.patients USING btree (medical_record_number);


--
-- Name: patients_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_organization_id ON public.patients USING btree (organization_id);


--
-- Name: patients_patient_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patients_patient_id_key ON public.patients USING btree (patientId);


--
-- Name: patients_primaryCareDoctorId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_primaryCareDoctorId ON public.patients USING btree (primaryCareDoctorId);


--
-- Name: patients_primary_care_hsp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_primary_care_hsp_id ON public.patients USING btree (primary_care_hsp_id);


--
-- Name: patients_provider_consent_given; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_provider_consent_given ON public.patients USING btree (provider_consent_given);


--
-- Name: patients_provider_linked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_provider_linked_at ON public.patients USING btree (provider_linked_at);


--
-- Name: patients_risk_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_risk_level ON public.patients USING btree (risk_level);


--
-- Name: patients_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patients_user_id ON public.patients USING btree (userId);


--
-- Name: payment_methods_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_methods_is_active ON public.payment_methods USING btree (isActive);


--
-- Name: payment_methods_is_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_methods_is_default ON public.payment_methods USING btree (is_default);


--
-- Name: payment_methods_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_methods_patient_id ON public.payment_methods USING btree (patientId);


--
-- Name: payment_methods_stripe_payment_method_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_methods_stripe_payment_method_id ON public.payment_methods USING btree (stripe_payment_method_id);


--
-- Name: payment_methods_stripe_payment_method_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_methods_stripe_payment_method_id_key ON public.payment_methods USING btree (stripe_payment_method_id);


--
-- Name: payment_methods_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_methods_type ON public.payment_methods USING btree (type);


--
-- Name: payments_billing_period_start_billing_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_billing_period_start_billing_period_end ON public.payments USING btree (billing_period_start, billing_period_end);


--
-- Name: payments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_created_at ON public.payments USING btree (created_at);


--
-- Name: payments_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_patient_id ON public.payments USING btree (patientId);


--
-- Name: payments_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_provider_id ON public.payments USING btree (provider_id);


--
-- Name: payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_status ON public.payments USING btree (status);


--
-- Name: payments_stripe_payment_intent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_stripe_payment_intent_id ON public.payments USING btree (stripe_payment_intent_id);


--
-- Name: payments_stripe_payment_intent_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payments_stripe_payment_intent_id_key ON public.payments USING btree (stripe_payment_intent_id);


--
-- Name: payments_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_subscription_id ON public.payments USING btree (subscription_id);


--
-- Name: provider_change_history_change_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_change_history_change_date ON public.provider_change_history USING btree (change_date);


--
-- Name: provider_change_history_new_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_change_history_new_provider_id ON public.provider_change_history USING btree (new_provider_id);


--
-- Name: provider_change_history_practitioner_type_practitioner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_change_history_practitioner_type_practitioner_id ON public.provider_change_history USING btree (practitioner_type, practitioner_id);


--
-- Name: provider_change_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_change_history_status ON public.provider_change_history USING btree (status);


--
-- Name: providers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX providers_user_id ON public.providers USING btree (userId);


--
-- Name: schedule_events_event_id_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_events_event_id_event_type ON public.schedule_events USING btree (event_id, event_type);


--
-- Name: schedule_events_event_type_status_date_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_events_event_type_status_date_start_time ON public.schedule_events USING btree (event_type, status, date, start_time);


--
-- Name: schedule_events_status_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX schedule_events_status_date ON public.schedule_events USING btree (status, date);


--
-- Name: scheduled_events_care_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scheduled_events_care_plan_id ON public.scheduled_events USING btree (care_plan_id);


--
-- Name: secondary_doctor_assignments_access_granted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX secondary_doctor_assignments_access_granted ON public.secondary_doctor_assignments USING btree (accessGranted);


--
-- Name: secondary_doctor_assignments_consent_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX secondary_doctor_assignments_consent_expires_at ON public.secondary_doctor_assignments USING btree (consent_expires_at);


--
-- Name: secondary_doctor_assignments_consent_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX secondary_doctor_assignments_consent_status ON public.secondary_doctor_assignments USING btree (consent_status);


--
-- Name: secondary_doctor_assignments_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX secondary_doctor_assignments_is_active ON public.secondary_doctor_assignments USING btree (isActive);


--
-- Name: secondary_doctor_assignments_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX secondary_doctor_assignments_patient_id ON public.secondary_doctor_assignments USING btree (patientId);


--
-- Name: secondary_doctor_assignments_primary_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX secondary_doctor_assignments_primary_doctor_id ON public.secondary_doctor_assignments USING btree (primary_doctor_id);


--
-- Name: secondary_doctor_assignments_secondary_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX secondary_doctor_assignments_secondary_doctor_id ON public.secondary_doctor_assignments USING btree (secondary_doctor_id);


--
-- Name: secondary_doctor_assignments_secondary_hsp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX secondary_doctor_assignments_secondary_hsp_id ON public.secondary_doctor_assignments USING btree (secondary_hsp_id);


--
-- Name: service_plans_billing_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_plans_billing_cycle ON public.service_plans USING btree (billing_cycle);


--
-- Name: service_plans_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_plans_is_active ON public.service_plans USING btree (isActive);


--
-- Name: service_plans_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_plans_name ON public.service_plans USING btree (name);


--
-- Name: service_plans_price; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_plans_price ON public.service_plans USING btree (price);


--
-- Name: service_plans_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_plans_provider_id ON public.service_plans USING btree (provider_id);


--
-- Name: service_plans_service_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX service_plans_service_type ON public.service_plans USING btree (service_type);


--
-- Name: symptoms_care_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_care_plan_id ON public.symptoms USING btree (care_plan_id);


--
-- Name: symptoms_database_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_database_category ON public.symptoms_database USING btree (category);


--
-- Name: symptoms_database_diagnosis_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX symptoms_database_diagnosis_name ON public.symptoms_database USING btree (diagnosis_name);


--
-- Name: symptoms_database_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_database_is_active ON public.symptoms_database USING btree (isActive);


--
-- Name: symptoms_database_symptoms; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_database_symptoms ON public.symptoms_database USING gin (symptoms);


--
-- Name: symptoms_onset_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_onset_time ON public.symptoms USING btree (onset_time);


--
-- Name: symptoms_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_patient_id ON public.symptoms USING btree (patientId);


--
-- Name: symptoms_patient_id_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_patient_id_recorded_at ON public.symptoms USING btree (patientId, recordedAt);


--
-- Name: symptoms_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_recorded_at ON public.symptoms USING btree (recordedAt);


--
-- Name: symptoms_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_severity ON public.symptoms USING btree (severity);


--
-- Name: symptoms_symptom_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX symptoms_symptom_name ON public.symptoms USING btree (symptom_name);


--
-- Name: treatment_database_applicable_conditions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_database_applicable_conditions ON public.treatment_database USING gin (applicable_conditions);


--
-- Name: treatment_database_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_database_category ON public.treatment_database USING btree (category);


--
-- Name: treatment_database_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_database_is_active ON public.treatment_database USING btree (isActive);


--
-- Name: treatment_database_severity_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_database_severity_level ON public.treatment_database USING btree (severity_level);


--
-- Name: treatment_database_treatment_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX treatment_database_treatment_name ON public.treatment_database USING btree (treatment_name);


--
-- Name: treatment_database_treatment_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_database_treatment_type ON public.treatment_database USING btree (treatment_type);


--
-- Name: treatment_plans_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_doctor_id ON public.treatment_plans USING btree (doctorId);


--
-- Name: treatment_plans_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_end_date ON public.treatment_plans USING btree (end_date);


--
-- Name: treatment_plans_follow_up_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_follow_up_date ON public.treatment_plans USING btree (follow_up_date);


--
-- Name: treatment_plans_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_organization_id ON public.treatment_plans USING btree (organization_id);


--
-- Name: treatment_plans_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_patient_id ON public.treatment_plans USING btree (patientId);


--
-- Name: treatment_plans_primary_diagnosis; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_primary_diagnosis ON public.treatment_plans USING btree (primary_diagnosis);


--
-- Name: treatment_plans_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_priority ON public.treatment_plans USING btree (priority);


--
-- Name: treatment_plans_secondary_diagnoses; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_secondary_diagnoses ON public.treatment_plans USING gin (secondary_diagnoses);


--
-- Name: treatment_plans_start_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_start_date ON public.treatment_plans USING btree (start_date);


--
-- Name: treatment_plans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_status ON public.treatment_plans USING btree (status);


--
-- Name: treatment_plans_symptoms; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX treatment_plans_symptoms ON public.treatment_plans USING gin (symptoms);


--
-- Name: user_devices_device_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_devices_device_type ON public.user_devices USING btree (device_type);


--
-- Name: user_devices_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_devices_is_active ON public.user_devices USING btree (isActive);


--
-- Name: user_devices_last_used_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_devices_last_used_at ON public.user_devices USING btree (last_used_at);


--
-- Name: user_devices_push_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_devices_push_token ON public.user_devices USING btree (push_token);


--
-- Name: user_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_devices_user_id ON public.user_devices USING btree (userId);


--
-- Name: user_devices_user_id_push_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_devices_user_id_push_token ON public.user_devices USING btree (userId, push_token);


--
-- Name: users_account_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_account_status ON public.users USING btree (account_status);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_email_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_verified ON public.users USING btree (email_verified);


--
-- Name: users_full_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_full_name ON public.users USING btree (full_name);


--
-- Name: users_last_login_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_last_login_at ON public.users USING btree (last_login_at);


--
-- Name: users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_phone ON public.users USING btree (phone);


--
-- Name: users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role ON public.users USING btree (role);


--
-- Name: video_consultations_consultation_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX video_consultations_consultation_id_key ON public.video_consultations USING btree (consultation_id);


--
-- Name: video_consultations_consultation_type_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX video_consultations_consultation_type_priority_idx ON public.video_consultations USING btree (consultation_type, priority);


--
-- Name: video_consultations_doctor_id_scheduled_start_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX video_consultations_doctor_id_scheduled_start_idx ON public.video_consultations USING btree (doctorId, scheduled_start);


--
-- Name: video_consultations_patient_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX video_consultations_patient_id_status_idx ON public.video_consultations USING btree (patientId, status);


--
-- Name: video_consultations_room_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX video_consultations_room_id_key ON public.video_consultations USING btree (room_id);


--
-- Name: video_consultations_status_scheduled_start_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX video_consultations_status_scheduled_start_idx ON public.video_consultations USING btree (status, scheduled_start);


--
-- Name: vital_alert_rules_alert_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_alert_rules_alert_level_idx ON public.vital_alert_rules USING btree (alert_level);


--
-- Name: vital_alert_rules_vital_type_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_alert_rules_vital_type_is_active_idx ON public.vital_alert_rules USING btree (vitalType, isActive);


--
-- Name: vital_readings_alert_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_readings_alert_level_idx ON public.vital_readings USING btree (alert_level);


--
-- Name: vital_readings_blood_pressure_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_readings_blood_pressure_idx ON public.vital_readings USING btree (systolic_value, diastolic_value);


--
-- Name: vital_readings_is_flagged; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_readings_is_flagged ON public.vital_readings USING btree (isFlagged);


--
-- Name: vital_readings_is_validated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_readings_is_validated ON public.vital_readings USING btree (is_validated);


--
-- Name: vital_readings_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_readings_patient_id ON public.vital_readings USING btree (patientId);


--
-- Name: vital_readings_patient_id_vital_type_id_reading_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_readings_patient_id_vital_type_id_reading_time ON public.vital_readings USING btree (patientId, vital_type_id, readingTime);


--
-- Name: vital_readings_reading_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_readings_reading_time ON public.vital_readings USING btree (readingTime);


--
-- Name: vital_readings_vital_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_readings_vital_type_id ON public.vital_readings USING btree (vital_type_id);


--
-- Name: vital_requirements_care_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_requirements_care_plan_id ON public.vitalRequirements USING btree (care_plan_id);


--
-- Name: vital_requirements_frequency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_requirements_frequency ON public.vitalRequirements USING btree (frequency);


--
-- Name: vital_requirements_is_critical; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_requirements_is_critical ON public.vitalRequirements USING btree (is_critical);


--
-- Name: vital_requirements_vital_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_requirements_vital_type_id ON public.vitalRequirements USING btree (vital_type_id);


--
-- Name: vital_types_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vital_types_name ON public.vital_types USING btree (name);


--
-- Name: vital_types_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vital_types_unit ON public.vital_types USING btree (unit);


--
-- Name: vitals_care_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vitals_care_plan_id ON public.vitals USING btree (care_plan_id);


--
-- Name: vitals_vital_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vitals_vital_template_id ON public.vitals USING btree (vital_template_id);


--
-- Name: adherence_records adherence_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adherence_records
    ADD CONSTRAINT adherence_records_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id);


--
-- Name: adherence_records adherence_records_scheduled_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adherence_records
    ADD CONSTRAINT adherence_records_scheduled_event_id_fkey FOREIGN KEY (scheduled_event_id) REFERENCES public.scheduled_events(id);


--
-- Name: appointment_slots appointment_slots_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.users(id);


--
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id);


--
-- Name: appointments appointments_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.appointment_slots(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: audit_logs audit_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: care_plan_templates care_plan_templates_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: care_plan_templates care_plan_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.healthcare_providers(id);


--
-- Name: care_plan_templates care_plan_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: care_plan_templates care_plan_templates_parent_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_parent_template_id_fkey FOREIGN KEY (parent_template_id) REFERENCES public.care_plan_templates(id);


--
-- Name: care_plans care_plans_created_by_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_created_by_doctor_id_fkey FOREIGN KEY (created_by_doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: care_plans care_plans_created_by_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_created_by_hsp_id_fkey FOREIGN KEY (created_by_hsp_id) REFERENCES public.hsps(id);


--
-- Name: care_plans care_plans_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: care_plans care_plans_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clinics clinics_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clinics clinics_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: consultation_notes consultation_notes_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_notes
    ADD CONSTRAINT consultation_notes_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.video_consultations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consultation_notes consultation_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_notes
    ADD CONSTRAINT consultation_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: consultation_prescriptions consultation_prescriptions_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_prescriptions
    ADD CONSTRAINT consultation_prescriptions_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.video_consultations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: doctor_availability doctor_availability_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.users(id);


--
-- Name: doctors doctors_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: doctors doctors_speciality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_speciality_id_fkey FOREIGN KEY (speciality_id) REFERENCES public.specialities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: doctors doctors_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: emergency_alerts emergency_alerts_acknowledged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_alerts
    ADD CONSTRAINT emergency_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: emergency_alerts emergency_alerts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_alerts
    ADD CONSTRAINT emergency_alerts_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: emergency_alerts emergency_alerts_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_alerts
    ADD CONSTRAINT emergency_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: emergency_alerts emergency_alerts_vital_reading_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_alerts
    ADD CONSTRAINT emergency_alerts_vital_reading_id_fkey FOREIGN KEY (vital_reading_id) REFERENCES public.vital_readings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: emergency_contacts emergency_contacts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_contacts
    ADD CONSTRAINT emergency_contacts_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: game_badge_awards game_badge_awards_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_badge_awards
    ADD CONSTRAINT game_badge_awards_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patient_game_profiles(patientId) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: game_challenge_progress game_challenge_progress_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_challenge_progress
    ADD CONSTRAINT game_challenge_progress_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patient_game_profiles(patientId) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: healthcare_providers healthcare_providers_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: healthcare_providers healthcare_providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_user_id_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: healthcare_providers healthcare_providers_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: hsps hsps_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: hsps hsps_supervising_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_supervising_doctor_id_fkey FOREIGN KEY (supervising_doctor_id) REFERENCES public.doctors(id);


--
-- Name: hsps hsps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_user_id_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hsps hsps_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: lab_orders lab_orders_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.video_consultations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lab_orders lab_orders_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_orders lab_orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lab_results lab_results_lab_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_lab_order_id_fkey FOREIGN KEY (lab_order_id) REFERENCES public.lab_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: medication_logs medication_logs_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_logs
    ADD CONSTRAINT medication_logs_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON UPDATE CASCADE;


--
-- Name: medication_logs medication_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_logs
    ADD CONSTRAINT medication_logs_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE;


--
-- Name: medication_safety_alerts medication_safety_alerts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_safety_alerts
    ADD CONSTRAINT medication_safety_alerts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medication_safety_alerts medication_safety_alerts_drug_interaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_safety_alerts
    ADD CONSTRAINT medication_safety_alerts_drug_interaction_id_fkey FOREIGN KEY (drug_interaction_id) REFERENCES public.drug_interactions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medication_safety_alerts medication_safety_alerts_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_safety_alerts
    ADD CONSTRAINT medication_safety_alerts_medication_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medication_safety_alerts medication_safety_alerts_patient_allergy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_safety_alerts
    ADD CONSTRAINT medication_safety_alerts_patient_allergy_id_fkey FOREIGN KEY (patient_allergy_id) REFERENCES public.patient_allergies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medication_safety_alerts medication_safety_alerts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_safety_alerts
    ADD CONSTRAINT medication_safety_alerts_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: medication_safety_alerts medication_safety_alerts_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medication_safety_alerts
    ADD CONSTRAINT medication_safety_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medications medications_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medications medications_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON UPDATE CASCADE;


--
-- Name: notifications notifications_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.doctors(id);


--
-- Name: notifications notifications_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_hsp_id_fkey FOREIGN KEY (hsp_id) REFERENCES public.hsps(id);


--
-- Name: notifications notifications_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: notifications notifications_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_related_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_appointment_id_fkey FOREIGN KEY (related_appointment_id) REFERENCES public.appointments(id);


--
-- Name: notifications notifications_related_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_care_plan_id_fkey FOREIGN KEY (related_care_plan_id) REFERENCES public.care_plans(id);


--
-- Name: notifications notifications_related_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_medication_id_fkey FOREIGN KEY (related_medication_id) REFERENCES public.medications(id);


--
-- Name: notifications notifications_related_treatment_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_treatment_plan_id_fkey FOREIGN KEY (related_treatment_plan_id) REFERENCES public.treatment_plans(id);


--
-- Name: patient_alerts patient_alerts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_alerts
    ADD CONSTRAINT patient_alerts_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE;


--
-- Name: patient_allergies patient_allergies_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_allergies
    ADD CONSTRAINT patient_allergies_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_allergies patient_allergies_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_allergies
    ADD CONSTRAINT patient_allergies_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_consent_otp patient_consent_otp_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_consent_otp
    ADD CONSTRAINT patient_consent_otp_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_consent_otp patient_consent_otp_primary_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_consent_otp
    ADD CONSTRAINT patient_consent_otp_primary_doctor_id_fkey FOREIGN KEY (primary_doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_consent_otp patient_consent_otp_requested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_consent_otp
    ADD CONSTRAINT patient_consent_otp_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_consent_otp patient_consent_otp_secondary_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_consent_otp
    ADD CONSTRAINT patient_consent_otp_secondary_assignment_id_fkey FOREIGN KEY (secondary_assignment_id) REFERENCES public.secondary_doctor_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_consent_otp patient_consent_otp_secondary_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_consent_otp
    ADD CONSTRAINT patient_consent_otp_secondary_doctor_id_fkey FOREIGN KEY (secondary_doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_consent_otp patient_consent_otp_secondary_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_consent_otp
    ADD CONSTRAINT patient_consent_otp_secondary_hsp_id_fkey FOREIGN KEY (secondary_hsp_id) REFERENCES public.hsps(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_doctor_assignments patient_doctor_assignments_assigned_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_assigned_by_admin_id_fkey FOREIGN KEY (assigned_by_admin_id) REFERENCES public.users(id);


--
-- Name: patient_doctor_assignments patient_doctor_assignments_assigned_by_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_assigned_by_doctor_id_fkey FOREIGN KEY (assigned_by_doctor_id) REFERENCES public.doctors(id);


--
-- Name: patient_doctor_assignments patient_doctor_assignments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: patient_doctor_assignments patient_doctor_assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_game_profiles patient_game_profiles_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_game_profiles
    ADD CONSTRAINT patient_game_profiles_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_provider_assignments patient_provider_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_assignments
    ADD CONSTRAINT patient_provider_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: patient_provider_assignments patient_provider_assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_assignments
    ADD CONSTRAINT patient_provider_assignments_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id);


--
-- Name: patient_provider_assignments patient_provider_assignments_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_assignments
    ADD CONSTRAINT patient_provider_assignments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(id);


--
-- Name: patient_provider_consent_history patient_provider_consent_history_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_consent_history
    ADD CONSTRAINT patient_provider_consent_history_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.doctors(id) ON DELETE SET NULL;


--
-- Name: patient_provider_consent_history patient_provider_consent_history_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_consent_history
    ADD CONSTRAINT patient_provider_consent_history_hsp_id_fkey FOREIGN KEY (hsp_id) REFERENCES public.hsps(id) ON DELETE SET NULL;


--
-- Name: patient_provider_consent_history patient_provider_consent_history_new_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_consent_history
    ADD CONSTRAINT patient_provider_consent_history_new_provider_id_fkey FOREIGN KEY (new_provider_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: patient_provider_consent_history patient_provider_consent_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_consent_history
    ADD CONSTRAINT patient_provider_consent_history_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_provider_consent_history patient_provider_consent_history_previous_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_provider_consent_history
    ADD CONSTRAINT patient_provider_consent_history_previous_provider_id_fkey FOREIGN KEY (previous_provider_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: patient_subscriptions patient_subscriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_subscriptions patient_subscriptions_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(id);


--
-- Name: patient_subscriptions patient_subscriptions_service_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_service_plan_id_fkey FOREIGN KEY (service_plan_id) REFERENCES public.service_plans(id);


--
-- Name: patients patients_linked_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_linked_provider_id_fkey FOREIGN KEY (linked_provider_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_primaryCareDoctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_primaryCareDoctorId_fkey FOREIGN KEY (primaryCareDoctorId) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_primary_care_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_primary_care_hsp_id_fkey FOREIGN KEY (primary_care_hsp_id) REFERENCES public.hsps(id);


--
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id);


--
-- Name: payments payments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id);


--
-- Name: payments payments_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(id);


--
-- Name: payments payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.patient_subscriptions(id);


--
-- Name: provider_change_history provider_change_history_new_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_change_history
    ADD CONSTRAINT provider_change_history_new_provider_id_fkey FOREIGN KEY (new_provider_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: provider_change_history provider_change_history_previous_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_change_history
    ADD CONSTRAINT provider_change_history_previous_provider_id_fkey FOREIGN KEY (previous_provider_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: providers providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_user_id_fkey FOREIGN KEY (userId) REFERENCES public.users(id);


--
-- Name: scheduled_events scheduled_events_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_events
    ADD CONSTRAINT scheduled_events_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id);


--
-- Name: scheduled_events scheduled_events_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_events
    ADD CONSTRAINT scheduled_events_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: scheduled_events scheduled_events_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_events
    ADD CONSTRAINT scheduled_events_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id);


--
-- Name: secondary_doctor_assignments secondary_doctor_assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_doctor_assignments
    ADD CONSTRAINT secondary_doctor_assignments_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: secondary_doctor_assignments secondary_doctor_assignments_primary_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_doctor_assignments
    ADD CONSTRAINT secondary_doctor_assignments_primary_doctor_id_fkey FOREIGN KEY (primary_doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: secondary_doctor_assignments secondary_doctor_assignments_primary_doctor_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_doctor_assignments
    ADD CONSTRAINT secondary_doctor_assignments_primary_doctor_provider_id_fkey FOREIGN KEY (primary_doctor_provider_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: secondary_doctor_assignments secondary_doctor_assignments_secondary_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_doctor_assignments
    ADD CONSTRAINT secondary_doctor_assignments_secondary_doctor_id_fkey FOREIGN KEY (secondary_doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: secondary_doctor_assignments secondary_doctor_assignments_secondary_doctor_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_doctor_assignments
    ADD CONSTRAINT secondary_doctor_assignments_secondary_doctor_provider_id_fkey FOREIGN KEY (secondary_doctor_provider_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: secondary_doctor_assignments secondary_doctor_assignments_secondary_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secondary_doctor_assignments
    ADD CONSTRAINT secondary_doctor_assignments_secondary_hsp_id_fkey FOREIGN KEY (secondary_hsp_id) REFERENCES public.hsps(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_plans service_plans_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_plans
    ADD CONSTRAINT service_plans_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: symptoms symptoms_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id);


--
-- Name: symptoms symptoms_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id);


--
-- Name: treatment_plans treatment_plans_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.doctors(id) ON UPDATE CASCADE;


--
-- Name: treatment_plans treatment_plans_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: treatment_plans treatment_plans_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (userId) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_user_identity_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_identity_fkey FOREIGN KEY (user_identity) REFERENCES public.users(id);


--
-- Name: video_consultations video_consultations_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_consultations
    ADD CONSTRAINT video_consultations_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: video_consultations video_consultations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_consultations
    ADD CONSTRAINT video_consultations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: video_consultations video_consultations_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_consultations
    ADD CONSTRAINT video_consultations_doctor_id_fkey FOREIGN KEY (doctorId) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: video_consultations video_consultations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_consultations
    ADD CONSTRAINT video_consultations_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vital_alert_rules vital_alert_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_alert_rules
    ADD CONSTRAINT vital_alert_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vital_readings vital_readings_adherence_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_adherence_record_id_fkey FOREIGN KEY (adherence_record_id) REFERENCES public.adherence_records(id);


--
-- Name: vital_readings vital_readings_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_patient_id_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id) ON UPDATE CASCADE;


--
-- Name: vital_readings vital_readings_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.healthcare_providers(id);


--
-- Name: vital_readings vital_readings_vital_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_vital_type_id_fkey FOREIGN KEY (vital_type_id) REFERENCES public.vital_types(id);


--
-- Name: vitalRequirements vital_requirements_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitalRequirements
    ADD CONSTRAINT vital_requirements_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id);


--
-- Name: vitalRequirements vital_requirements_vital_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitalRequirements
    ADD CONSTRAINT vital_requirements_vital_type_id_fkey FOREIGN KEY (vital_type_id) REFERENCES public.vital_types(id);


--
-- Name: vitals vitals_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id) ON UPDATE CASCADE;


--
-- Name: vitals vitals_vital_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_vital_template_id_fkey FOREIGN KEY (vital_template_id) REFERENCES public.vital_templates(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

