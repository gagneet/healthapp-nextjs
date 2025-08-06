--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

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
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_adherence_records_adherence_type; Type: TYPE; Schema: public; Owner: healthapp_user
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


ALTER TYPE public.enum_adherence_records_adherence_type OWNER TO healthapp_user;

--
-- Name: enum_appointment_slots_slot_type; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_appointment_slots_slot_type AS ENUM (
    'regular',
    'emergency',
    'consultation',
    'follow_up'
);


ALTER TYPE public.enum_appointment_slots_slot_type OWNER TO healthapp_user;

--
-- Name: enum_appointments_organizer_type; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_appointments_organizer_type AS ENUM (
    'doctor',
    'patient',
    'care_taker',
    'hsp',
    'provider',
    'admin'
);


ALTER TYPE public.enum_appointments_organizer_type OWNER TO healthapp_user;

--
-- Name: enum_appointments_participant_one_type; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_appointments_participant_one_type AS ENUM (
    'doctor',
    'patient',
    'hsp'
);


ALTER TYPE public.enum_appointments_participant_one_type OWNER TO healthapp_user;

--
-- Name: enum_appointments_participant_two_type; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_appointments_participant_two_type AS ENUM (
    'doctor',
    'patient',
    'hsp'
);


ALTER TYPE public.enum_appointments_participant_two_type OWNER TO healthapp_user;

--
-- Name: enum_medications_organizer_type; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_medications_organizer_type AS ENUM (
    'doctor',
    'patient',
    'care_taker',
    'hsp',
    'provider',
    'admin'
);


ALTER TYPE public.enum_medications_organizer_type OWNER TO healthapp_user;

--
-- Name: enum_patient_subscriptions_status; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_patient_subscriptions_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
    'TRIALING'
);


ALTER TYPE public.enum_patient_subscriptions_status OWNER TO healthapp_user;

--
-- Name: enum_payment_methods_type; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_payment_methods_type AS ENUM (
    'card',
    'bank_account',
    'paypal'
);


ALTER TYPE public.enum_payment_methods_type OWNER TO healthapp_user;

--
-- Name: enum_payments_payment_method; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_payments_payment_method AS ENUM (
    'card',
    'bank_account',
    'paypal',
    'apple_pay',
    'google_pay'
);


ALTER TYPE public.enum_payments_payment_method OWNER TO healthapp_user;

--
-- Name: enum_payments_status; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_payments_status AS ENUM (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'cancelled',
    'refunded'
);


ALTER TYPE public.enum_payments_status OWNER TO healthapp_user;

--
-- Name: enum_schedule_events_event_type; Type: TYPE; Schema: public; Owner: healthapp_user
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


ALTER TYPE public.enum_schedule_events_event_type OWNER TO healthapp_user;

--
-- Name: enum_schedule_events_status; Type: TYPE; Schema: public; Owner: healthapp_user
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


ALTER TYPE public.enum_schedule_events_status OWNER TO healthapp_user;

--
-- Name: enum_scheduled_events_event_type; Type: TYPE; Schema: public; Owner: healthapp_user
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


ALTER TYPE public.enum_scheduled_events_event_type OWNER TO healthapp_user;

--
-- Name: enum_scheduled_events_priority; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_scheduled_events_priority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public.enum_scheduled_events_priority OWNER TO healthapp_user;

--
-- Name: enum_scheduled_events_status; Type: TYPE; Schema: public; Owner: healthapp_user
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


ALTER TYPE public.enum_scheduled_events_status OWNER TO healthapp_user;

--
-- Name: enum_service_plans_billing_cycle; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_service_plans_billing_cycle AS ENUM (
    'monthly',
    'yearly',
    'one-time',
    'weekly'
);


ALTER TYPE public.enum_service_plans_billing_cycle OWNER TO healthapp_user;

--
-- Name: enum_user_roles_linked_with; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_user_roles_linked_with AS ENUM (
    'doctor',
    'patient',
    'care_taker',
    'hsp',
    'provider',
    'admin'
);


ALTER TYPE public.enum_user_roles_linked_with OWNER TO healthapp_user;

--
-- Name: enum_users_account_status; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_users_account_status AS ENUM (
    'PENDING_VERIFICATION',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'DEACTIVATED'
);


ALTER TYPE public.enum_users_account_status OWNER TO healthapp_user;

--
-- Name: enum_users_gender; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_users_gender AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER',
    'PREFER_NOT_TO_SAY'
);


ALTER TYPE public.enum_users_gender OWNER TO healthapp_user;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: healthapp_user
--

CREATE TYPE public.enum_users_role AS ENUM (
    'SYSTEM_ADMIN',
    'HOSPITAL_ADMIN',
    'DOCTOR',
    'HSP',
    'PATIENT',
    'CAREGIVER'
);


ALTER TYPE public.enum_users_role OWNER TO healthapp_user;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: healthapp_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO healthapp_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO healthapp_user;

--
-- Name: adherence_records; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.adherence_records (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    scheduled_event_id uuid,
    adherence_type public.enum_adherence_records_adherence_type NOT NULL,
    due_at timestamp with time zone NOT NULL,
    recorded_at timestamp with time zone,
    is_completed boolean DEFAULT false,
    is_partial boolean DEFAULT false,
    is_missed boolean DEFAULT false,
    response_data jsonb DEFAULT '{}'::jsonb,
    notes text,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.adherence_records OWNER TO healthapp_user;

--
-- Name: appointment_slots; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.appointment_slots (
    id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    max_appointments integer DEFAULT 1,
    booked_appointments integer DEFAULT 0,
    is_available boolean DEFAULT true,
    slot_type public.enum_appointment_slots_slot_type DEFAULT 'regular'::public.enum_appointment_slots_slot_type,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.appointment_slots OWNER TO healthapp_user;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: healthapp_user
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
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    rr_rule character varying(1000),
    details json,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    doctor_id uuid,
    hsp_id uuid,
    patient_id uuid,
    slot_id uuid
);


ALTER TABLE public.appointments OWNER TO healthapp_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid,
    user_role character varying(50),
    organization_id uuid,
    action character varying(10) NOT NULL,
    resource character varying(500) NOT NULL,
    patient_id uuid,
    phi_accessed boolean DEFAULT false,
    access_granted boolean NOT NULL,
    denial_reason text,
    ip_address inet,
    user_agent text,
    session_id character varying(255),
    request_id uuid,
    data_changes jsonb,
    encrypted_data jsonb,
    risk_level character varying(10) DEFAULT 'low'::character varying,
    security_alerts jsonb DEFAULT '[]'::jsonb,
    retention_date timestamp with time zone,
    "timestamp" timestamp with time zone NOT NULL,
    created_at timestamp with time zone
);


ALTER TABLE public.audit_logs OWNER TO healthapp_user;

--
-- Name: COLUMN audit_logs.user_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action';


--
-- Name: COLUMN audit_logs.user_role; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.user_role IS 'Role of the user at time of access';


--
-- Name: COLUMN audit_logs.action; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.action IS 'HTTP method (GET, POST, PUT, DELETE)';


--
-- Name: COLUMN audit_logs.resource; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.resource IS 'URL path of the accessed resource';


--
-- Name: COLUMN audit_logs.patient_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.patient_id IS 'Patient whose data was accessed';


--
-- Name: COLUMN audit_logs.phi_accessed; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.phi_accessed IS 'Whether PHI (Protected Health Information) was accessed';


--
-- Name: COLUMN audit_logs.access_granted; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.access_granted IS 'Whether access was granted or denied';


--
-- Name: COLUMN audit_logs.denial_reason; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.denial_reason IS 'Reason for access denial';


--
-- Name: COLUMN audit_logs.ip_address; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the request';


--
-- Name: COLUMN audit_logs.user_agent; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.user_agent IS 'Browser/client user agent';


--
-- Name: COLUMN audit_logs.session_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.session_id IS 'Session identifier';


--
-- Name: COLUMN audit_logs.request_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.request_id IS 'Unique request identifier';


--
-- Name: COLUMN audit_logs.data_changes; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.data_changes IS 'What data was changed (before/after values)';


--
-- Name: COLUMN audit_logs.encrypted_data; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.encrypted_data IS 'Encrypted sensitive audit information';


--
-- Name: COLUMN audit_logs.security_alerts; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.security_alerts IS 'Any security alerts triggered by this access';


--
-- Name: COLUMN audit_logs.retention_date; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs.retention_date IS 'When this audit entry can be archived (HIPAA: 6 years)';


--
-- Name: COLUMN audit_logs."timestamp"; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.audit_logs."timestamp" IS 'When the audited action occurred';


--
-- Name: care_plan_templates; Type: TABLE; Schema: public; Owner: healthapp_user
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
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.care_plan_templates OWNER TO healthapp_user;

--
-- Name: care_plans; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.care_plans (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
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
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    review_frequency_months integer DEFAULT 3,
    next_review_date timestamp with time zone,
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
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    doctor_id uuid,
    provider_id uuid
);


ALTER TABLE public.care_plans OWNER TO healthapp_user;

--
-- Name: COLUMN care_plans.title; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.title IS 'Title of the long-term care plan';


--
-- Name: COLUMN care_plans.description; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.description IS 'Detailed description of the care plan';


--
-- Name: COLUMN care_plans.plan_type; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.plan_type IS 'Always care_plan for this model';


--
-- Name: COLUMN care_plans.chronic_conditions; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.chronic_conditions IS 'Chronic conditions being managed (diabetes, hypertension, etc.)';


--
-- Name: COLUMN care_plans.condition_severity; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.condition_severity IS 'Severity levels for each chronic condition';


--
-- Name: COLUMN care_plans.risk_factors; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.risk_factors IS 'Risk factors for condition progression';


--
-- Name: COLUMN care_plans.long_term_goals; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.long_term_goals IS 'Long-term health objectives (6 months to years)';


--
-- Name: COLUMN care_plans.short_term_milestones; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.short_term_milestones IS 'Short-term milestones toward long-term goals';


--
-- Name: COLUMN care_plans.interventions; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.interventions IS 'Ongoing interventions and treatments';


--
-- Name: COLUMN care_plans.lifestyle_modifications; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.lifestyle_modifications IS 'Diet, exercise, lifestyle changes';


--
-- Name: COLUMN care_plans.monitoring_parameters; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.monitoring_parameters IS 'Vital signs, lab values to monitor regularly';


--
-- Name: COLUMN care_plans.monitoring_frequency; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.monitoring_frequency IS 'How often to monitor each parameter';


--
-- Name: COLUMN care_plans.target_values; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.target_values IS 'Target values for monitored parameters';


--
-- Name: COLUMN care_plans.medications; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.medications IS 'Long-term medications for chronic conditions';


--
-- Name: COLUMN care_plans.medication_management; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.medication_management IS 'Medication adherence strategies and monitoring';


--
-- Name: COLUMN care_plans.end_date; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.end_date IS 'May be open-ended for chronic conditions';


--
-- Name: COLUMN care_plans.review_frequency_months; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.review_frequency_months IS 'How often to review the care plan (in months)';


--
-- Name: COLUMN care_plans.primary_care_manager_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.primary_care_manager_id IS 'Primary care coordinator (can be doctor or HSP)';


--
-- Name: COLUMN care_plans.care_team_members; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.care_team_members IS 'List of care team members and their roles';


--
-- Name: COLUMN care_plans.specialist_referrals; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.specialist_referrals IS 'Specialist consultations and referrals';


--
-- Name: COLUMN care_plans.patient_education_materials; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.patient_education_materials IS 'Educational resources provided to patient';


--
-- Name: COLUMN care_plans.self_management_tasks; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.self_management_tasks IS 'Tasks patient needs to perform';


--
-- Name: COLUMN care_plans.patient_goals; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.patient_goals IS 'Goals set by the patient themselves';


--
-- Name: COLUMN care_plans.progress_notes; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.progress_notes IS 'Ongoing progress documentation';


--
-- Name: COLUMN care_plans.outcome_measures; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.outcome_measures IS 'Measurable outcomes and improvements';


--
-- Name: COLUMN care_plans.quality_of_life_scores; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.quality_of_life_scores IS 'Quality of life assessments over time';


--
-- Name: COLUMN care_plans.emergency_action_plan; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.emergency_action_plan IS 'What to do in case of emergency or exacerbation';


--
-- Name: COLUMN care_plans.warning_signs; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.warning_signs IS 'Signs that indicate condition is worsening';


--
-- Name: COLUMN care_plans.emergency_contacts; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.emergency_contacts IS 'Emergency contacts for this care plan';


--
-- Name: COLUMN care_plans.details; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.details IS 'Legacy field for existing data';


--
-- Name: COLUMN care_plans.channel_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.care_plans.channel_id IS 'Legacy communication channel ID';


--
-- Name: clinics; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.clinics (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    doctor_id uuid NOT NULL,
    organization_id uuid,
    address jsonb DEFAULT '{}'::jsonb NOT NULL,
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
    is_active boolean DEFAULT true NOT NULL,
    registration_number character varying(100),
    established_year integer,
    facilities jsonb DEFAULT '[]'::jsonb,
    insurance_accepted text[] DEFAULT ARRAY[]::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.clinics OWNER TO healthapp_user;

--
-- Name: COLUMN clinics.address; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.clinics.address IS 'Complete address with geo-location data';


--
-- Name: COLUMN clinics.operating_hours; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.clinics.operating_hours IS 'Weekly schedule with timings for each day';


--
-- Name: COLUMN clinics.clinic_images; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.clinics.clinic_images IS 'Array of image URLs for clinic photos';


--
-- Name: COLUMN clinics.banner_image; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.clinics.banner_image IS 'Main banner image for the clinic';


--
-- Name: COLUMN clinics.is_primary; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.clinics.is_primary IS 'Indicates if this is the doctors primary clinic';


--
-- Name: COLUMN clinics.registration_number; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.clinics.registration_number IS 'Clinic registration number with local authorities';


--
-- Name: COLUMN clinics.facilities; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.clinics.facilities IS 'List of facilities available at the clinic';


--
-- Name: doctor_availability; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.doctor_availability (
    id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    slot_duration integer DEFAULT 30,
    max_appointments_per_slot integer DEFAULT 1,
    break_start_time time without time zone,
    break_end_time time without time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.doctor_availability OWNER TO healthapp_user;

--
-- Name: doctors; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.doctors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
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
    verification_date timestamp with time zone,
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
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
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


ALTER TABLE public.doctors OWNER TO healthapp_user;

--
-- Name: COLUMN doctors.medical_license_number; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.medical_license_number IS 'State medical license number';


--
-- Name: COLUMN doctors.npi_number; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.npi_number IS 'National Provider Identifier';


--
-- Name: COLUMN doctors.board_certifications; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.board_certifications IS 'Board certification specialties';


--
-- Name: COLUMN doctors.medical_school; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.medical_school IS 'Medical school attended';


--
-- Name: COLUMN doctors.residency_programs; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.residency_programs IS 'Residency and fellowship programs completed';


--
-- Name: COLUMN doctors.specialties; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.specialties IS 'Primary medical specialties';


--
-- Name: COLUMN doctors.sub_specialties; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.sub_specialties IS 'Sub-specialties';


--
-- Name: COLUMN doctors.capabilities; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.capabilities IS 'What this doctor is authorized to do';


--
-- Name: COLUMN doctors.is_verified; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.is_verified IS 'Whether medical credentials are verified';


--
-- Name: COLUMN doctors.verification_documents; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.verification_documents IS 'Medical license and certification verification';


--
-- Name: COLUMN doctors.languages_spoken; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.languages_spoken IS 'Languages the doctor can communicate in';


--
-- Name: COLUMN doctors.signature_pic; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.signature_pic IS 'Digital signature for prescriptions';


--
-- Name: COLUMN doctors.profile_picture_url; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.profile_picture_url IS 'URL to doctor profile picture';


--
-- Name: COLUMN doctors.banner_image_url; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.banner_image_url IS 'URL to clinic/practice banner image';


--
-- Name: COLUMN doctors.qualification_details; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.qualification_details IS 'Detailed qualification information including degrees, universities, years';


--
-- Name: COLUMN doctors.registration_details; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.registration_details IS 'Medical registration details with councils and authorities';


--
-- Name: COLUMN doctors.subscription_details; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.subscription_details IS 'Payment gateway and subscription account details';


--
-- Name: COLUMN doctors.signature_image_url; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.signature_image_url IS 'URL to uploaded signature image';


--
-- Name: COLUMN doctors.signature_data; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.signature_data IS 'Digital signature data (base64 encoded)';


--
-- Name: COLUMN doctors.gender; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.gender IS 'Doctor gender for profile display';


--
-- Name: COLUMN doctors.mobile_number; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.doctors.mobile_number IS 'Doctor mobile number (can be different from user phone)';


--
-- Name: healthcare_providers; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.healthcare_providers (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid,
    license_number character varying(100),
    specialties text[] DEFAULT ARRAY[]::text[],
    sub_specialties text[] DEFAULT ARRAY[]::text[],
    qualifications jsonb DEFAULT '[]'::jsonb,
    years_of_experience integer,
    is_verified boolean DEFAULT false,
    verification_documents jsonb DEFAULT '[]'::jsonb,
    verification_date timestamp with time zone,
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
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.healthcare_providers OWNER TO healthapp_user;

--
-- Name: COLUMN healthcare_providers.specialties; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.healthcare_providers.specialties IS 'Array of medical specialties';


--
-- Name: COLUMN healthcare_providers.sub_specialties; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.healthcare_providers.sub_specialties IS 'Array of sub-specialties';


--
-- Name: COLUMN healthcare_providers.qualifications; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.healthcare_providers.qualifications IS 'Educational qualifications and certifications';


--
-- Name: COLUMN healthcare_providers.is_verified; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.healthcare_providers.is_verified IS 'Whether provider credentials are verified';


--
-- Name: COLUMN healthcare_providers.verification_documents; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.healthcare_providers.verification_documents IS 'Verification documents and their status';


--
-- Name: COLUMN healthcare_providers.verification_date; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.healthcare_providers.verification_date IS 'When verification was completed';


--
-- Name: COLUMN healthcare_providers.verified_by; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.healthcare_providers.verified_by IS 'Who verified this provider';


--
-- Name: COLUMN healthcare_providers.availability_schedule; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.healthcare_providers.availability_schedule IS 'Weekly availability schedule';


--
-- Name: hsps; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.hsps (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
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
    verification_date timestamp with time zone,
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
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.hsps OWNER TO healthapp_user;

--
-- Name: COLUMN hsps.hsp_type; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.hsp_type IS 'Type of Healthcare Support Personnel';


--
-- Name: COLUMN hsps.license_number; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.license_number IS 'Professional license number (RN, LPN, etc.)';


--
-- Name: COLUMN hsps.certification_number; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.certification_number IS 'Certification number for specific HSP type';


--
-- Name: COLUMN hsps.certifications; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.certifications IS 'Professional certifications (CPR, ACLS, etc.)';


--
-- Name: COLUMN hsps.education; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.education IS 'Educational background and degrees';


--
-- Name: COLUMN hsps.specializations; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.specializations IS 'Areas of specialization within HSP role';


--
-- Name: COLUMN hsps.capabilities; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.capabilities IS 'What this HSP is authorized to do based on their type';


--
-- Name: COLUMN hsps.requires_supervision; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.requires_supervision IS 'Whether this HSP requires physician supervision';


--
-- Name: COLUMN hsps.supervising_doctor_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.supervising_doctor_id IS 'Doctor supervising this HSP';


--
-- Name: COLUMN hsps.supervision_level; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.supervision_level IS 'Level of supervision required';


--
-- Name: COLUMN hsps.is_verified; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.is_verified IS 'Whether credentials are verified';


--
-- Name: COLUMN hsps.verification_documents; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.verification_documents IS 'License and certification verification';


--
-- Name: COLUMN hsps.hourly_rate; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.hourly_rate IS 'Hourly compensation rate';


--
-- Name: COLUMN hsps.languages_spoken; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.languages_spoken IS 'Languages the HSP can communicate in';


--
-- Name: COLUMN hsps.departments; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.hsps.departments IS 'Hospital departments or units where HSP works';


--
-- Name: medications; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.medications (
    id uuid NOT NULL,
    participant_id uuid NOT NULL,
    organizer_type public.enum_medications_organizer_type,
    organizer_id uuid NOT NULL,
    medicine_id uuid NOT NULL,
    description character varying(1000),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    rr_rule character varying(1000),
    details json,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.medications OWNER TO healthapp_user;

--
-- Name: medicines; Type: TABLE; Schema: public; Owner: healthapp_user
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
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.medicines OWNER TO healthapp_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    patient_id uuid,
    doctor_id uuid,
    hsp_id uuid,
    organization_id uuid,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying,
    is_urgent boolean DEFAULT false,
    channels character varying(255)[] DEFAULT ARRAY['PUSH'::character varying(255)],
    scheduled_for timestamp with time zone,
    expires_at timestamp with time zone,
    status character varying(20) DEFAULT 'pending'::character varying,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    delivery_attempts integer DEFAULT 0,
    delivery_log jsonb DEFAULT '[]'::jsonb,
    read_at timestamp with time zone,
    acknowledged_at timestamp with time zone,
    related_appointment_id uuid,
    related_medication_id uuid,
    related_care_plan_id uuid,
    related_treatment_plan_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    requires_action boolean DEFAULT false,
    action_url character varying(500),
    action_taken boolean DEFAULT false,
    action_taken_at timestamp with time zone,
    template_id character varying(100),
    personalization_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    recipient_id uuid
);


ALTER TABLE public.notifications OWNER TO healthapp_user;

--
-- Name: COLUMN notifications.title; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.title IS 'Notification title/subject';


--
-- Name: COLUMN notifications.message; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.message IS 'Notification content';


--
-- Name: COLUMN notifications.is_urgent; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.is_urgent IS 'Whether this is an urgent notification';


--
-- Name: COLUMN notifications.scheduled_for; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.scheduled_for IS 'When to send the notification (null = send immediately)';


--
-- Name: COLUMN notifications.expires_at; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.expires_at IS 'When this notification expires and should not be sent';


--
-- Name: COLUMN notifications.delivery_log; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.delivery_log IS 'Log of delivery attempts and results';


--
-- Name: COLUMN notifications.read_at; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.read_at IS 'When the notification was read';


--
-- Name: COLUMN notifications.acknowledged_at; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.acknowledged_at IS 'When the notification was acknowledged';


--
-- Name: COLUMN notifications.metadata; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.metadata IS 'Additional notification-specific data';


--
-- Name: COLUMN notifications.requires_action; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.requires_action IS 'Whether this notification requires user action';


--
-- Name: COLUMN notifications.action_url; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.action_url IS 'URL for action if required';


--
-- Name: COLUMN notifications.template_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.template_id IS 'Template used for this notification';


--
-- Name: COLUMN notifications.personalization_data; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.notifications.personalization_data IS 'Data used to personalize the notification';


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.organizations (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) DEFAULT 'clinic'::character varying,
    license_number character varying(100),
    contact_info jsonb DEFAULT '{}'::jsonb,
    address jsonb DEFAULT '{}'::jsonb,
    settings jsonb DEFAULT '{"timezone": "UTC", "working_hours": {"friday": {"end": "17:00", "start": "09:00"}, "monday": {"end": "17:00", "start": "09:00"}, "sunday": {"closed": true}, "tuesday": {"end": "17:00", "start": "09:00"}, "saturday": {"end": "13:00", "start": "09:00"}, "thursday": {"end": "17:00", "start": "09:00"}, "wednesday": {"end": "17:00", "start": "09:00"}}, "notification_preferences": {"sms_enabled": false, "push_enabled": true, "email_enabled": true}}'::jsonb,
    is_active boolean DEFAULT true,
    hipaa_covered_entity boolean DEFAULT true,
    business_associate_agreement jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.organizations OWNER TO healthapp_user;

--
-- Name: COLUMN organizations.hipaa_covered_entity; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.organizations.hipaa_covered_entity IS 'Whether this organization is a HIPAA covered entity';


--
-- Name: COLUMN organizations.business_associate_agreement; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.organizations.business_associate_agreement IS 'BAA details if this organization is a business associate';


--
-- Name: patient_doctor_assignments; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.patient_doctor_assignments (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    assignment_type character varying(50) NOT NULL,
    permissions jsonb DEFAULT '{"can_prescribe": false, "can_order_tests": false, "can_view_patient": true, "can_create_care_plans": false, "can_modify_care_plans": false, "can_access_full_history": false}'::jsonb,
    specialty_focus text[] DEFAULT ARRAY[]::text[],
    care_plan_ids uuid[] DEFAULT ARRAY[]::uuid[],
    assigned_by_doctor_id uuid,
    assigned_by_admin_id uuid,
    patient_consent_required boolean DEFAULT false,
    patient_consent_status character varying(20) DEFAULT 'not_required'::character varying,
    consent_method character varying(20),
    consent_otp character varying(10),
    consent_otp_expires_at timestamp with time zone,
    consent_granted_at timestamp with time zone,
    assignment_start_date timestamp with time zone,
    assignment_end_date timestamp with time zone,
    is_active boolean DEFAULT true,
    assignment_reason text,
    notes text,
    requires_same_organization boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.patient_doctor_assignments OWNER TO healthapp_user;

--
-- Name: COLUMN patient_doctor_assignments.assignment_type; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.assignment_type IS 'Primary: Original doctor, Specialist: For specific care plans, Substitute: Same provider coverage, Transferred: Full transfer with consent';


--
-- Name: COLUMN patient_doctor_assignments.permissions; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.permissions IS 'Granular permissions for this doctor-patient relationship';


--
-- Name: COLUMN patient_doctor_assignments.specialty_focus; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.specialty_focus IS 'Specific specialties/conditions this assignment covers';


--
-- Name: COLUMN patient_doctor_assignments.care_plan_ids; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.care_plan_ids IS 'Specific care plans this doctor is responsible for';


--
-- Name: COLUMN patient_doctor_assignments.assigned_by_doctor_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.assigned_by_doctor_id IS 'Doctor who made this assignment';


--
-- Name: COLUMN patient_doctor_assignments.assigned_by_admin_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.assigned_by_admin_id IS 'Provider admin who made this assignment';


--
-- Name: COLUMN patient_doctor_assignments.patient_consent_required; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.patient_consent_required IS 'Whether patient consent is required for this assignment';


--
-- Name: COLUMN patient_doctor_assignments.consent_otp; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.consent_otp IS 'OTP for consent verification';


--
-- Name: COLUMN patient_doctor_assignments.assignment_end_date; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.assignment_end_date IS 'Optional end date for temporary assignments';


--
-- Name: COLUMN patient_doctor_assignments.assignment_reason; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.assignment_reason IS 'Reason for this doctor assignment';


--
-- Name: COLUMN patient_doctor_assignments.requires_same_organization; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patient_doctor_assignments.requires_same_organization IS 'Whether this assignment requires doctors to be in same organization';


--
-- Name: patient_provider_assignments; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.patient_provider_assignments (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    role character varying(50) DEFAULT 'primary'::character varying,
    assigned_at timestamp with time zone,
    assigned_by uuid,
    ended_at timestamp with time zone,
    notes text
);


ALTER TABLE public.patient_provider_assignments OWNER TO healthapp_user;

--
-- Name: patient_subscriptions; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.patient_subscriptions (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
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
    last_payment_date timestamp with time zone,
    last_payment_amount numeric(10,2),
    failure_count integer DEFAULT 0,
    metadata json DEFAULT '{}'::json,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    cancelled_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.patient_subscriptions OWNER TO healthapp_user;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.patients (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid,
    medical_record_number character varying(50),
    patient_id character varying(100),
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
    primary_care_doctor_id uuid,
    primary_care_hsp_id uuid,
    care_coordinator_id uuid,
    care_coordinator_type character varying(10),
    overall_adherence_score numeric(5,2),
    last_adherence_calculation timestamp with time zone,
    total_appointments integer DEFAULT 0,
    missed_appointments integer DEFAULT 0,
    last_visit_date timestamp with time zone,
    next_appointment_date timestamp with time zone,
    is_active boolean DEFAULT true,
    requires_interpreter boolean DEFAULT false,
    has_mobility_issues boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.patients OWNER TO healthapp_user;

--
-- Name: COLUMN patients.medical_record_number; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.medical_record_number IS 'Organization-specific patient identifier';


--
-- Name: COLUMN patients.patient_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.patient_id IS 'Custom patient identifier - supports any format (numbers, alphanumeric, structured)';


--
-- Name: COLUMN patients.emergency_contacts; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.emergency_contacts IS 'Array of emergency contact objects';


--
-- Name: COLUMN patients.insurance_information; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.insurance_information IS 'Insurance details and coverage information';


--
-- Name: COLUMN patients.medical_history; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.medical_history IS 'Past medical conditions and treatments';


--
-- Name: COLUMN patients.allergies; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.allergies IS 'Known allergies and reactions';


--
-- Name: COLUMN patients.current_medications; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.current_medications IS 'Current medications from external sources';


--
-- Name: COLUMN patients.height_cm; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.height_cm IS 'Height in centimeters';


--
-- Name: COLUMN patients.weight_kg; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.weight_kg IS 'Weight in kilograms';


--
-- Name: COLUMN patients.primary_language; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.primary_language IS 'Primary language for communication';


--
-- Name: COLUMN patients.risk_factors; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.risk_factors IS 'Clinical risk factors';


--
-- Name: COLUMN patients.primary_care_doctor_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.primary_care_doctor_id IS 'Primary care physician';


--
-- Name: COLUMN patients.primary_care_hsp_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.primary_care_hsp_id IS 'Primary HSP (if no doctor assigned)';


--
-- Name: COLUMN patients.care_coordinator_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.care_coordinator_id IS 'Care coordinator (can be doctor or HSP)';


--
-- Name: COLUMN patients.care_coordinator_type; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.care_coordinator_type IS 'Type of care coordinator';


--
-- Name: COLUMN patients.overall_adherence_score; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.overall_adherence_score IS 'Overall medication adherence percentage';


--
-- Name: COLUMN patients.last_adherence_calculation; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.patients.last_adherence_calculation IS 'When adherence score was last calculated';


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.payment_methods (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    stripe_payment_method_id character varying(255) NOT NULL,
    type public.enum_payment_methods_type NOT NULL,
    card_brand character varying(50),
    card_last4 character varying(4),
    card_exp_month integer,
    card_exp_year integer,
    bank_name character varying(100),
    bank_last4 character varying(4),
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    billing_address json,
    metadata json DEFAULT '{}'::json,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.payment_methods OWNER TO healthapp_user;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    subscription_id uuid NOT NULL,
    patient_id uuid NOT NULL,
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
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    processed_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.payments OWNER TO healthapp_user;

--
-- Name: providers; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.providers (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    address character varying(255),
    city character varying(255),
    state character varying(255),
    activated_on timestamp with time zone,
    details json,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.providers OWNER TO healthapp_user;

--
-- Name: schedule_events; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.schedule_events (
    id uuid NOT NULL,
    critical boolean,
    event_type public.enum_schedule_events_event_type,
    event_id uuid,
    details json,
    status public.enum_schedule_events_status DEFAULT 'pending'::public.enum_schedule_events_status NOT NULL,
    date date,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.schedule_events OWNER TO healthapp_user;

--
-- Name: scheduled_events; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.scheduled_events (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    care_plan_id uuid,
    event_type public.enum_scheduled_events_event_type NOT NULL,
    event_id uuid,
    title character varying(255) NOT NULL,
    description text,
    scheduled_for timestamp with time zone NOT NULL,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    status public.enum_scheduled_events_status DEFAULT 'SCHEDULED'::public.enum_scheduled_events_status,
    priority public.enum_scheduled_events_priority DEFAULT 'MEDIUM'::public.enum_scheduled_events_priority,
    event_data jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp with time zone,
    completed_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.scheduled_events OWNER TO healthapp_user;

--
-- Name: service_plans; Type: TABLE; Schema: public; Owner: healthapp_user
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
    is_active boolean DEFAULT true,
    stripe_price_id character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.service_plans OWNER TO healthapp_user;

--
-- Name: specialities; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.specialities (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(1000),
    user_created integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.specialities OWNER TO healthapp_user;

--
-- Name: specialities_id_seq; Type: SEQUENCE; Schema: public; Owner: healthapp_user
--

CREATE SEQUENCE public.specialities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.specialities_id_seq OWNER TO healthapp_user;

--
-- Name: specialities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: healthapp_user
--

ALTER SEQUENCE public.specialities_id_seq OWNED BY public.specialities.id;


--
-- Name: symptoms; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.symptoms (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    care_plan_id uuid,
    symptom_name character varying(255) NOT NULL,
    severity integer,
    description text,
    body_location jsonb DEFAULT '{}'::jsonb,
    onset_time timestamp with time zone,
    recorded_at timestamp with time zone,
    triggers jsonb DEFAULT '[]'::jsonb,
    relieving_factors jsonb DEFAULT '[]'::jsonb,
    associated_symptoms jsonb DEFAULT '[]'::jsonb,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.symptoms OWNER TO healthapp_user;

--
-- Name: symptoms_database; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.symptoms_database (
    id uuid NOT NULL,
    diagnosis_name character varying(255) NOT NULL,
    symptoms jsonb DEFAULT '{}'::jsonb,
    category character varying(100),
    severity_indicators jsonb DEFAULT '{}'::jsonb,
    common_age_groups jsonb DEFAULT '[]'::jsonb,
    gender_specific character varying(20),
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.symptoms_database OWNER TO healthapp_user;

--
-- Name: COLUMN symptoms_database.diagnosis_name; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.symptoms_database.diagnosis_name IS 'Primary diagnosis name';


--
-- Name: COLUMN symptoms_database.symptoms; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.symptoms_database.symptoms IS 'Object with symptom names as keys and boolean values';


--
-- Name: COLUMN symptoms_database.category; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.symptoms_database.category IS 'Medical category (Cardiology, Neurology, etc.)';


--
-- Name: COLUMN symptoms_database.severity_indicators; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.symptoms_database.severity_indicators IS 'Symptoms that indicate severity levels';


--
-- Name: COLUMN symptoms_database.common_age_groups; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.symptoms_database.common_age_groups IS 'Age groups commonly affected';


--
-- Name: COLUMN symptoms_database.gender_specific; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.symptoms_database.gender_specific IS 'Gender specificity if applicable';


--
-- Name: COLUMN symptoms_database.created_by; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.symptoms_database.created_by IS 'Doctor/HSP who added this diagnosis';


--
-- Name: treatment_database; Type: TABLE; Schema: public; Owner: healthapp_user
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
    is_active boolean DEFAULT true,
    requires_specialist boolean DEFAULT false,
    prescription_required boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.treatment_database OWNER TO healthapp_user;

--
-- Name: COLUMN treatment_database.treatment_name; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.treatment_name IS 'Name of the treatment';


--
-- Name: COLUMN treatment_database.treatment_type; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.treatment_type IS 'Type of treatment';


--
-- Name: COLUMN treatment_database.description; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.description IS 'Detailed description of the treatment';


--
-- Name: COLUMN treatment_database.applicable_conditions; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.applicable_conditions IS 'Array of conditions this treatment applies to';


--
-- Name: COLUMN treatment_database.duration; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.duration IS 'Expected duration of treatment';


--
-- Name: COLUMN treatment_database.frequency; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.frequency IS 'How often the treatment should be administered';


--
-- Name: COLUMN treatment_database.dosage_info; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.dosage_info IS 'Dosage information if applicable';


--
-- Name: COLUMN treatment_database.category; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.category IS 'Medical category (Cardiology, Neurology, etc.)';


--
-- Name: COLUMN treatment_database.severity_level; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.severity_level IS 'Appropriate severity level for this treatment';


--
-- Name: COLUMN treatment_database.age_restrictions; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.age_restrictions IS 'Age restrictions or recommendations';


--
-- Name: COLUMN treatment_database.contraindications; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.contraindications IS 'When this treatment should not be used';


--
-- Name: COLUMN treatment_database.side_effects; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.side_effects IS 'Potential side effects';


--
-- Name: COLUMN treatment_database.monitoring_required; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.monitoring_required IS 'What needs to be monitored during treatment';


--
-- Name: COLUMN treatment_database.requires_specialist; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.requires_specialist IS 'Whether this treatment requires a specialist';


--
-- Name: COLUMN treatment_database.prescription_required; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.prescription_required IS 'Whether this treatment requires a prescription';


--
-- Name: COLUMN treatment_database.created_by; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_database.created_by IS 'Doctor/HSP who added this treatment';


--
-- Name: treatment_plans; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.treatment_plans (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
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
    start_date timestamp with time zone NOT NULL,
    expected_duration_days integer,
    end_date timestamp with time zone,
    follow_up_required boolean DEFAULT true,
    follow_up_date timestamp with time zone,
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
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.treatment_plans OWNER TO healthapp_user;

--
-- Name: COLUMN treatment_plans.doctor_id; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.doctor_id IS 'Only doctors can create treatment plans';


--
-- Name: COLUMN treatment_plans.title; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.title IS 'Brief title of the treatment plan';


--
-- Name: COLUMN treatment_plans.description; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.description IS 'Detailed description of the treatment plan';


--
-- Name: COLUMN treatment_plans.plan_type; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.plan_type IS 'Always treatment_plan for this model';


--
-- Name: COLUMN treatment_plans.primary_diagnosis; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.primary_diagnosis IS 'Primary diagnosis being treated';


--
-- Name: COLUMN treatment_plans.secondary_diagnoses; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.secondary_diagnoses IS 'Additional diagnoses';


--
-- Name: COLUMN treatment_plans.chief_complaint; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.chief_complaint IS 'Patient''s primary complaint';


--
-- Name: COLUMN treatment_plans.symptoms; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.symptoms IS 'List of symptoms being addressed';


--
-- Name: COLUMN treatment_plans.treatment_goals; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.treatment_goals IS 'Short-term treatment objectives';


--
-- Name: COLUMN treatment_plans.interventions; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.interventions IS 'Medical interventions and procedures';


--
-- Name: COLUMN treatment_plans.medications; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.medications IS 'Prescribed medications for this treatment';


--
-- Name: COLUMN treatment_plans.instructions; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.instructions IS 'Patient instructions and care guidance';


--
-- Name: COLUMN treatment_plans.expected_duration_days; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.expected_duration_days IS 'Expected treatment duration in days';


--
-- Name: COLUMN treatment_plans.end_date; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.end_date IS 'Planned or actual end date';


--
-- Name: COLUMN treatment_plans.follow_up_date; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.follow_up_date IS 'Scheduled follow-up appointment';


--
-- Name: COLUMN treatment_plans.progress_notes; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.progress_notes IS 'Progress updates and notes';


--
-- Name: COLUMN treatment_plans.outcome; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.outcome IS 'Treatment outcome and results';


--
-- Name: COLUMN treatment_plans.emergency_contacts; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.emergency_contacts IS 'Emergency contacts specific to this treatment';


--
-- Name: COLUMN treatment_plans.warning_signs; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.warning_signs IS 'Warning signs to watch for';


--
-- Name: COLUMN treatment_plans.assigned_hsps; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.assigned_hsps IS 'HSPs assigned to assist with this treatment';


--
-- Name: COLUMN treatment_plans.care_team_notes; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.treatment_plans.care_team_notes IS 'Notes from care team members';


--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.user_devices (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    device_type character varying(50) NOT NULL,
    push_token character varying(500) NOT NULL,
    device_id character varying(255),
    is_active boolean DEFAULT true,
    notification_settings jsonb DEFAULT '{"vitals": true, "symptoms": true, "emergency": true, "reminders": true, "medications": true, "appointments": true}'::jsonb,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_devices OWNER TO healthapp_user;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.user_roles (
    id uuid NOT NULL,
    user_identity uuid NOT NULL,
    linked_with public.enum_user_roles_linked_with,
    linked_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.user_roles OWNER TO healthapp_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: healthapp_user
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
    password_reset_expires timestamp with time zone,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying(255),
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    profile_picture_url character varying(500),
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    locale character varying(10) DEFAULT 'en'::character varying,
    preferences jsonb DEFAULT '{"privacy": {"profile_visible": true, "share_data_for_research": false}, "accessibility": {"large_text": false, "high_contrast": false}, "notifications": {"sms": false, "push": true, "email": true}}'::jsonb,
    terms_accepted_at timestamp with time zone,
    privacy_policy_accepted_at timestamp with time zone,
    hipaa_consent_date timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    organization_id uuid,
    full_name character varying(255)
);


ALTER TABLE public.users OWNER TO healthapp_user;

--
-- Name: COLUMN users.terms_accepted_at; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.users.terms_accepted_at IS 'When user accepted terms of service';


--
-- Name: COLUMN users.privacy_policy_accepted_at; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.users.privacy_policy_accepted_at IS 'When user accepted privacy policy';


--
-- Name: COLUMN users.hipaa_consent_date; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.users.hipaa_consent_date IS 'When user provided HIPAA consent';


--
-- Name: COLUMN users.full_name; Type: COMMENT; Schema: public; Owner: healthapp_user
--

COMMENT ON COLUMN public.users.full_name IS 'Complete name as entered by user';


--
-- Name: v_active_care_plans; Type: VIEW; Schema: public; Owner: healthapp_user
--

CREATE VIEW public.v_active_care_plans AS
 SELECT cp.id,
    cp.title AS name,
    cp.status,
    cp.priority,
    cp.start_date,
    cp.end_date,
    p.id AS patient_id,
    u_patient.first_name AS patient_first_name,
    u_patient.last_name AS patient_last_name,
    u_patient.email AS patient_email,
    hp.id AS provider_id,
    u_provider.first_name AS provider_first_name,
    u_provider.last_name AS provider_last_name,
    u_provider.email AS provider_email,
    cp.created_at,
    cp.updated_at
   FROM ((((public.care_plans cp
     JOIN public.patients p ON ((cp.patient_id = p.id)))
     JOIN public.users u_patient ON ((p.user_id = u_patient.id)))
     LEFT JOIN public.healthcare_providers hp ON ((cp.provider_id = hp.id)))
     LEFT JOIN public.users u_provider ON ((hp.user_id = u_provider.id)))
  WHERE ((cp.deleted_at IS NULL) AND (p.deleted_at IS NULL) AND (u_patient.deleted_at IS NULL) AND ((hp.deleted_at IS NULL) OR (hp.id IS NULL)) AND ((u_provider.deleted_at IS NULL) OR (u_provider.id IS NULL)) AND ((cp.status)::text = 'ACTIVE'::text));


ALTER TABLE public.v_active_care_plans OWNER TO healthapp_user;

--
-- Name: v_patient_adherence_summary; Type: VIEW; Schema: public; Owner: healthapp_user
--

CREATE VIEW public.v_patient_adherence_summary AS
 SELECT p.id AS patient_id,
    u.first_name,
    u.last_name,
    u.email,
    count(ar.id) AS total_events,
    count(
        CASE
            WHEN ar.is_completed THEN 1
            ELSE NULL::integer
        END) AS completed_events,
    count(
        CASE
            WHEN ar.is_missed THEN 1
            ELSE NULL::integer
        END) AS missed_events,
    round((((count(
        CASE
            WHEN ar.is_completed THEN 1
            ELSE NULL::integer
        END))::numeric / (NULLIF(count(ar.id), 0))::numeric) * (100)::numeric), 2) AS adherence_percentage,
    max(ar.recorded_at) AS last_activity,
    p.created_at,
    p.updated_at
   FROM ((public.patients p
     JOIN public.users u ON ((p.user_id = u.id)))
     LEFT JOIN public.adherence_records ar ON (((p.id = ar.patient_id) AND (ar.due_at >= (now() - '30 days'::interval)))))
  WHERE ((p.deleted_at IS NULL) AND (u.deleted_at IS NULL))
  GROUP BY p.id, u.first_name, u.last_name, u.email, p.created_at, p.updated_at;


ALTER TABLE public.v_patient_adherence_summary OWNER TO healthapp_user;

--
-- Name: v_upcoming_events; Type: VIEW; Schema: public; Owner: healthapp_user
--

CREATE VIEW public.v_upcoming_events AS
 SELECT se.id,
    se.event_type,
    se.title,
    se.scheduled_for,
    se.priority,
    se.status,
    p.id AS patient_id,
    u_patient.first_name AS patient_first_name,
    u_patient.last_name AS patient_last_name,
    hp.id AS provider_id,
    u_provider.first_name AS provider_first_name,
    u_provider.last_name AS provider_last_name,
    se.created_at
   FROM (((((public.scheduled_events se
     JOIN public.patients p ON ((se.patient_id = p.id)))
     JOIN public.users u_patient ON ((p.user_id = u_patient.id)))
     LEFT JOIN public.care_plans cp ON ((se.care_plan_id = cp.id)))
     LEFT JOIN public.healthcare_providers hp ON ((cp.provider_id = hp.id)))
     LEFT JOIN public.users u_provider ON ((hp.user_id = u_provider.id)))
  WHERE ((se.deleted_at IS NULL) AND (p.deleted_at IS NULL) AND (u_patient.deleted_at IS NULL) AND (se.scheduled_for >= now()) AND (se.status = ANY (ARRAY['SCHEDULED'::public.enum_scheduled_events_status, 'PENDING'::public.enum_scheduled_events_status])))
  ORDER BY se.scheduled_for;


ALTER TABLE public.v_upcoming_events OWNER TO healthapp_user;

--
-- Name: vital_readings; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.vital_readings (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    vital_type_id uuid NOT NULL,
    adherence_record_id uuid,
    value numeric(10,2) NOT NULL,
    unit character varying(20),
    reading_time timestamp with time zone NOT NULL,
    device_info jsonb DEFAULT '{}'::jsonb,
    is_flagged boolean DEFAULT false,
    notes text,
    attachments jsonb DEFAULT '[]'::jsonb,
    is_validated boolean DEFAULT false,
    validated_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.vital_readings OWNER TO healthapp_user;

--
-- Name: vital_requirements; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.vital_requirements (
    id uuid NOT NULL,
    care_plan_id uuid NOT NULL,
    vital_type_id uuid NOT NULL,
    frequency character varying(100) NOT NULL,
    preferred_time time without time zone,
    is_critical boolean DEFAULT false,
    monitoring_notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.vital_requirements OWNER TO healthapp_user;

--
-- Name: vital_templates; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.vital_templates (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    unit character varying(255),
    details json,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.vital_templates OWNER TO healthapp_user;

--
-- Name: vital_types; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.vital_types (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    unit character varying(20),
    normal_range_min numeric(10,2),
    normal_range_max numeric(10,2),
    description text,
    validation_rules jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.vital_types OWNER TO healthapp_user;

--
-- Name: vitals; Type: TABLE; Schema: public; Owner: healthapp_user
--

CREATE TABLE public.vitals (
    id uuid NOT NULL,
    vital_template_id uuid NOT NULL,
    care_plan_id uuid NOT NULL,
    details json,
    description character varying(1000),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.vitals OWNER TO healthapp_user;

--
-- Name: specialities id; Type: DEFAULT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.specialities ALTER COLUMN id SET DEFAULT nextval('public.specialities_id_seq'::regclass);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: adherence_records adherence_records_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.adherence_records
    ADD CONSTRAINT adherence_records_pkey PRIMARY KEY (id);


--
-- Name: appointment_slots appointment_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: care_plan_templates care_plan_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_pkey PRIMARY KEY (id);


--
-- Name: care_plans care_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (id);


--
-- Name: doctor_availability doctor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_medical_license_number_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_medical_license_number_key UNIQUE (medical_license_number);


--
-- Name: doctors doctors_npi_number_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_npi_number_key UNIQUE (npi_number);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_user_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_key UNIQUE (user_id);


--
-- Name: healthcare_providers healthcare_providers_license_number_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_license_number_key UNIQUE (license_number);


--
-- Name: healthcare_providers healthcare_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_pkey PRIMARY KEY (id);


--
-- Name: healthcare_providers healthcare_providers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_user_id_key UNIQUE (user_id);


--
-- Name: hsps hsps_license_number_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_license_number_key UNIQUE (license_number);


--
-- Name: hsps hsps_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_pkey PRIMARY KEY (id);


--
-- Name: hsps hsps_user_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_user_id_key UNIQUE (user_id);


--
-- Name: medications medications_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_license_number_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_license_number_key UNIQUE (license_number);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: patient_doctor_assignments patient_doctor_assignments_patient_id_doctor_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_patient_id_doctor_id_key UNIQUE (patient_id, doctor_id);


--
-- Name: patient_doctor_assignments patient_doctor_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_pkey PRIMARY KEY (id);


--
-- Name: patient_provider_assignments patient_provider_assignments_patient_id_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_provider_assignments
    ADD CONSTRAINT patient_provider_assignments_patient_id_provider_id_key UNIQUE (patient_id, provider_id);


--
-- Name: patient_provider_assignments patient_provider_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_provider_assignments
    ADD CONSTRAINT patient_provider_assignments_pkey PRIMARY KEY (id);


--
-- Name: patient_subscriptions patient_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: patient_subscriptions patient_subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: patients patients_medical_record_number_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_medical_record_number_key UNIQUE (medical_record_number);


--
-- Name: patients patients_patient_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_id_key UNIQUE (patient_id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: patients patients_user_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_key UNIQUE (user_id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_stripe_payment_method_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_stripe_payment_method_id_key UNIQUE (stripe_payment_method_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_stripe_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: schedule_events schedule_events_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.schedule_events
    ADD CONSTRAINT schedule_events_pkey PRIMARY KEY (id);


--
-- Name: scheduled_events scheduled_events_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.scheduled_events
    ADD CONSTRAINT scheduled_events_pkey PRIMARY KEY (id);


--
-- Name: service_plans service_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.service_plans
    ADD CONSTRAINT service_plans_pkey PRIMARY KEY (id);


--
-- Name: specialities specialities_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.specialities
    ADD CONSTRAINT specialities_pkey PRIMARY KEY (id);


--
-- Name: symptoms_database symptoms_database_diagnosis_name_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.symptoms_database
    ADD CONSTRAINT symptoms_database_diagnosis_name_key UNIQUE (diagnosis_name);


--
-- Name: symptoms_database symptoms_database_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.symptoms_database
    ADD CONSTRAINT symptoms_database_pkey PRIMARY KEY (id);


--
-- Name: symptoms symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_pkey PRIMARY KEY (id);


--
-- Name: treatment_database treatment_database_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.treatment_database
    ADD CONSTRAINT treatment_database_pkey PRIMARY KEY (id);


--
-- Name: treatment_database treatment_database_treatment_name_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.treatment_database
    ADD CONSTRAINT treatment_database_treatment_name_key UNIQUE (treatment_name);


--
-- Name: treatment_plans treatment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vital_readings vital_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_pkey PRIMARY KEY (id);


--
-- Name: vital_requirements vital_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_requirements
    ADD CONSTRAINT vital_requirements_pkey PRIMARY KEY (id);


--
-- Name: vital_templates vital_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_templates
    ADD CONSTRAINT vital_templates_pkey PRIMARY KEY (id);


--
-- Name: vital_types vital_types_name_key; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_types
    ADD CONSTRAINT vital_types_name_key UNIQUE (name);


--
-- Name: vital_types vital_types_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_types
    ADD CONSTRAINT vital_types_pkey PRIMARY KEY (id);


--
-- Name: vitals vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_pkey PRIMARY KEY (id);


--
-- Name: adherence_records_adherence_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX adherence_records_adherence_type ON public.adherence_records USING btree (adherence_type);


--
-- Name: adherence_records_due_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX adherence_records_due_at ON public.adherence_records USING btree (due_at);


--
-- Name: adherence_records_is_completed_is_missed; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX adherence_records_is_completed_is_missed ON public.adherence_records USING btree (is_completed, is_missed);


--
-- Name: adherence_records_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX adherence_records_patient_id ON public.adherence_records USING btree (patient_id);


--
-- Name: adherence_records_patient_id_adherence_type_due_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX adherence_records_patient_id_adherence_type_due_at ON public.adherence_records USING btree (patient_id, adherence_type, due_at);


--
-- Name: adherence_records_patient_id_due_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX adherence_records_patient_id_due_at ON public.adherence_records USING btree (patient_id, due_at);


--
-- Name: adherence_records_scheduled_event_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX adherence_records_scheduled_event_id ON public.adherence_records USING btree (scheduled_event_id);


--
-- Name: appointment_slots_date_is_available; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX appointment_slots_date_is_available ON public.appointment_slots USING btree (date, is_available);


--
-- Name: appointment_slots_doctor_id_date_start_time; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX appointment_slots_doctor_id_date_start_time ON public.appointment_slots USING btree (doctor_id, date, start_time);


--
-- Name: appointment_slots_doctor_id_is_available; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX appointment_slots_doctor_id_is_available ON public.appointment_slots USING btree (doctor_id, is_available);


--
-- Name: appointments_organizer_id_organizer_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX appointments_organizer_id_organizer_type ON public.appointments USING btree (organizer_id, organizer_type);


--
-- Name: appointments_participant_one_id_participant_one_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX appointments_participant_one_id_participant_one_type ON public.appointments USING btree (participant_one_id, participant_one_type);


--
-- Name: appointments_participant_two_id_participant_two_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX appointments_participant_two_id_participant_two_type ON public.appointments USING btree (participant_two_id, participant_two_type);


--
-- Name: appointments_slot_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX appointments_slot_id ON public.appointments USING btree (slot_id);


--
-- Name: appointments_start_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX appointments_start_date ON public.appointments USING btree (start_date);


--
-- Name: audit_logs_access_granted; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_access_granted ON public.audit_logs USING btree (access_granted);


--
-- Name: audit_logs_action; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_ip_address; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_ip_address ON public.audit_logs USING btree (ip_address);


--
-- Name: audit_logs_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_organization_id ON public.audit_logs USING btree (organization_id);


--
-- Name: audit_logs_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_patient_id ON public.audit_logs USING btree (patient_id);


--
-- Name: audit_logs_patient_id_phi_accessed_timestamp; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_patient_id_phi_accessed_timestamp ON public.audit_logs USING btree (patient_id, phi_accessed, "timestamp");


--
-- Name: audit_logs_phi_accessed; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_phi_accessed ON public.audit_logs USING btree (phi_accessed);


--
-- Name: audit_logs_retention_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_retention_date ON public.audit_logs USING btree (retention_date);


--
-- Name: audit_logs_risk_level; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_risk_level ON public.audit_logs USING btree (risk_level);


--
-- Name: audit_logs_risk_level_access_granted_timestamp; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_risk_level_access_granted_timestamp ON public.audit_logs USING btree (risk_level, access_granted, "timestamp");


--
-- Name: audit_logs_session_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_session_id ON public.audit_logs USING btree (session_id);


--
-- Name: audit_logs_timestamp; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: audit_logs_user_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: audit_logs_user_id_timestamp; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX audit_logs_user_id_timestamp ON public.audit_logs USING btree (user_id, "timestamp");


--
-- Name: care_plans_chronic_conditions; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_chronic_conditions ON public.care_plans USING gin (chronic_conditions);


--
-- Name: care_plans_created_by_doctor_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_created_by_doctor_id ON public.care_plans USING btree (created_by_doctor_id);


--
-- Name: care_plans_created_by_hsp_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_created_by_hsp_id ON public.care_plans USING btree (created_by_hsp_id);


--
-- Name: care_plans_monitoring_parameters; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_monitoring_parameters ON public.care_plans USING gin (monitoring_parameters);


--
-- Name: care_plans_next_review_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_next_review_date ON public.care_plans USING btree (next_review_date);


--
-- Name: care_plans_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_organization_id ON public.care_plans USING btree (organization_id);


--
-- Name: care_plans_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_patient_id ON public.care_plans USING btree (patient_id);


--
-- Name: care_plans_priority; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_priority ON public.care_plans USING btree (priority);


--
-- Name: care_plans_start_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_start_date ON public.care_plans USING btree (start_date);


--
-- Name: care_plans_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX care_plans_status ON public.care_plans USING btree (status);


--
-- Name: clinics_doctor_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX clinics_doctor_id ON public.clinics USING btree (doctor_id);


--
-- Name: clinics_is_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX clinics_is_active ON public.clinics USING btree (is_active);


--
-- Name: clinics_is_primary; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX clinics_is_primary ON public.clinics USING btree (is_primary);


--
-- Name: clinics_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX clinics_organization_id ON public.clinics USING btree (organization_id);


--
-- Name: doctor_availability_doctor_id_day_of_week; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX doctor_availability_doctor_id_day_of_week ON public.doctor_availability USING btree (doctor_id, day_of_week);


--
-- Name: doctor_availability_doctor_id_is_available; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX doctor_availability_doctor_id_is_available ON public.doctor_availability USING btree (doctor_id, is_available);


--
-- Name: doctors_board_certifications; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX doctors_board_certifications ON public.doctors USING gin (board_certifications);


--
-- Name: doctors_gender; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX doctors_gender ON public.doctors USING btree (gender);


--
-- Name: doctors_is_verified; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX doctors_is_verified ON public.doctors USING btree (is_verified);


--
-- Name: doctors_is_verified_gender; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX doctors_is_verified_gender ON public.doctors USING btree (is_verified, gender);


--
-- Name: doctors_medical_license_number; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX doctors_medical_license_number ON public.doctors USING btree (medical_license_number);


--
-- Name: doctors_npi_number; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX doctors_npi_number ON public.doctors USING btree (npi_number) WHERE (npi_number IS NOT NULL);


--
-- Name: doctors_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX doctors_organization_id ON public.doctors USING btree (organization_id);


--
-- Name: doctors_specialties; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX doctors_specialties ON public.doctors USING gin (specialties);


--
-- Name: doctors_user_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX doctors_user_id ON public.doctors USING btree (user_id);


--
-- Name: healthcare_providers_is_verified; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX healthcare_providers_is_verified ON public.healthcare_providers USING btree (is_verified);


--
-- Name: healthcare_providers_license_number; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX healthcare_providers_license_number ON public.healthcare_providers USING btree (license_number) WHERE (license_number IS NOT NULL);


--
-- Name: healthcare_providers_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX healthcare_providers_organization_id ON public.healthcare_providers USING btree (organization_id);


--
-- Name: healthcare_providers_specialties; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX healthcare_providers_specialties ON public.healthcare_providers USING gin (specialties);


--
-- Name: healthcare_providers_user_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX healthcare_providers_user_id ON public.healthcare_providers USING btree (user_id);


--
-- Name: healthcare_providers_verification_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX healthcare_providers_verification_date ON public.healthcare_providers USING btree (verification_date);


--
-- Name: hsps_departments; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX hsps_departments ON public.hsps USING gin (departments);


--
-- Name: hsps_hsp_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX hsps_hsp_type ON public.hsps USING btree (hsp_type);


--
-- Name: hsps_is_verified; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX hsps_is_verified ON public.hsps USING btree (is_verified);


--
-- Name: hsps_license_number; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX hsps_license_number ON public.hsps USING btree (license_number) WHERE (license_number IS NOT NULL);


--
-- Name: hsps_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX hsps_organization_id ON public.hsps USING btree (organization_id);


--
-- Name: hsps_specializations; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX hsps_specializations ON public.hsps USING gin (specializations);


--
-- Name: hsps_supervising_doctor_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX hsps_supervising_doctor_id ON public.hsps USING btree (supervising_doctor_id);


--
-- Name: hsps_user_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX hsps_user_id ON public.hsps USING btree (user_id);


--
-- Name: idx_appointments_doctor_time; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_appointments_doctor_time ON public.appointments USING btree (doctor_id, start_time) WHERE (doctor_id IS NOT NULL);


--
-- Name: idx_appointments_hsp_time; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_appointments_hsp_time ON public.appointments USING btree (hsp_id, start_time) WHERE (hsp_id IS NOT NULL);


--
-- Name: idx_assignments_consent_status_expires; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_assignments_consent_status_expires ON public.patient_doctor_assignments USING btree (patient_consent_status, consent_otp_expires_at) WHERE (patient_consent_required = true);


--
-- Name: idx_assignments_doctor_active_created; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_assignments_doctor_active_created ON public.patient_doctor_assignments USING btree (doctor_id, is_active, created_at);


--
-- Name: idx_assignments_patient_type_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_assignments_patient_type_active ON public.patient_doctor_assignments USING btree (patient_id, assignment_type, is_active);


--
-- Name: idx_audit_user_created_action; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_audit_user_created_action ON public.audit_logs USING btree (user_id, created_at, action);


--
-- Name: idx_careplans_patient_status_start; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_careplans_patient_status_start ON public.care_plans USING btree (patient_id, status, start_date);


--
-- Name: idx_careplans_provider_status_created; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_careplans_provider_status_created ON public.care_plans USING btree (provider_id, status, created_at);


--
-- Name: idx_patients_doctor_created_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_patients_doctor_created_active ON public.patients USING btree (primary_care_doctor_id, created_at, is_active);


--
-- Name: idx_patients_id_created; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_patients_id_created ON public.patients USING btree (patient_id, created_at);


--
-- Name: idx_patients_user_doctor; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_patients_user_doctor ON public.patients USING btree (user_id, primary_care_doctor_id);


--
-- Name: idx_providers_org_verified; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_providers_org_verified ON public.healthcare_providers USING btree (organization_id, is_verified);


--
-- Name: idx_symptoms_careplan_onset; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_symptoms_careplan_onset ON public.symptoms USING btree (care_plan_id, onset_time) WHERE (care_plan_id IS NOT NULL);


--
-- Name: idx_symptoms_patient_onset_severity; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_symptoms_patient_onset_severity ON public.symptoms USING btree (patient_id, onset_time, severity);


--
-- Name: idx_templates_conditions; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_templates_conditions ON public.care_plan_templates USING gin (conditions);


--
-- Name: idx_templates_created_by; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_templates_created_by ON public.care_plan_templates USING btree (created_by);


--
-- Name: idx_templates_is_approved; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_templates_is_approved ON public.care_plan_templates USING btree (is_approved);


--
-- Name: idx_templates_is_public; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_templates_is_public ON public.care_plan_templates USING btree (is_public);


--
-- Name: idx_templates_name; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_templates_name ON public.care_plan_templates USING btree (name);


--
-- Name: idx_templates_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_templates_organization_id ON public.care_plan_templates USING btree (organization_id);


--
-- Name: idx_templates_specialties; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_templates_specialties ON public.care_plan_templates USING gin (specialties);


--
-- Name: idx_templates_tags; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_templates_tags ON public.care_plan_templates USING gin (tags);


--
-- Name: idx_userroles_identity_linked; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_userroles_identity_linked ON public.user_roles USING btree (user_identity, linked_with);


--
-- Name: idx_users_email_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_users_email_status ON public.users USING btree (email, account_status);


--
-- Name: idx_users_org_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_users_org_status ON public.users USING btree (organization_id, account_status) WHERE (organization_id IS NOT NULL);


--
-- Name: idx_vitals_patient_time_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_vitals_patient_time_type ON public.vital_readings USING btree (patient_id, reading_time, vital_type_id);


--
-- Name: idx_vitals_patient_type_time_desc; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_vitals_patient_type_time_desc ON public.vital_readings USING btree (patient_id, vital_type_id, reading_time);


--
-- Name: idx_vitals_time_patient; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX idx_vitals_time_patient ON public.vital_readings USING btree (reading_time, patient_id);


--
-- Name: medications_medicine_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX medications_medicine_id ON public.medications USING btree (medicine_id);


--
-- Name: medications_organizer_type_organizer_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX medications_organizer_type_organizer_id ON public.medications USING btree (organizer_type, organizer_id);


--
-- Name: medications_participant_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX medications_participant_id ON public.medications USING btree (participant_id);


--
-- Name: notifications_doctor_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_doctor_id ON public.notifications USING btree (doctor_id);


--
-- Name: notifications_expires_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_expires_at ON public.notifications USING btree (expires_at);


--
-- Name: notifications_hsp_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_hsp_id ON public.notifications USING btree (hsp_id);


--
-- Name: notifications_is_urgent; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_is_urgent ON public.notifications USING btree (is_urgent);


--
-- Name: notifications_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_organization_id ON public.notifications USING btree (organization_id);


--
-- Name: notifications_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_patient_id ON public.notifications USING btree (patient_id);


--
-- Name: notifications_patient_id_status_created_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_patient_id_status_created_at ON public.notifications USING btree (patient_id, status, created_at);


--
-- Name: notifications_priority; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_priority ON public.notifications USING btree (priority);


--
-- Name: notifications_requires_action_action_taken; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_requires_action_action_taken ON public.notifications USING btree (requires_action, action_taken);


--
-- Name: notifications_scheduled_for; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_scheduled_for ON public.notifications USING btree (scheduled_for);


--
-- Name: notifications_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_status ON public.notifications USING btree (status);


--
-- Name: notifications_status_scheduled_for_expires_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_status_scheduled_for_expires_at ON public.notifications USING btree (status, scheduled_for, expires_at);


--
-- Name: notifications_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX notifications_type ON public.notifications USING btree (type);


--
-- Name: organizations_is_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX organizations_is_active ON public.organizations USING btree (is_active);


--
-- Name: organizations_license_number; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX organizations_license_number ON public.organizations USING btree (license_number) WHERE (license_number IS NOT NULL);


--
-- Name: organizations_name; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX organizations_name ON public.organizations USING btree (name);


--
-- Name: organizations_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX organizations_type ON public.organizations USING btree (type);


--
-- Name: patient_doctor_assignments_assignment_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_doctor_assignments_assignment_type ON public.patient_doctor_assignments USING btree (assignment_type);


--
-- Name: patient_doctor_assignments_doctor_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_doctor_assignments_doctor_id ON public.patient_doctor_assignments USING btree (doctor_id);


--
-- Name: patient_doctor_assignments_is_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_doctor_assignments_is_active ON public.patient_doctor_assignments USING btree (is_active);


--
-- Name: patient_doctor_assignments_patient_consent_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_doctor_assignments_patient_consent_status ON public.patient_doctor_assignments USING btree (patient_consent_status);


--
-- Name: patient_doctor_assignments_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_doctor_assignments_patient_id ON public.patient_doctor_assignments USING btree (patient_id);


--
-- Name: patient_provider_assignments_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_provider_assignments_patient_id ON public.patient_provider_assignments USING btree (patient_id) WHERE (ended_at IS NULL);


--
-- Name: patient_provider_assignments_patient_id_provider_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_provider_assignments_patient_id_provider_id ON public.patient_provider_assignments USING btree (patient_id, provider_id) WHERE (ended_at IS NULL);

--
-- Name: patient_provider_assignments_provider_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_provider_assignments_provider_id ON public.patient_provider_assignments USING btree (provider_id) WHERE (ended_at IS NULL);


--
-- Name: patient_provider_role_unique; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX patient_provider_role_unique ON public.patient_provider_assignments USING btree (patient_id, provider_id, role, ended_at);


--
-- Name: patient_subscriptions_next_billing_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_subscriptions_next_billing_date ON public.patient_subscriptions USING btree (next_billing_date);


--
-- Name: patient_subscriptions_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_subscriptions_patient_id ON public.patient_subscriptions USING btree (patient_id);


--
-- Name: patient_subscriptions_patient_id_provider_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_subscriptions_patient_id_provider_id ON public.patient_subscriptions USING btree (patient_id, provider_id);


--
-- Name: patient_subscriptions_provider_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_subscriptions_provider_id ON public.patient_subscriptions USING btree (provider_id);


--
-- Name: patient_subscriptions_service_plan_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_subscriptions_service_plan_id ON public.patient_subscriptions USING btree (service_plan_id);


--
-- Name: patient_subscriptions_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_subscriptions_status ON public.patient_subscriptions USING btree (status);


--
-- Name: patient_subscriptions_stripe_customer_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_subscriptions_stripe_customer_id ON public.patient_subscriptions USING btree (stripe_customer_id);


--
-- Name: patient_subscriptions_stripe_subscription_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patient_subscriptions_stripe_subscription_id ON public.patient_subscriptions USING btree (stripe_subscription_id);


--
-- Name: patients_allergies; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patients_allergies ON public.patients USING gin (allergies);


--
-- Name: patients_is_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patients_is_active ON public.patients USING btree (is_active);


--
-- Name: patients_medical_history; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patients_medical_history ON public.patients USING gin (medical_history);


--
-- Name: patients_medical_record_number; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX patients_medical_record_number ON public.patients USING btree (medical_record_number) WHERE (medical_record_number IS NOT NULL);


--
-- Name: patients_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patients_organization_id ON public.patients USING btree (organization_id);


--
-- Name: patients_primary_care_doctor_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patients_primary_care_doctor_id ON public.patients USING btree (primary_care_doctor_id);


--
-- Name: patients_primary_care_hsp_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patients_primary_care_hsp_id ON public.patients USING btree (primary_care_hsp_id);


--
-- Name: patients_risk_level; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX patients_risk_level ON public.patients USING btree (risk_level);


--
-- Name: patients_user_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX patients_user_id ON public.patients USING btree (user_id);


--
-- Name: payment_methods_is_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payment_methods_is_active ON public.payment_methods USING btree (is_active);


--
-- Name: payment_methods_is_default; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payment_methods_is_default ON public.payment_methods USING btree (is_default);


--
-- Name: payment_methods_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payment_methods_patient_id ON public.payment_methods USING btree (patient_id);


--
-- Name: payment_methods_stripe_payment_method_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payment_methods_stripe_payment_method_id ON public.payment_methods USING btree (stripe_payment_method_id);


--
-- Name: payment_methods_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payment_methods_type ON public.payment_methods USING btree (type);


--
-- Name: payments_billing_period_start_billing_period_end; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payments_billing_period_start_billing_period_end ON public.payments USING btree (billing_period_start, billing_period_end);


--
-- Name: payments_created_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payments_created_at ON public.payments USING btree (created_at);


--
-- Name: payments_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payments_patient_id ON public.payments USING btree (patient_id);


--
-- Name: payments_provider_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payments_provider_id ON public.payments USING btree (provider_id);


--
-- Name: payments_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payments_status ON public.payments USING btree (status);


--
-- Name: payments_stripe_payment_intent_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payments_stripe_payment_intent_id ON public.payments USING btree (stripe_payment_intent_id);


--
-- Name: payments_subscription_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX payments_subscription_id ON public.payments USING btree (subscription_id);


--
-- Name: providers_user_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX providers_user_id ON public.providers USING btree (user_id);


--
-- Name: schedule_events_event_id_event_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX schedule_events_event_id_event_type ON public.schedule_events USING btree (event_id, event_type);


--
-- Name: schedule_events_event_type_status_date_start_time; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX schedule_events_event_type_status_date_start_time ON public.schedule_events USING btree (event_type, status, date, start_time);


--
-- Name: schedule_events_status_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX schedule_events_status_date ON public.schedule_events USING btree (status, date);


--
-- Name: scheduled_events_care_plan_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX scheduled_events_care_plan_id ON public.scheduled_events USING btree (care_plan_id);


--
-- Name: scheduled_events_event_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX scheduled_events_event_type ON public.scheduled_events USING btree (event_type) WHERE (deleted_at IS NULL);


--
-- Name: scheduled_events_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX scheduled_events_patient_id ON public.scheduled_events USING btree (patient_id) WHERE (deleted_at IS NULL);


--
-- Name: scheduled_events_patient_id_scheduled_for; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX scheduled_events_patient_id_scheduled_for ON public.scheduled_events USING btree (patient_id, scheduled_for) WHERE (deleted_at IS NULL);


--
-- Name: scheduled_events_priority; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX scheduled_events_priority ON public.scheduled_events USING btree (priority) WHERE (deleted_at IS NULL);


--
-- Name: scheduled_events_scheduled_for; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX scheduled_events_scheduled_for ON public.scheduled_events USING btree (scheduled_for) WHERE (deleted_at IS NULL);


--
-- Name: scheduled_events_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX scheduled_events_status ON public.scheduled_events USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: service_plans_billing_cycle; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX service_plans_billing_cycle ON public.service_plans USING btree (billing_cycle);


--
-- Name: service_plans_is_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX service_plans_is_active ON public.service_plans USING btree (is_active);


--
-- Name: service_plans_name; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX service_plans_name ON public.service_plans USING btree (name);


--
-- Name: service_plans_price; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX service_plans_price ON public.service_plans USING btree (price);


--
-- Name: service_plans_provider_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX service_plans_provider_id ON public.service_plans USING btree (provider_id);


--
-- Name: service_plans_service_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX service_plans_service_type ON public.service_plans USING btree (service_type);


--
-- Name: symptoms_care_plan_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_care_plan_id ON public.symptoms USING btree (care_plan_id);


--
-- Name: symptoms_database_category; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_database_category ON public.symptoms_database USING btree (category);


--
-- Name: symptoms_database_diagnosis_name; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX symptoms_database_diagnosis_name ON public.symptoms_database USING btree (diagnosis_name);


--
-- Name: symptoms_database_is_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_database_is_active ON public.symptoms_database USING btree (is_active);


--
-- Name: symptoms_database_symptoms; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_database_symptoms ON public.symptoms_database USING gin (symptoms);


--
-- Name: symptoms_onset_time; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_onset_time ON public.symptoms USING btree (onset_time);


--
-- Name: symptoms_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_patient_id ON public.symptoms USING btree (patient_id);


--
-- Name: symptoms_patient_id_recorded_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_patient_id_recorded_at ON public.symptoms USING btree (patient_id, recorded_at);


--
-- Name: symptoms_recorded_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_recorded_at ON public.symptoms USING btree (recorded_at);


--
-- Name: symptoms_severity; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_severity ON public.symptoms USING btree (severity);


--
-- Name: symptoms_symptom_name; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX symptoms_symptom_name ON public.symptoms USING btree (symptom_name);


--
-- Name: treatment_database_applicable_conditions; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_database_applicable_conditions ON public.treatment_database USING gin (applicable_conditions);


--
-- Name: treatment_database_category; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_database_category ON public.treatment_database USING btree (category);


--
-- Name: treatment_database_is_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_database_is_active ON public.treatment_database USING btree (is_active);


--
-- Name: treatment_database_severity_level; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_database_severity_level ON public.treatment_database USING btree (severity_level);


--
-- Name: treatment_database_treatment_name; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX treatment_database_treatment_name ON public.treatment_database USING btree (treatment_name);


--
-- Name: treatment_database_treatment_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_database_treatment_type ON public.treatment_database USING btree (treatment_type);


--
-- Name: treatment_plans_doctor_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_doctor_id ON public.treatment_plans USING btree (doctor_id);


--
-- Name: treatment_plans_end_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_end_date ON public.treatment_plans USING btree (end_date);


--
-- Name: treatment_plans_follow_up_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_follow_up_date ON public.treatment_plans USING btree (follow_up_date);


--
-- Name: treatment_plans_organization_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_organization_id ON public.treatment_plans USING btree (organization_id);


--
-- Name: treatment_plans_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_patient_id ON public.treatment_plans USING btree (patient_id);


--
-- Name: treatment_plans_primary_diagnosis; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_primary_diagnosis ON public.treatment_plans USING btree (primary_diagnosis);


--
-- Name: treatment_plans_priority; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_priority ON public.treatment_plans USING btree (priority);


--
-- Name: treatment_plans_secondary_diagnoses; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_secondary_diagnoses ON public.treatment_plans USING gin (secondary_diagnoses);


--
-- Name: treatment_plans_start_date; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_start_date ON public.treatment_plans USING btree (start_date);


--
-- Name: treatment_plans_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_status ON public.treatment_plans USING btree (status);


--
-- Name: treatment_plans_symptoms; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX treatment_plans_symptoms ON public.treatment_plans USING gin (symptoms);


--
-- Name: unique_primary_clinic_per_doctor; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX unique_primary_clinic_per_doctor ON public.clinics USING btree (doctor_id, is_primary) WHERE ((is_primary = true) AND (deleted_at IS NULL));


--
-- Name: unique_primary_doctor_per_patient; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX unique_primary_doctor_per_patient ON public.patient_doctor_assignments USING btree (patient_id, assignment_type) WHERE (((assignment_type)::text = 'primary'::text) AND (is_active = true));


--
-- Name: user_devices_device_type; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX user_devices_device_type ON public.user_devices USING btree (device_type);


--
-- Name: user_devices_is_active; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX user_devices_is_active ON public.user_devices USING btree (is_active);


--
-- Name: user_devices_last_used_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX user_devices_last_used_at ON public.user_devices USING btree (last_used_at);


--
-- Name: user_devices_push_token; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX user_devices_push_token ON public.user_devices USING btree (push_token);


--
-- Name: user_devices_user_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX user_devices_user_id ON public.user_devices USING btree (user_id);


--
-- Name: user_devices_user_id_push_token; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX user_devices_user_id_push_token ON public.user_devices USING btree (user_id, push_token);


--
-- Name: users_account_status; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX users_account_status ON public.users USING btree (account_status);


--
-- Name: users_email; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX users_email ON public.users USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: users_email_verified; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX users_email_verified ON public.users USING btree (email_verified);


--
-- Name: users_full_name; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX users_full_name ON public.users USING btree (full_name);


--
-- Name: users_last_login_at; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX users_last_login_at ON public.users USING btree (last_login_at);


--
-- Name: users_phone; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX users_phone ON public.users USING btree (phone);


--
-- Name: users_role; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX users_role ON public.users USING btree (role);


--
-- Name: vital_readings_is_flagged; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_readings_is_flagged ON public.vital_readings USING btree (is_flagged);


--
-- Name: vital_readings_is_validated; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_readings_is_validated ON public.vital_readings USING btree (is_validated);


--
-- Name: vital_readings_patient_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_readings_patient_id ON public.vital_readings USING btree (patient_id);


--
-- Name: vital_readings_patient_id_vital_type_id_reading_time; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_readings_patient_id_vital_type_id_reading_time ON public.vital_readings USING btree (patient_id, vital_type_id, reading_time);


--
-- Name: vital_readings_reading_time; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_readings_reading_time ON public.vital_readings USING btree (reading_time);


--
-- Name: vital_readings_vital_type_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_readings_vital_type_id ON public.vital_readings USING btree (vital_type_id);


--
-- Name: vital_requirements_care_plan_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_requirements_care_plan_id ON public.vital_requirements USING btree (care_plan_id);


--
-- Name: vital_requirements_care_plan_id_vital_type_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX vital_requirements_care_plan_id_vital_type_id ON public.vital_requirements USING btree (care_plan_id, vital_type_id) WHERE (deleted_at IS NULL);


--
-- Name: vital_requirements_frequency; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_requirements_frequency ON public.vital_requirements USING btree (frequency);


--
-- Name: vital_requirements_is_critical; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_requirements_is_critical ON public.vital_requirements USING btree (is_critical);


--
-- Name: vital_requirements_vital_type_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_requirements_vital_type_id ON public.vital_requirements USING btree (vital_type_id);


--
-- Name: vital_types_name; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE UNIQUE INDEX vital_types_name ON public.vital_types USING btree (name);


--
-- Name: vital_types_unit; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vital_types_unit ON public.vital_types USING btree (unit);


--
-- Name: vitals_care_plan_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vitals_care_plan_id ON public.vitals USING btree (care_plan_id);


--
-- Name: vitals_vital_template_id; Type: INDEX; Schema: public; Owner: healthapp_user
--

CREATE INDEX vitals_vital_template_id ON public.vitals USING btree (vital_template_id);


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: healthapp_user
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: care_plans update_care_plans_updated_at; Type: TRIGGER; Schema: public; Owner: healthapp_user
--

CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON public.care_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: healthcare_providers update_healthcare_providers_updated_at; Type: TRIGGER; Schema: public; Owner: healthapp_user
--

CREATE TRIGGER update_healthcare_providers_updated_at BEFORE UPDATE ON public.healthcare_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: medications update_medications_updated_at; Type: TRIGGER; Schema: public; Owner: healthapp_user
--

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notifications update_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: healthapp_user
--

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: healthapp_user
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduled_events update_scheduled_events_updated_at; Type: TRIGGER; Schema: public; Owner: healthapp_user
--

CREATE TRIGGER update_scheduled_events_updated_at BEFORE UPDATE ON public.scheduled_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: healthapp_user
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: adherence_records adherence_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.adherence_records
    ADD CONSTRAINT adherence_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: adherence_records adherence_records_scheduled_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.adherence_records
    ADD CONSTRAINT adherence_records_scheduled_event_id_fkey FOREIGN KEY (scheduled_event_id) REFERENCES public.scheduled_events(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointment_slots appointment_slots_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.appointment_slots
    ADD CONSTRAINT appointment_slots_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_hsp_id_fkey FOREIGN KEY (hsp_id) REFERENCES public.hsps(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.appointment_slots(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: audit_logs audit_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: care_plan_templates care_plan_templates_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: care_plan_templates care_plan_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.healthcare_providers(id);


--
-- Name: care_plan_templates care_plan_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: care_plan_templates care_plan_templates_parent_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plan_templates
    ADD CONSTRAINT care_plan_templates_parent_template_id_fkey FOREIGN KEY (parent_template_id) REFERENCES public.care_plan_templates(id);


--
-- Name: care_plans care_plans_created_by_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_created_by_doctor_id_fkey FOREIGN KEY (created_by_doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: care_plans care_plans_created_by_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_created_by_hsp_id_fkey FOREIGN KEY (created_by_hsp_id) REFERENCES public.hsps(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: care_plans care_plans_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: care_plans care_plans_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: care_plans care_plans_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: care_plans care_plans_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.care_plans
    ADD CONSTRAINT care_plans_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: clinics clinics_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clinics clinics_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: doctor_availability doctor_availability_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id);


--
-- Name: doctors doctors_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: doctors doctors_speciality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_speciality_id_fkey FOREIGN KEY (speciality_id) REFERENCES public.specialities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: doctors doctors_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: healthcare_providers healthcare_providers_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: healthcare_providers healthcare_providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: healthcare_providers healthcare_providers_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: hsps hsps_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: hsps hsps_supervising_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_supervising_doctor_id_fkey FOREIGN KEY (supervising_doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: hsps hsps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hsps hsps_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.hsps
    ADD CONSTRAINT hsps_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medications medications_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- Name: notifications notifications_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_hsp_id_fkey FOREIGN KEY (hsp_id) REFERENCES public.hsps(id);


--
-- Name: notifications notifications_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: notifications notifications_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_related_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_appointment_id_fkey FOREIGN KEY (related_appointment_id) REFERENCES public.appointments(id);


--
-- Name: notifications notifications_related_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_care_plan_id_fkey FOREIGN KEY (related_care_plan_id) REFERENCES public.care_plans(id);


--
-- Name: notifications notifications_related_medication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_medication_id_fkey FOREIGN KEY (related_medication_id) REFERENCES public.medications(id);


--
-- Name: notifications notifications_related_treatment_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_treatment_plan_id_fkey FOREIGN KEY (related_treatment_plan_id) REFERENCES public.treatment_plans(id);


--
-- Name: patient_doctor_assignments patient_doctor_assignments_assigned_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_assigned_by_admin_id_fkey FOREIGN KEY (assigned_by_admin_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_doctor_assignments patient_doctor_assignments_assigned_by_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_assigned_by_doctor_id_fkey FOREIGN KEY (assigned_by_doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_doctor_assignments patient_doctor_assignments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_doctor_assignments patient_doctor_assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_doctor_assignments
    ADD CONSTRAINT patient_doctor_assignments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_provider_assignments patient_provider_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_provider_assignments
    ADD CONSTRAINT patient_provider_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_provider_assignments patient_provider_assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_provider_assignments
    ADD CONSTRAINT patient_provider_assignments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_provider_assignments patient_provider_assignments_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_provider_assignments
    ADD CONSTRAINT patient_provider_assignments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_subscriptions patient_subscriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_subscriptions patient_subscriptions_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(id);


--
-- Name: patient_subscriptions patient_subscriptions_service_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patient_subscriptions
    ADD CONSTRAINT patient_subscriptions_service_plan_id_fkey FOREIGN KEY (service_plan_id) REFERENCES public.service_plans(id);


--
-- Name: patients patients_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_primary_care_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_primary_care_doctor_id_fkey FOREIGN KEY (primary_care_doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_primary_care_hsp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_primary_care_hsp_id_fkey FOREIGN KEY (primary_care_hsp_id) REFERENCES public.hsps(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: payments payments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: payments payments_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(id);


--
-- Name: payments payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.patient_subscriptions(id);


--
-- Name: providers providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scheduled_events scheduled_events_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.scheduled_events
    ADD CONSTRAINT scheduled_events_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_events scheduled_events_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.scheduled_events
    ADD CONSTRAINT scheduled_events_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scheduled_events scheduled_events_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.scheduled_events
    ADD CONSTRAINT scheduled_events_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_plans service_plans_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.service_plans
    ADD CONSTRAINT service_plans_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(id);


--
-- Name: symptoms symptoms_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: symptoms symptoms_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.symptoms
    ADD CONSTRAINT symptoms_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: treatment_plans treatment_plans_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: treatment_plans treatment_plans_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: treatment_plans treatment_plans_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_identity_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_identity_fkey FOREIGN KEY (user_identity) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vital_readings vital_readings_adherence_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_adherence_record_id_fkey FOREIGN KEY (adherence_record_id) REFERENCES public.adherence_records(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vital_readings vital_readings_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vital_readings vital_readings_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.healthcare_providers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vital_readings vital_readings_vital_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_readings
    ADD CONSTRAINT vital_readings_vital_type_id_fkey FOREIGN KEY (vital_type_id) REFERENCES public.vital_types(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vital_requirements vital_requirements_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_requirements
    ADD CONSTRAINT vital_requirements_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vital_requirements vital_requirements_vital_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vital_requirements
    ADD CONSTRAINT vital_requirements_vital_type_id_fkey FOREIGN KEY (vital_type_id) REFERENCES public.vital_types(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vitals vitals_care_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_care_plan_id_fkey FOREIGN KEY (care_plan_id) REFERENCES public.care_plans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vitals vitals_vital_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: healthapp_user
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_vital_template_id_fkey FOREIGN KEY (vital_template_id) REFERENCES public.vital_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--