-- Healthcare Management Platform - Complete PostgreSQL Schema
-- Generated from Prisma Schema for Auth.js v5 + Healthcare Application
-- Compatible with Prisma ORM and Auth.js v5
-- Updated: 2025-08-14

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CUSTOM TYPES (ENUMS)
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

-- Assignment types for doctors
CREATE TYPE enum_assignment_type AS ENUM (
    'PRIMARY',
    'SPECIALIST',
    'SUBSTITUTE',
    'TRANSFERRED'
);

-- Notification types
CREATE TYPE enum_notification_type AS ENUM (
    'APPOINTMENT_REMINDER',
    'MEDICATION_REMINDER',
    'LAB_RESULT',
    'CARE_PLAN_UPDATE',
    'EMERGENCY_ALERT',
    'SYSTEM_NOTIFICATION'
);

-- Device connection status
CREATE TYPE enum_device_status AS ENUM (
    'CONNECTED',
    'DISCONNECTED',
    'ERROR',
    'PAIRING'
);

-- Lab test status
CREATE TYPE enum_lab_test_status AS ENUM (
    'ORDERED',
    'COLLECTED',
    'PROCESSING',
    'COMPLETED',
    'CANCELLED'
);

-- Video consultation status
CREATE TYPE enum_video_consultation_status AS ENUM (
    'SCHEDULED',
    'STARTING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);

-- Emergency alert severity
CREATE TYPE enum_emergency_alert_severity AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

-- =============================================
-- AUTH.JS V5 CORE TABLES
-- =============================================

-- Main Users table (Auth.js v5 compatible)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified TIMESTAMPTZ,
    name VARCHAR(255),
    image VARCHAR(500),
    password_hash VARCHAR(255), -- For credentials authentication
    role enum_users_role NOT NULL DEFAULT 'PATIENT',
    account_status enum_users_account_status DEFAULT 'PENDING_VERIFICATION',
    
    -- Personal Information
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    middle_name VARCHAR(100),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender enum_users_gender,
    profilePictureUrl VARCHAR(500),
    
    -- Security Fields
    twoFactorEnabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Account Management
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    
    -- User Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    preferences JSON DEFAULT '{"privacy": {"profile_visible": true, "share_data_for_research": false}, "accessibility": {"large_text": false, "high_contrast": false}, "notifications": {"sms": false, "push": true, "email": true}}',
    
    -- Legal Compliance
    terms_accepted_at TIMESTAMPTZ,
    privacy_policy_accepted_at TIMESTAMPTZ,
    hipaa_consent_date TIMESTAMPTZ,
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- OAuth Accounts (Auth.js v5)
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
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

-- Database Sessions (Auth.js v5)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Verification Tokens (Auth.js v5)
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- User Roles (Many-to-many for multiple roles)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role enum_users_role NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    isActive BOOLEAN DEFAULT TRUE,
    UNIQUE(userId, role)
);

-- =============================================
-- HEALTHCARE CORE TABLES
-- =============================================

-- Healthcare Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'clinic',
    license_number VARCHAR(100) UNIQUE,
    contact_info JSON DEFAULT '{}',
    address JSON DEFAULT '{}',
    settings JSON DEFAULT '{"timezone": "UTC", "working_hours": {"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}, "saturday": {"start": "09:00", "end": "13:00"}, "sunday": {"closed": true}}}',
    isActive BOOLEAN DEFAULT TRUE,
    hipaa_covered_entity BOOLEAN DEFAULT TRUE,
    business_associate_agreement JSON,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Medical Specialties
CREATE TABLE specialities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_primary_care BOOLEAN DEFAULT FALSE,
    parent_specialty_id UUID REFERENCES specialities(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Healthcare Providers (Generic)
CREATE TABLE healthcare_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_type VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    organization_id UUID REFERENCES organizations(id),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors (Medical Physicians)
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctorId VARCHAR(50) UNIQUE NOT NULL,
    medical_license_number VARCHAR(100) UNIQUE,
    speciality_id UUID REFERENCES specialities(id),
    organization_id UUID REFERENCES organizations(id),
    years_of_experience INTEGER DEFAULT 0,
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    bio TEXT,
    education JSON DEFAULT '[]',
    certifications JSON DEFAULT '[]',
    languages_spoken JSON DEFAULT '["English"]',
    is_accepting_patients BOOLEAN DEFAULT TRUE,
    consultation_duration_minutes INTEGER DEFAULT 30,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Health Service Providers (Nurses, Therapists, etc.)
CREATE TABLE hsps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hsp_id VARCHAR(50) UNIQUE NOT NULL,
    hsp_type VARCHAR(100) DEFAULT 'nurse',
    license_number VARCHAR(100),
    organization_id UUID REFERENCES organizations(id),
    years_of_experience INTEGER DEFAULT 0,
    certifications JSON DEFAULT '[]',
    specializations JSON DEFAULT '[]',
    supervisor_doctor_id UUID REFERENCES doctors(id),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patientId VARCHAR(50) UNIQUE NOT NULL,
    medicalRecordNumber VARCHAR(100) UNIQUE,
    primaryCareDoctorId UUID REFERENCES doctors(id),
    linked_provider_id UUID REFERENCES organizations(id),
    blood_type VARCHAR(5),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,1),
    emergency_contact JSON,
    insurance_info JSON,
    medical_history JSON DEFAULT '[]',
    allergies JSON DEFAULT '[]',
    current_medications JSON DEFAULT '[]',
    family_history JSON DEFAULT '[]',
    lifestyle_factors JSON DEFAULT '{}',
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Patient-Doctor Assignments (Many-to-many with types)
CREATE TABLE patient_doctor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctorId UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    assignment_type enum_assignment_type DEFAULT 'PRIMARY',
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    isActive BOOLEAN DEFAULT TRUE,
    notes TEXT,
    UNIQUE(patientId, doctorId, assignment_type)
);

-- =============================================
-- MEDICAL MANAGEMENT TABLES
-- =============================================

-- Medicine Database/Catalog
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    genericName VARCHAR(255),
    brand_names JSON DEFAULT '[]',
    description TEXT,
    dosage_forms JSON DEFAULT '[]',
    strength_options JSON DEFAULT '[]',
    therapeutic_class VARCHAR(100),
    drug_category VARCHAR(100),
    contraindications JSON DEFAULT '[]',
    side_effects JSON DEFAULT '[]',
    drug_interactions JSON DEFAULT '[]',
    pregnancy_category VARCHAR(5),
    controlled_substance_schedule VARCHAR(10),
    requires_prescription BOOLEAN DEFAULT TRUE,
    fda_approved BOOLEAN DEFAULT TRUE,
    rxnorm_code VARCHAR(50),
    ndc_codes JSON DEFAULT '[]',
    manufacturer VARCHAR(255),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Medications (Prescriptions)
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id),
    prescribed_by UUID NOT NULL REFERENCES doctors(id),
    prescription_number VARCHAR(100),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration_days INTEGER,
    instructions TEXT,
    startDate DATE NOT NULL,
    endDate DATE,
    refills_remaining INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    adherence_level enum_medication_adherence_level DEFAULT 'UNKNOWN',
    side_effects_reported JSON DEFAULT '[]',
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    notes TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Care Plan Templates
CREATE TABLE care_plan_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    specialty_id UUID REFERENCES specialities(id),
    organization_id UUID REFERENCES organizations(id),
    created_by UUID NOT NULL REFERENCES users(id),
    template_data JSON NOT NULL DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    isActive BOOLEAN DEFAULT TRUE,
    version VARCHAR(20) DEFAULT '1.0',
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Care Plans
CREATE TABLE carePlans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctorId UUID NOT NULL REFERENCES doctors(id),
    template_id UUID REFERENCES care_plan_templates(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status enum_care_plans_status DEFAULT 'ACTIVE',
    startDate DATE NOT NULL,
    endDate DATE,
    goals JSON DEFAULT '[]',
    interventions JSON DEFAULT '[]',
    care_team JSON DEFAULT '[]',
    progress_notes JSON DEFAULT '[]',
    outcome_measures JSON DEFAULT '[]',
    notes TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctorId UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_type VARCHAR(100) DEFAULT 'consultation',
    status enum_appointments_status DEFAULT 'SCHEDULED',
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    scheduled_end_time TIMESTAMPTZ NOT NULL,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    location VARCHAR(255),
    isVirtual BOOLEAN DEFAULT FALSE,
    virtual_meeting_url VARCHAR(500),
    virtual_meeting_id VARCHAR(255),
    chief_complaint TEXT,
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    cancellation_reason VARCHAR(255),
    reminder_sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor Availability
CREATE TABLE doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctorId UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    break_start TIME,
    break_end TIME,
    max_appointments_per_slot INTEGER DEFAULT 1,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctorId, day_of_week, startTime)
);

-- Appointment Slots (Pre-generated time slots)
CREATE TABLE appointment_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctorId UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    appointment_id UUID REFERENCES appointments(id),
    created_by UUID REFERENCES users(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctorId, slot_date, startTime)
);

-- =============================================
-- VITAL SIGNS AND MONITORING
-- =============================================

-- Vital Sign Templates
CREATE TABLE vital_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) NOT NULL,
    normalRangeMin DECIMAL(10,3),
    normalRangeMax DECIMAL(10,3),
    critical_low DECIMAL(10,3),
    critical_high DECIMAL(10,3),
    warning_low DECIMAL(10,3),
    warning_high DECIMAL(10,3),
    data_type VARCHAR(20) DEFAULT 'decimal',
    category VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Vital Signs
CREATE TABLE vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    vital_template_id UUID NOT NULL REFERENCES vital_templates(id),
    value DECIMAL(10,3) NOT NULL,
    systolic_value DECIMAL(5,2),
    diastolic_value DECIMAL(5,2),
    recorded_by UUID REFERENCES users(id),
    recordedAt TIMESTAMPTZ NOT NULL,
    device_info JSON,
    measurement_context JSON DEFAULT '{}',
    isCritical BOOLEAN DEFAULT FALSE,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_level VARCHAR(20),
    alert_reasons JSON DEFAULT '[]',
    notes TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLINICAL SERVICES AND BILLING
-- =============================================

-- Medical Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_code VARCHAR(50),
    category VARCHAR(100),
    doctorId UUID REFERENCES doctors(id),
    organization_id UUID REFERENCES organizations(id),
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    duration_minutes INTEGER DEFAULT 30,
    requires_appointment BOOLEAN DEFAULT TRUE,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Service Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    services JSON DEFAULT '[]',
    isActive BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Services
CREATE TABLE patient_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    assigned_by UUID NOT NULL REFERENCES doctors(id),
    startDate DATE NOT NULL,
    endDate DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Subscriptions
CREATE TABLE patient_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR(50) DEFAULT 'pending',
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DEVICE INTEGRATION TABLES
-- =============================================

-- User Devices (Mobile/Web)
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    device_name VARCHAR(255),
    push_token VARCHAR(500),
    platform VARCHAR(50),
    app_version VARCHAR(50),
    os_version VARCHAR(50),
    isActive BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(userId, device_id)
);

-- IoT Medical Devices
CREATE TABLE iot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID REFERENCES patients(id),
    device_type VARCHAR(100) NOT NULL,
    device_model VARCHAR(255),
    serial_number VARCHAR(255) UNIQUE,
    manufacturer VARCHAR(255),
    firmware_version VARCHAR(50),
    connection_type VARCHAR(50) DEFAULT 'bluetooth',
    status enum_device_status DEFAULT 'DISCONNECTED',
    last_sync_at TIMESTAMPTZ,
    battery_level INTEGER,
    device_settings JSON DEFAULT '{}',
    calibration_data JSON DEFAULT '{}',
    isActive BOOLEAN DEFAULT TRUE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- IoT Device Data
CREATE TABLE iot_device_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    patientId UUID NOT NULL REFERENCES patients(id),
    data_type VARCHAR(100) NOT NULL,
    raw_data JSON NOT NULL,
    processed_data JSON,
    measurement_timestamp TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    is_processed BOOLEAN DEFAULT FALSE,
    quality_score DECIMAL(3,2),
    anomaly_detected BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TELEMEDICINE TABLES
-- =============================================

-- Video Consultations
CREATE TABLE video_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id),
    meeting_id VARCHAR(255) UNIQUE NOT NULL,
    meeting_url VARCHAR(500),
    passcode VARCHAR(50),
    status enum_video_consultation_status DEFAULT 'SCHEDULED',
    platform VARCHAR(50) DEFAULT 'zoom',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    recording_url VARCHAR(500),
    recording_consent BOOLEAN DEFAULT FALSE,
    technical_issues JSON DEFAULT '[]',
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Test Catalog
CREATE TABLE lab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    description TEXT,
    preparation_instructions TEXT,
    normal_ranges JSON DEFAULT '{}',
    specimen_type VARCHAR(100),
    turnaround_time_hours INTEGER,
    cost DECIMAL(10,2),
    requires_fasting BOOLEAN DEFAULT FALSE,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Orders
CREATE TABLE lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id),
    doctorId UUID NOT NULL REFERENCES doctors(id),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    status enum_lab_test_status DEFAULT 'ORDERED',
    lab_tests JSON NOT NULL,
    clinical_notes TEXT,
    priority VARCHAR(20) DEFAULT 'routine',
    specimen_collected_at TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    actual_completion TIMESTAMPTZ,
    lab_facility VARCHAR(255),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Results
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES lab_orders(id),
    test_id UUID NOT NULL REFERENCES lab_tests(id),
    result_value VARCHAR(255),
    result_unit VARCHAR(50),
    reference_range VARCHAR(255),
    is_abnormal BOOLEAN DEFAULT FALSE,
    abnormal_flags JSON DEFAULT '[]',
    interpretation TEXT,
    reviewed_by UUID REFERENCES doctors(id),
    reviewed_at TIMESTAMPTZ,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMERGENCY AND ALERTS
-- =============================================

-- Emergency Alerts
CREATE TABLE emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id),
    alert_type VARCHAR(100) NOT NULL,
    severity enum_emergency_alert_severity NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    vital_data JSON,
    device_data JSON,
    location_data JSON,
    triggered_by VARCHAR(255),
    isActive BOOLEAN DEFAULT TRUE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Allergies
CREATE TABLE patient_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen VARCHAR(255) NOT NULL,
    allergy_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    reaction_description TEXT,
    date_identified DATE,
    identified_by UUID REFERENCES users(id),
    isActive BOOLEAN DEFAULT TRUE,
    notes TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT AND COMPLIANCE
-- =============================================

-- Audit Logs (HIPAA Compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    patientId UUID REFERENCES patients(id),
    phi_accessed BOOLEAN DEFAULT FALSE,
    accessGranted BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_data JSON,
    response_data JSON,
    data_changes JSON,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type enum_notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Consent Management
CREATE TABLE patient_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patientId UUID NOT NULL REFERENCES patients(id),
    consent_type VARCHAR(100) NOT NULL,
    consent_version VARCHAR(20),
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    consent_document JSON,
    ip_address INET,
    user_agent TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REPORTING AND ANALYTICS
-- =============================================

-- Chart Analytics (for dashboard insights)
CREATE TABLE chart_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_type VARCHAR(100) NOT NULL,
    patientId UUID REFERENCES patients(id),
    doctorId UUID REFERENCES doctors(id),
    organization_id UUID REFERENCES organizations(id),
    data_source VARCHAR(100) NOT NULL,
    metrics JSON NOT NULL,
    aggregation_period VARCHAR(50) NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Events (Cron-like tasks)
CREATE TABLE scheduled_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    userId UUID REFERENCES users(id),
    patientId UUID REFERENCES patients(id),
    scheduled_for TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending',
    event_data JSON DEFAULT '{}',
    result_data JSON,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_created_at ON users(createdAt);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Auth tables indexes
CREATE INDEX idx_accounts_user_id ON accounts(userId);
CREATE INDEX idx_accounts_provider ON accounts(provider, provider_account_id);
CREATE INDEX idx_sessions_user_id ON sessions(userId);
CREATE INDEX idx_sessions_expires ON sessions(expires);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);

-- Healthcare provider indexes
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_is_active ON organizations(isActive);

CREATE INDEX idx_doctors_user_id ON doctors(userId);
CREATE INDEX idx_doctors_doctor_id ON doctors(doctorId);
CREATE INDEX idx_doctors_speciality_id ON doctors(speciality_id);
CREATE INDEX idx_doctors_organization_id ON doctors(organization_id);
CREATE INDEX idx_doctors_is_accepting ON doctors(is_accepting_patients);

CREATE INDEX idx_patients_user_id ON patients(userId);
CREATE INDEX idx_patients_patient_id ON patients(patientId);
CREATE INDEX idx_patients_primaryCareDoctorId ON patients(primaryCareDoctorId);
CREATE INDEX idx_patients_medical_record_number ON patients(medicalRecordNumber);

CREATE INDEX idx_hsps_user_id ON hsps(userId);
CREATE INDEX idx_hsps_hsp_id ON hsps(hsp_id);
CREATE INDEX idx_hsps_organization_id ON hsps(organization_id);

-- Medical management indexes
CREATE INDEX idx_medications_patient_id ON medications(patientId);
CREATE INDEX idx_medications_medicine_id ON medications(medicine_id);
CREATE INDEX idx_medications_prescribed_by ON medications(prescribed_by);
CREATE INDEX idx_medications_is_active ON medications(isActive);
CREATE INDEX idx_medications_start_date ON medications(startDate);

CREATE INDEX idx_appointments_patient_id ON appointments(patientId);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctorId);
CREATE INDEX idx_appointments_scheduled_start_time ON appointments(scheduled_start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(scheduled_start_time::date);

CREATE INDEX idx_vitals_patient_id ON vitals(patientId);
CREATE INDEX idx_vitals_vital_template_id ON vitals(vital_template_id);
CREATE INDEX idx_vitals_recorded_at ON vitals(recordedAt);
CREATE INDEX idx_vitals_is_critical ON vitals(isCritical);

CREATE INDEX idx_care_plans_patient_id ON carePlans(patientId);
CREATE INDEX idx_care_plans_doctor_id ON carePlans(doctorId);
CREATE INDEX idx_care_plans_status ON carePlans(status);

-- Device and IoT indexes
CREATE INDEX idx_iot_devices_patient_id ON iot_devices(patientId);
CREATE INDEX idx_iot_devices_device_type ON iot_devices(device_type);
CREATE INDEX idx_iot_devices_status ON iot_devices(status);
CREATE INDEX idx_iot_device_data_device_id ON iot_device_data(device_id);
CREATE INDEX idx_iot_device_data_patient_id ON iot_device_data(patientId);
CREATE INDEX idx_iot_device_data_timestamp ON iot_device_data(measurement_timestamp);

-- Telemedicine indexes
CREATE INDEX idx_video_consultations_appointment_id ON video_consultations(appointment_id);
CREATE INDEX idx_lab_orders_patient_id ON lab_orders(patientId);
CREATE INDEX idx_lab_orders_doctor_id ON lab_orders(doctorId);
CREATE INDEX idx_lab_orders_status ON lab_orders(status);
CREATE INDEX idx_lab_results_lab_order_id ON lab_results(lab_order_id);

-- Emergency and alerts indexes
CREATE INDEX idx_emergency_alerts_patient_id ON emergency_alerts(patientId);
CREATE INDEX idx_emergency_alerts_severity ON emergency_alerts(severity);
CREATE INDEX idx_emergency_alerts_is_active ON emergency_alerts(isActive);
CREATE INDEX idx_emergency_alerts_created_at ON emergency_alerts(createdAt);

-- Audit and compliance indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(userId);
CREATE INDEX idx_audit_logs_patient_id ON audit_logs(patientId);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_phi_accessed ON audit_logs(phi_accessed) WHERE phi_accessed = true;

CREATE INDEX idx_notifications_user_id ON notifications(userId);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(createdAt);

-- Scheduled events indexes
CREATE INDEX idx_scheduled_events_scheduled_for ON scheduled_events(scheduled_for);
CREATE INDEX idx_scheduled_events_status ON scheduled_events(status);
CREATE INDEX idx_scheduled_events_event_type ON scheduled_events(event_type);

-- =============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply triggers to all tables with updatedAt columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hsps_updated_at BEFORE UPDATE ON hsps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON carePlans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON user_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iot_devices_updated_at BEFORE UPDATE ON iot_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_consultations_updated_at BEFORE UPDATE ON video_consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON lab_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_allergies_updated_at BEFORE UPDATE ON patient_allergies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_events_updated_at BEFORE UPDATE ON scheduled_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL SEED DATA
-- =============================================

-- Medical Specialties
INSERT INTO specialities (id, name, description, is_primary_care) VALUES
    (gen_random_uuid(), 'Family Medicine', 'Comprehensive primary care for patients of all ages', true),
    (gen_random_uuid(), 'Internal Medicine', 'Primary care focused on adult patients', true),
    (gen_random_uuid(), 'Pediatrics', 'Medical care for infants, children, and adolescents', false),
    (gen_random_uuid(), 'Cardiology', 'Heart and cardiovascular system disorders', false),
    (gen_random_uuid(), 'Dermatology', 'Skin, hair, and nail conditions', false),
    (gen_random_uuid(), 'Orthopedics', 'Musculoskeletal system and sports medicine', false),
    (gen_random_uuid(), 'Psychiatry', 'Mental health and behavioral disorders', false),
    (gen_random_uuid(), 'Emergency Medicine', 'Acute care and emergency treatment', false),
    (gen_random_uuid(), 'Obstetrics and Gynecology', 'Women''s reproductive health', false),
    (gen_random_uuid(), 'Neurology', 'Nervous system disorders', false),
    (gen_random_uuid(), 'Oncology', 'Cancer treatment and care', false),
    (gen_random_uuid(), 'Endocrinology', 'Hormone and metabolism disorders', false);

-- Vital Sign Templates
INSERT INTO vital_templates (id, name, unit, normalRangeMin, normalRangeMax, critical_low, critical_high, warning_low, warning_high, category) VALUES
    (gen_random_uuid(), 'Blood Pressure Systolic', 'mmHg', 90, 140, 70, 180, 80, 160, 'cardiovascular'),
    (gen_random_uuid(), 'Blood Pressure Diastolic', 'mmHg', 60, 90, 40, 120, 50, 100, 'cardiovascular'),
    (gen_random_uuid(), 'Heart Rate', 'bpm', 60, 100, 40, 150, 50, 120, 'cardiovascular'),
    (gen_random_uuid(), 'Body Temperature', '°F', 97.0, 99.5, 95.0, 104.0, 96.0, 102.0, 'general'),
    (gen_random_uuid(), 'Weight', 'lbs', 100, 300, 80, 400, 90, 350, 'general'),
    (gen_random_uuid(), 'Height', 'inches', 48, 84, 36, 96, 40, 90, 'general'),
    (gen_random_uuid(), 'Oxygen Saturation', '%', 95, 100, 85, 100, 90, 100, 'respiratory'),
    (gen_random_uuid(), 'Respiratory Rate', 'breaths/min', 12, 20, 8, 30, 10, 25, 'respiratory'),
    (gen_random_uuid(), 'BMI', 'kg/m²', 18.5, 25.0, 15.0, 40.0, 16.0, 35.0, 'general');

-- Common Lab Tests
INSERT INTO lab_tests (id, name, code, category, description, specimen_type, turnaround_time_hours, requires_fasting) VALUES
    (gen_random_uuid(), 'Complete Blood Count', 'CBC', 'Hematology', 'Comprehensive blood cell analysis', 'Blood', 4, false),
    (gen_random_uuid(), 'Basic Metabolic Panel', 'BMP', 'Chemistry', 'Basic chemistry panel including glucose and electrolytes', 'Blood', 4, true),
    (gen_random_uuid(), 'Lipid Panel', 'LIPID', 'Chemistry', 'Cholesterol and triglyceride levels', 'Blood', 6, true),
    (gen_random_uuid(), 'Thyroid Stimulating Hormone', 'TSH', 'Endocrinology', 'Thyroid function test', 'Blood', 8, false),
    (gen_random_uuid(), 'Hemoglobin A1C', 'HBA1C', 'Chemistry', 'Average blood glucose over 2-3 months', 'Blood', 6, false),
    (gen_random_uuid(), 'Urinalysis', 'UA', 'Urology', 'Comprehensive urine analysis', 'Urine', 2, false);

-- =============================================
-- USEFUL VIEWS FOR COMMON QUERIES
-- =============================================

-- Active Healthcare Providers
CREATE VIEW v_active_healthcare_providers AS
SELECT 
    u.id as userId,
    u.email,
    u.firstName,
    u.lastName,
    u.role,
    CASE 
        WHEN u.role = 'DOCTOR' THEN d.doctorId
        WHEN u.role = 'HSP' THEN h.hsp_id
        ELSE NULL
    END as business_id,
    CASE 
        WHEN u.role = 'DOCTOR' THEN d.speciality_id
        ELSE NULL
    END as speciality_id,
    s.name as speciality_name,
    CASE 
        WHEN u.role = 'DOCTOR' THEN d.organization_id
        WHEN u.role = 'HSP' THEN h.organization_id
        ELSE NULL
    END as organization_id,
    o.name as organization_name
FROM users u
LEFT JOIN doctors d ON u.id = d.userId AND u.role = 'DOCTOR'
LEFT JOIN hsps h ON u.id = h.userId AND u.role = 'HSP'
LEFT JOIN specialities s ON d.speciality_id = s.id
LEFT JOIN organizations o ON COALESCE(d.organization_id, h.organization_id) = o.id
WHERE u.role IN ('DOCTOR', 'HSP') 
AND u.account_status = 'ACTIVE'
AND u.deleted_at IS NULL;

-- Patient Summary with Medical Info
CREATE VIEW v_patient_summary AS
SELECT 
    p.id,
    p.patientId,
    u.firstName,
    u.lastName,
    u.email,
    u.phone,
    u.date_of_birth,
    DATE_PART('year', AGE(u.date_of_birth)) as age,
    p.blood_type,
    p.height_cm,
    p.weight_kg,
    p.bmi,
    p.primaryCareDoctorId,
    d.doctorId as primary_doctor_business_id,
    du.firstName as primary_doctor_first_name,
    du.lastName as primary_doctor_last_name,
    COUNT(m.id) as active_medications,
    MAX(v.recordedAt) as last_vital_recorded,
    COUNT(CASE WHEN a.status = 'SCHEDULED' AND a.scheduled_start_time > NOW() THEN 1 END) as upcoming_appointments
FROM patients p
JOIN users u ON p.userId = u.id
LEFT JOIN doctors d ON p.primaryCareDoctorId = d.id
LEFT JOIN users du ON d.userId = du.id
LEFT JOIN medications m ON p.id = m.patientId AND m.isActive = true
LEFT JOIN vitals v ON p.id = v.patientId
LEFT JOIN appointments a ON p.id = a.patientId
WHERE u.account_status = 'ACTIVE' AND u.deleted_at IS NULL
GROUP BY p.id, p.patientId, u.firstName, u.lastName, u.email, u.phone,
         u.date_of_birth, p.blood_type, p.height_cm, p.weight_kg, p.bmi,
         p.primaryCareDoctorId, d.doctorId, du.firstName, du.lastName;

-- Critical Alerts Summary
CREATE VIEW v_critical_alerts AS
SELECT 
    ea.id,
    ea.patientId,
    p.patientId as patient_business_id,
    u.firstName || ' ' || u.lastName as patient_name,
    ea.alert_type,
    ea.severity,
    ea.title,
    ea.description,
    ea.isActive,
    ea.acknowledged_by,
    ea.acknowledged_at,
    ea.createdAt
FROM emergency_alerts ea
JOIN patients p ON ea.patientId = p.id
JOIN users u ON p.userId = u.id
WHERE ea.isActive = true
ORDER BY 
    CASE ea.severity 
        WHEN 'CRITICAL' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'MEDIUM' THEN 3 
        WHEN 'LOW' THEN 4 
    END,
    ea.createdAt DESC;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON SCHEMA public IS 'Healthcare Management Platform - Complete Schema with Auth.js v5 Support';
COMMENT ON TABLE users IS 'Main users table compatible with Auth.js v5 and healthcare roles';
COMMENT ON TABLE accounts IS 'Auth.js v5 OAuth provider accounts';
COMMENT ON TABLE sessions IS 'Auth.js v5 database sessions for enhanced security';
COMMENT ON TABLE verification_tokens IS 'Auth.js v5 email verification and password reset tokens';
COMMENT ON TABLE organizations IS 'Healthcare organizations, hospitals, and clinics with HIPAA compliance';
COMMENT ON TABLE doctors IS 'Medical doctors with licensing, specialty, and practice information';
COMMENT ON TABLE patients IS 'Patient profiles with comprehensive medical information';
COMMENT ON TABLE hsps IS 'Health Service Providers (nurses, therapists, technicians)';
COMMENT ON TABLE medications IS 'Patient medication prescriptions with adherence tracking';
COMMENT ON TABLE appointments IS 'Medical appointments with telemedicine support';
COMMENT ON TABLE vitals IS 'Patient vital signs with IoT device integration';
COMMENT ON TABLE iot_devices IS 'IoT medical devices for remote patient monitoring';
COMMENT ON TABLE video_consultations IS 'Telemedicine video consultation sessions';
COMMENT ON TABLE emergency_alerts IS 'Critical health alerts and emergency notifications';
COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit logging for all system activities';
COMMENT ON TABLE lab_orders IS 'Laboratory test orders and results integration';

-- =============================================
-- SCHEMA VERSION AND METADATA
-- =============================================

CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('20250814_auth_js_v5_healthcare_full_schema');

-- End of Healthcare Management Platform Schema