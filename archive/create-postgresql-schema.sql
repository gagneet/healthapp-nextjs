-- PostgreSQL Schema Creation Script
-- Healthcare Adherence Management Platform
-- 
-- This script creates the complete PostgreSQL schema for the healthcare platform
-- including all tables, indexes, constraints, and HIPAA compliance features.

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom ENUMs
CREATE TYPE user_role AS ENUM (
    'SYSTEM_ADMIN',
    'HOSPITAL_ADMIN', 
    'DOCTOR',
    'HSP',
    'PATIENT',
    'CAREGIVER'
);

CREATE TYPE account_status AS ENUM (
    'PENDING_VERIFICATION',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'DEACTIVATED'
);

CREATE TYPE gender AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER',
    'PREFER_NOT_TO_SAY'
);

CREATE TYPE appointment_status AS ENUM (
    'SCHEDULED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'RESCHEDULED'
);

CREATE TYPE care_plan_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE event_status AS ENUM (
    'SCHEDULED',
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'MISSED',
    'CANCELLED',
    'EXPIRED'
);

CREATE TYPE priority_level AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE notification_channel AS ENUM (
    'PUSH',
    'SMS',
    'EMAIL',
    'VOICE_CALL'
);

CREATE TYPE organization_type AS ENUM (
    'hospital',
    'clinic',
    'practice',
    'health_system',
    'telehealth'
);

CREATE TYPE hsp_type AS ENUM (
    'registered_nurse',
    'licensed_practical_nurse',
    'nurse_practitioner',
    'physician_assistant',
    'clinical_pharmacist',
    'care_coordinator',
    'social_worker',
    'dietitian',
    'physical_therapist',
    'occupational_therapist',
    'respiratory_therapist',
    'medical_assistant',
    'other'
);

-- Organizations table (multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type organization_type DEFAULT 'clinic',
    license_number VARCHAR(100) UNIQUE,
    contact_info JSONB DEFAULT '{}',
    address JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    isActive BOOLEAN DEFAULT TRUE,
    hipaa_covered_entity BOOLEAN DEFAULT TRUE,
    business_associate_agreement JSONB,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Users table (enhanced with HIPAA compliance)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    account_status account_status DEFAULT 'PENDING_VERIFICATION',
    
    -- Profile Information
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    middle_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender gender,
    
    -- Security fields
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    profilePictureUrl VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    preferences JSONB DEFAULT '{}',
    
    -- HIPAA Compliance fields
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
    hipaa_consent_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Doctors table (licensed physicians)
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    -- Professional Information
    medical_license_number VARCHAR(100) UNIQUE NOT NULL,
    npi_number VARCHAR(20) UNIQUE,
    boardCertifications TEXT[] DEFAULT '{}',
    medical_school VARCHAR(255),
    residency_programs JSONB DEFAULT '[]',
    specialties TEXT[] DEFAULT '{}',
    sub_specialties TEXT[] DEFAULT '{}',
    years_of_experience INTEGER,
    
    -- Capabilities (all doctors have full medical capabilities)
    capabilities TEXT[] DEFAULT '{prescribe_medications,order_tests,diagnose,create_treatment_plans,create_care_plans,modify_medications,monitor_vitals,patient_education,care_coordination,emergency_response}',
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB DEFAULT '[]',
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    
    -- Professional Settings
    consultation_fee DECIMAL(10,2),
    availability_schedule JSONB DEFAULT '{}',
    languages_spoken TEXT[] DEFAULT '{en}',
    notification_preferences JSONB DEFAULT '{}',
    
    -- Practice Information
    practice_name VARCHAR(255),
    practice_address JSONB DEFAULT '{}',
    practice_phone VARCHAR(20),
    signature_pic TEXT,
    razorpay_account_id VARCHAR(255),
    
    -- Statistics
    total_patients INTEGER DEFAULT 0,
    active_treatment_plans INTEGER DEFAULT 0,
    active_care_plans INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    is_available_online BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- HSPs table (Healthcare Support Personnel)
CREATE TABLE hsps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    -- HSP Type and Qualifications
    hsp_type hsp_type NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    certification_number VARCHAR(100),
    certifications TEXT[] DEFAULT '{}',
    education JSONB DEFAULT '[]',
    specializations TEXT[] DEFAULT '{}',
    years_of_experience INTEGER,
    
    -- Capabilities (varies by HSP type)
    capabilities TEXT[] DEFAULT '{monitor_vitals,patient_education,care_coordination}',
    
    -- Supervision Requirements
    requires_supervision BOOLEAN DEFAULT TRUE,
    supervising_doctor_id UUID REFERENCES doctors(id),
    supervision_level VARCHAR(20) DEFAULT 'direct',
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB DEFAULT '[]',
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    
    -- Professional Settings
    hourly_rate DECIMAL(8,2),
    availability_schedule JSONB DEFAULT '{}',
    languages_spoken TEXT[] DEFAULT '{en}',
    notification_preferences JSONB DEFAULT '{}',
    
    -- Work Environment
    departments TEXT[] DEFAULT '{}',
    shift_preferences JSONB DEFAULT '{}',
    
    -- Statistics
    total_patients_assisted INTEGER DEFAULT 0,
    active_care_plans INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Patients table (enhanced with JSONB fields)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    -- Medical Information
    medicalRecordNumber VARCHAR(50) UNIQUE,
    emergency_contacts JSONB DEFAULT '[]',
    insurance_information JSONB DEFAULT '{}',
    medical_history JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    current_medications JSONB DEFAULT '[]',
    
    -- Physical Measurements
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    blood_type VARCHAR(5),
    primary_language VARCHAR(10) DEFAULT 'en',
    
    -- Risk Assessment
    risk_level VARCHAR(20) DEFAULT 'low',
    risk_factors JSONB DEFAULT '[]',
    
    -- Settings
    communication_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    
    -- Care Coordination (updated to support both doctors and HSPs)
    primaryCareDoctorId UUID REFERENCES doctors(id),
    primary_care_hsp_id UUID REFERENCES hsps(id),
    care_coordinator_id UUID,
    care_coordinator_type VARCHAR(10),
    
    -- Analytics and Tracking
    overallAdherenceScore DECIMAL(5,2),
    last_adherence_calculation TIMESTAMP WITH TIME ZONE,
    total_appointments INTEGER DEFAULT 0,
    missed_appointments INTEGER DEFAULT 0,
    last_visit_date TIMESTAMP WITH TIME ZONE,
    next_appointment_date TIMESTAMP WITH TIME ZONE,
    
    -- Status flags
    isActive BOOLEAN DEFAULT TRUE,
    requires_interpreter BOOLEAN DEFAULT FALSE,
    has_mobility_issues BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Treatment Plans table (short-term, acute issues)
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctorId UUID NOT NULL REFERENCES doctors(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    plan_type VARCHAR(20) DEFAULT 'treatment_plan',
    
    -- Medical Context
    primary_diagnosis VARCHAR(255) NOT NULL,
    secondary_diagnoses TEXT[] DEFAULT '{}',
    chief_complaint TEXT,
    symptoms JSONB DEFAULT '[]',
    
    -- Treatment Details
    treatment_goals JSONB DEFAULT '[]',
    interventions JSONB DEFAULT '[]',
    medications JSONB DEFAULT '[]',
    instructions TEXT,
    
    -- Timeline
    startDate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_duration_days INTEGER,
    endDate TIMESTAMP WITH TIME ZONE,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT TRUE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_instructions TEXT,
    
    -- Status and Priority
    status VARCHAR(20) DEFAULT 'ACTIVE',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    
    -- Progress Tracking
    progress_notes JSONB DEFAULT '[]',
    completion_percentage INTEGER DEFAULT 0,
    outcome TEXT,
    
    -- Emergency Information
    emergency_contacts JSONB DEFAULT '[]',
    warning_signs TEXT[] DEFAULT '{}',
    
    -- Collaboration
    assigned_hsps UUID[] DEFAULT '{}',
    care_team_notes JSONB DEFAULT '[]',
    
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Care Plans table (long-term, chronic conditions)
CREATE TABLE carePlans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_by_doctor_id UUID REFERENCES doctors(id),
    created_by_hsp_id UUID REFERENCES hsps(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    plan_type VARCHAR(20) DEFAULT 'care_plan',
    
    -- Chronic Condition Management
    chronic_conditions TEXT[] DEFAULT '{}',
    condition_severity JSONB DEFAULT '{}',
    risk_factors JSONB DEFAULT '[]',
    
    -- Long-term Goals and Management
    long_term_goals JSONB DEFAULT '[]',
    short_term_milestones JSONB DEFAULT '[]',
    interventions JSONB DEFAULT '[]',
    lifestyle_modifications JSONB DEFAULT '[]',
    
    -- Monitoring and Tracking
    monitoring_parameters JSONB DEFAULT '[]',
    monitoring_frequency JSONB DEFAULT '{}',
    target_values JSONB DEFAULT '{}',
    
    -- Medications (long-term)
    medications JSONB DEFAULT '[]',
    medication_management JSONB DEFAULT '{}',
    
    -- Timeline (long-term)
    startDate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    endDate TIMESTAMP WITH TIME ZONE,
    review_frequency_months INTEGER DEFAULT 3,
    next_review_date TIMESTAMP WITH TIME ZONE,
    
    -- Status and Priority
    status care_plan_status DEFAULT 'ACTIVE',
    priority priority_level DEFAULT 'MEDIUM',
    
    -- Care Team
    primary_care_manager_id UUID,
    care_team_members JSONB DEFAULT '[]',
    specialist_referrals JSONB DEFAULT '[]',
    
    -- Patient Engagement
    patient_education_materials JSONB DEFAULT '[]',
    self_management_tasks JSONB DEFAULT '[]',
    patient_goals JSONB DEFAULT '[]',
    
    -- Progress and Outcomes
    progress_notes JSONB DEFAULT '[]',
    outcome_measures JSONB DEFAULT '{}',
    quality_of_life_scores JSONB DEFAULT '{}',
    
    -- Emergency Planning
    emergency_action_plan JSONB DEFAULT '{}',
    warning_signs TEXT[] DEFAULT '{}',
    emergency_contacts JSONB DEFAULT '[]',
    
    -- Legacy fields for backward compatibility
    details JSONB,
    channel_id VARCHAR(255),
    
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure either doctor or HSP created the plan
    CONSTRAINT care_plan_creator_check CHECK (
        (created_by_doctor_id IS NOT NULL AND created_by_hsp_id IS NULL) OR
        (created_by_doctor_id IS NULL AND created_by_hsp_id IS NOT NULL)
    )
);

-- Prescriptions table (formal prescription management)
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    prescribing_doctor_id UUID REFERENCES doctors(id),
    prescribing_hsp_id UUID REFERENCES hsps(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Prescription Identification
    prescription_number VARCHAR(100) UNIQUE NOT NULL,
    external_prescription_id VARCHAR(100),
    
    -- Medication Information
    medication_name VARCHAR(255) NOT NULL,
    genericName VARCHAR(255),
    ndc_number VARCHAR(20),
    rxnorm_code VARCHAR(20),
    
    -- Dosage and Administration
    strength VARCHAR(50) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL,
    route_of_administration VARCHAR(30) NOT NULL,
    dose_amount DECIMAL(10,3) NOT NULL,
    dose_unit VARCHAR(20) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    frequency_per_day INTEGER,
    dosing_schedule JSONB DEFAULT '[]',
    
    -- Instructions
    sig_instructions TEXT NOT NULL,
    patient_instructions TEXT,
    food_instructions VARCHAR(100),
    
    -- Quantity and Refills
    quantity_prescribed INTEGER NOT NULL,
    quantity_unit VARCHAR(20) NOT NULL,
    days_supply INTEGER,
    refills_allowed INTEGER DEFAULT 0,
    refills_used INTEGER DEFAULT 0,
    
    -- Clinical Information
    indication VARCHAR(255),
    diagnosis_codes TEXT[] DEFAULT '{}',
    
    -- Controlled Substance Information
    is_controlled_substance BOOLEAN DEFAULT FALSE,
    dea_schedule VARCHAR(5),
    
    -- Dates
    prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    startDate TIMESTAMP WITH TIME ZONE,
    endDate TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    discontinuation_reason VARCHAR(100),
    
    -- Pharmacy Information
    pharmacy_id UUID,
    pharmacy_name VARCHAR(255),
    pharmacy_phone VARCHAR(20),
    
    -- Electronic Prescribing
    e_prescribing_id VARCHAR(100),
    transmitted_to_pharmacy BOOLEAN DEFAULT FALSE,
    transmission_date TIMESTAMP WITH TIME ZONE,
    
    -- Cost and Insurance
    estimated_cost DECIMAL(10,2),
    insurance_coverage JSONB DEFAULT '{}',
    
    -- Safety and Interactions
    drug_interactions JSONB DEFAULT '[]',
    allergy_alerts JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    
    -- Provider Information
    prescriber_npi VARCHAR(20),
    prescriber_dea VARCHAR(20),
    electronic_signature TEXT,
    
    -- Monitoring
    requires_monitoring BOOLEAN DEFAULT FALSE,
    monitoring_parameters JSONB DEFAULT '[]',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure either doctor or HSP prescribed
    CONSTRAINT prescription_prescriber_check CHECK (
        (prescribing_doctor_id IS NOT NULL AND prescribing_hsp_id IS NULL) OR
        (prescribing_doctor_id IS NULL AND prescribing_hsp_id IS NOT NULL)
    )
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctorId UUID REFERENCES doctors(id),
    hsp_id UUID REFERENCES hsps(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Notification Content
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority priority_level DEFAULT 'MEDIUM',
    is_urgent BOOLEAN DEFAULT FALSE,
    
    -- Delivery Channels
    channels TEXT[] DEFAULT '{PUSH}',
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery Status
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_attempts INTEGER DEFAULT 0,
    delivery_log JSONB DEFAULT '[]',
    
    -- User Interaction
    read_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Related Records
    related_appointment_id UUID,
    related_medication_id UUID,
    related_care_plan_id UUID REFERENCES carePlans(id),
    related_treatment_plan_id UUID REFERENCES treatment_plans(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    requires_action BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    action_taken BOOLEAN DEFAULT FALSE,
    action_taken_at TIMESTAMP WITH TIME ZONE,
    
    -- Templates
    template_id VARCHAR(100),
    personalization_data JSONB DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Adherence Logs table
CREATE TABLE adherence_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    -- Type of adherence being tracked
    adherence_type VARCHAR(30) NOT NULL,
    
    -- Related Records
    related_medication_id UUID,
    related_appointment_id UUID,
    related_care_plan_id UUID REFERENCES carePlans(id),
    related_treatment_plan_id UUID REFERENCES treatment_plans(id),
    
    -- Timing Information
    scheduled_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_datetime TIMESTAMP WITH TIME ZONE,
    
    -- Adherence Status
    status VARCHAR(20) NOT NULL,
    completion_percentage INTEGER DEFAULT 0,
    delay_minutes INTEGER,
    
    -- Medication-Specific Fields
    prescribed_dose DECIMAL(10,3),
    actual_dose DECIMAL(10,3),
    dose_unit VARCHAR(20),
    
    -- Patient-Reported Information
    patient_notes TEXT,
    side_effects_reported JSONB DEFAULT '[]',
    symptoms_before JSONB DEFAULT '{}',
    symptoms_after JSONB DEFAULT '{}',
    
    -- Reason for Non-Adherence
    missed_reason VARCHAR(50),
    missed_reason_details TEXT,
    
    -- Data Source
    recorded_by VARCHAR(20) DEFAULT 'patient',
    recorded_by_user_id UUID REFERENCES users(id),
    device_id UUID,
    verification_method VARCHAR(30),
    
    -- Mood and Context
    mood_before INTEGER,
    mood_after INTEGER,
    location VARCHAR(100),
    
    -- Reminders and Interventions
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_acknowledged BOOLEAN DEFAULT FALSE,
    intervention_triggered BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Lab Results table
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ordering_doctor_id UUID REFERENCES doctors(id),
    ordering_hsp_id UUID REFERENCES hsps(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Test Identification
    order_number VARCHAR(100) UNIQUE NOT NULL,
    accession_number VARCHAR(100),
    external_id VARCHAR(100),
    
    -- Test Information
    test_category VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50),
    test_type VARCHAR(30) NOT NULL,
    
    -- Specimen Information
    specimen_type VARCHAR(50),
    specimen_source VARCHAR(100),
    collection_method VARCHAR(50),
    collection_datetime TIMESTAMP WITH TIME ZONE,
    
    -- Results Data
    individual_results JSONB DEFAULT '[]',
    overall_result TEXT,
    
    -- Status and Timing
    status VARCHAR(20) DEFAULT 'ordered',
    ordered_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resulted_datetime TIMESTAMP WITH TIME ZONE,
    reviewed_datetime TIMESTAMP WITH TIME ZONE,
    reviewed_by_doctor_id UUID REFERENCES doctors(id),
    reviewed_by_hsp_id UUID REFERENCES hsps(id),
    
    -- Clinical Context
    indication TEXT,
    diagnosis_codes TEXT[] DEFAULT '{}',
    clinical_notes TEXT,
    
    -- Critical Values and Alerts
    has_critical_values BOOLEAN DEFAULT FALSE,
    critical_values JSONB DEFAULT '[]',
    abnormal_flags JSONB DEFAULT '[]',
    
    -- Laboratory Information
    performing_lab VARCHAR(255),
    lab_director VARCHAR(255),
    lab_contact JSONB DEFAULT '{}',
    
    -- Quality and Validation
    quality_control JSONB DEFAULT '{}',
    reference_ranges JSONB DEFAULT '{}',
    methodology TEXT,
    
    -- Provider Actions
    provider_comments TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_instructions TEXT,
    
    -- Patient Communication
    patient_notified BOOLEAN DEFAULT FALSE,
    patient_notification_date TIMESTAMP WITH TIME ZONE,
    patient_notification_method VARCHAR(20),
    
    -- Document Management
    result_document_url VARCHAR(500),
    images JSONB DEFAULT '[]',
    
    -- Integration
    hl7_message TEXT,
    fhir_resource JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure either doctor or HSP ordered the test
    CONSTRAINT lab_result_orderer_check CHECK (
        (ordering_doctor_id IS NOT NULL AND ordering_hsp_id IS NULL) OR
        (ordering_doctor_id IS NULL AND ordering_hsp_id IS NOT NULL)
    )
);

-- Medical Devices table
CREATE TABLE medical_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID REFERENCES patients(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id),
    assigned_by_doctor_id UUID REFERENCES doctors(id),
    assigned_by_hsp_id UUID REFERENCES hsps(id),
    
    -- Device Identification
    device_name VARCHAR(255) NOT NULL,
    deviceType VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    model_number VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    firmware_version VARCHAR(50),
    
    -- FDA and Regulatory
    fda_number VARCHAR(50),
    is_fda_approved BOOLEAN DEFAULT TRUE,
    device_class VARCHAR(10),
    
    -- Device Status
    status VARCHAR(20) DEFAULT 'active',
    is_connected BOOLEAN DEFAULT FALSE,
    last_sync TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER,
    
    -- Connectivity Information
    connection_type VARCHAR(30),
    mac_address VARCHAR(17),
    device_identifier VARCHAR(100),
    
    -- Measurement Capabilities
    measurement_types TEXT[] DEFAULT '{}',
    measurement_units JSONB DEFAULT '{}',
    measurement_ranges JSONB DEFAULT '{}',
    
    -- Configuration
    device_settings JSONB DEFAULT '{}',
    measurement_frequency VARCHAR(50),
    reminder_settings JSONB DEFAULT '{}',
    
    -- Data Integration
    api_endpoint VARCHAR(500),
    api_credentials JSONB,
    data_format VARCHAR(20),
    
    -- Maintenance and Calibration
    last_maintenance TIMESTAMP WITH TIME ZONE,
    next_maintenance TIMESTAMP WITH TIME ZONE,
    last_calibration TIMESTAMP WITH TIME ZONE,
    next_calibration TIMESTAMP WITH TIME ZONE,
    maintenance_notes TEXT,
    
    -- Warranty and Support
    purchase_date TIMESTAMP WITH TIME ZONE,
    warranty_expiration TIMESTAMP WITH TIME ZONE,
    support_contact JSONB DEFAULT '{}',
    
    -- Usage Statistics
    total_measurements INTEGER DEFAULT 0,
    last_measurement_date TIMESTAMP WITH TIME ZONE,
    usage_statistics JSONB DEFAULT '{}',
    
    -- Alerts and Notifications
    alert_thresholds JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    
    -- Location and Environment
    location VARCHAR(255),
    environment_conditions JSONB DEFAULT '{}',
    
    -- Security
    encryption_enabled BOOLEAN DEFAULT FALSE,
    access_permissions JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    assigned_date TIMESTAMP WITH TIME ZONE,
    activation_date TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- HIPAA Audit Logs table (no soft delete for compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    patientId UUID REFERENCES patients(id),
    
    -- Action Details
    action VARCHAR(10) NOT NULL,
    resource VARCHAR(500) NOT NULL,
    user_role VARCHAR(50),
    phi_accessed BOOLEAN DEFAULT FALSE,
    accessGranted BOOLEAN NOT NULL,
    denial_reason TEXT,
    
    -- Technical Details
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id UUID,
    
    -- Data Changes
    data_changes JSONB,
    
    -- Security and Compliance
    encrypted_data JSONB,
    risk_level VARCHAR(10) DEFAULT 'low',
    security_alerts JSONB DEFAULT '[]',
    
    -- Compliance Tracking
    retention_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps (no soft delete)
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legacy tables (keep for backward compatibility during migration)
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID REFERENCES patients(id),
    name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    instructions TEXT,
    startDate TIMESTAMP WITH TIME ZONE,
    endDate TIMESTAMP WITH TIME ZONE,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID REFERENCES patients(id),
    doctorId UUID REFERENCES doctors(id),
    hsp_id UUID REFERENCES hsps(id),
    appointment_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status DEFAULT 'SCHEDULED',
    notes TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID REFERENCES patients(id),
    care_plan_id UUID REFERENCES carePlans(id),
    vitalType VARCHAR(50),
    value DECIMAL(10,3),
    unit VARCHAR(20),
    recordedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES users(id),
    device_id UUID REFERENCES medical_devices(id),
    notes TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_active ON organizations(isActive);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctors_user_id ON doctors(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctors_organization ON doctors(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctors_license ON doctors(medical_license_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctors_verified ON doctors(is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctors_specialties ON doctors USING GIN(specialties);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hsps_user_id ON hsps(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hsps_organization ON hsps(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hsps_type ON hsps(hsp_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hsps_supervisor ON hsps(supervising_doctor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hsps_verified ON hsps(is_verified);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_user_id ON patients(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_organization ON patients(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_mrn ON patients(medicalRecordNumber);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_primary_doctor ON patients(primaryCareDoctorId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_primary_hsp ON patients(primary_care_hsp_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_active ON patients(isActive);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_allergies ON patients USING GIN(allergies);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patientId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_doctor ON treatment_plans(doctorId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_plans_start_date ON treatment_plans(startDate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plans_patient ON carePlans(patientId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plans_doctor ON carePlans(created_by_doctor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plans_hsp ON carePlans(created_by_hsp_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plans_status ON carePlans(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plans_review_date ON carePlans(next_review_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patientId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(prescribing_doctor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_hsp ON prescriptions(prescribing_hsp_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_number ON prescriptions(prescription_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_patient ON notifications(patientId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adherence_logs_patient ON adherence_logs(patientId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adherence_logs_type ON adherence_logs(adherence_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adherence_logs_scheduled ON adherence_logs(scheduled_datetime);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_adherence_logs_status ON adherence_logs(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_results_patient ON lab_results(patientId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_results_order_number ON lab_results(order_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_results_status ON lab_results(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_results_critical ON lab_results(has_critical_values);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_devices_patient ON medical_devices(patientId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_devices_type ON medical_devices(deviceType);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_devices_status ON medical_devices(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_devices_connected ON medical_devices(is_connected);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user ON audit_logs(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_patient ON audit_logs(patientId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_phi ON audit_logs(phi_accessed);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_retention ON audit_logs(retention_date);

-- Create triggers for updatedAt timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updatedAt
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hsps_updated_at BEFORE UPDATE ON hsps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON carePlans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_adherence_logs_updated_at BEFORE UPDATE ON adherence_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON lab_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_devices_updated_at BEFORE UPDATE ON medical_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vitals_updated_at BEFORE UPDATE ON vitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) for multi-tenant data isolation
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsps ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE carePlans ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE adherence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_devices ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (would be customized based on specific requirements)
CREATE POLICY organization_isolation ON users
    FOR ALL TO authenticated_user
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY patient_data_isolation ON patients
    FOR ALL TO authenticated_user
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Create application roles
CREATE ROLE healthcare_app_user;
CREATE ROLE healthcare_admin;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO healthcare_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO healthcare_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO healthcare_app_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO healthcare_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO healthcare_admin;

-- Create views for common queries
CREATE VIEW active_patients AS
SELECT p.*, u.firstName, u.lastName, u.email, u.phone
FROM patients p
JOIN users u ON p.userId = u.id
WHERE p.isActive = TRUE AND p.deleted_at IS NULL AND u.deleted_at IS NULL;

CREATE VIEW verified_providers AS
SELECT 'doctor' as provider_type, d.id, d.userId, d.organization_id, u.firstName, u.lastName, d.specialties
FROM doctors d
JOIN users u ON d.userId = u.id
WHERE d.is_verified = TRUE AND d.deleted_at IS NULL
UNION ALL
SELECT 'hsp' as provider_type, h.id, h.userId, h.organization_id, u.firstName, u.lastName, h.specializations as specialties
FROM hsps h
JOIN users u ON h.userId = u.id
WHERE h.is_verified = TRUE AND h.deleted_at IS NULL;

-- Insert initial data for testing/migration
INSERT INTO organizations (id, name, type, isActive, hipaa_covered_entity)
VALUES (uuid_generate_v4(), 'Default Healthcare Organization', 'clinic', TRUE, TRUE);

-- Schema creation completed
SELECT 'PostgreSQL schema created successfully!' as status;