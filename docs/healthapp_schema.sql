-- ====================================
-- Modern Health Adherence System Schema
-- PostgreSQL 14+ with Advanced Features
-- ====================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ====================================
-- ENUMS AND CUSTOM TYPES
-- ====================================

-- User roles enum
CREATE TYPE user_role AS ENUM (
    'SYSTEM_ADMIN',
    'HOSPITAL_ADMIN', 
    'DOCTOR',
    'HSP',
    'NURSE',
    'PATIENT',
    'CAREGIVER'
);

-- Account status enum
CREATE TYPE account_status AS ENUM (
    'PENDING_VERIFICATION',
    'ACTIVE',
    'INACTIVE', 
    'SUSPENDED',
    'DEACTIVATED'
);

-- Gender enum
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- Appointment status enum
CREATE TYPE appointment_status AS ENUM (
    'SCHEDULED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'RESCHEDULED'
);

-- Care plan status enum  
CREATE TYPE care_plan_status AS ENUM (
    'DRAFT',
    'ACTIVE', 
    'PAUSED',
    'COMPLETED',
    'CANCELLED'
);

-- Event status enum
CREATE TYPE event_status AS ENUM (
    'SCHEDULED',
    'PENDING',
    'IN_PROGRESS', 
    'COMPLETED',
    'MISSED',
    'CANCELLED',
    'EXPIRED'
);

-- Event type enum
CREATE TYPE event_type AS ENUM (
    'MEDICATION',
    'APPOINTMENT',
    'VITAL_CHECK',
    'SYMPTOM_LOG',
    'DIET_LOG',
    'EXERCISE',
    'REMINDER'
);

-- Priority level enum
CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Notification channel enum
CREATE TYPE notification_channel AS ENUM ('PUSH', 'SMS', 'EMAIL', 'VOICE_CALL');

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM (
    'ACTIVE',
    'INACTIVE', 
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED'
);

-- ====================================
-- CORE TABLES
-- ====================================

-- Organizations table (Hospitals, Clinics, etc.)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'clinic',
    license_number VARCHAR(100),
    contact_info JSONB DEFAULT '{}',
    address JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Users table - Core authentication and profile
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    account_status account_status DEFAULT 'PENDING_VERIFICATION',
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender gender,
    
    -- Security fields
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    
    -- Metadata
    profile_picture_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Healthcare Providers (Doctors, HSPs, Nurses)
CREATE TABLE healthcare_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    -- Professional information
    license_number VARCHAR(100),
    specialties TEXT[], -- Array of specialties
    sub_specialties TEXT[],
    qualifications JSONB DEFAULT '[]',
    years_of_experience INTEGER,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB DEFAULT '[]',
    verification_date TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    
    -- Settings
    consultation_fee DECIMAL(10,2),
    availability_schedule JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    -- Medical information
    medical_record_number VARCHAR(50),
    emergency_contacts JSONB DEFAULT '[]',
    insurance_information JSONB DEFAULT '{}',
    medical_history JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    current_medications JSONB DEFAULT '[]',
    
    -- Physical measurements
    height_cm DECIMAL(5,2) CHECK (height_cm > 0 AND height_cm < 300),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 1000),
    
    -- Settings
    communication_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Provider-Patient assignments
CREATE TABLE patient_provider_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES healthcare_providers(id),
    role VARCHAR(50) DEFAULT 'primary', -- primary, secondary, consultant
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    ended_at TIMESTAMPTZ,
    notes TEXT,
    
    UNIQUE(patientId, provider_id, role, ended_at)
);

-- ====================================
-- CARE MANAGEMENT
-- ====================================

-- Care Plan Templates
CREATE TABLE care_plan_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Categorization
    conditions TEXT[], -- Medical conditions this template addresses
    specialties TEXT[], -- Medical specialties
    tags TEXT[],
    
    -- Template content
    template_data JSONB NOT NULL DEFAULT '{}',
    
    -- Sharing and permissions
    created_by UUID NOT NULL REFERENCES healthcare_providers(id),
    organization_id UUID REFERENCES organizations(id),
    is_public BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    
    -- Versioning
    version VARCHAR(20) DEFAULT '1.0',
    parent_template_id UUID REFERENCES care_plan_templates(id),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Active Care Plans
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES healthcare_providers(id),
    template_id UUID REFERENCES care_plan_templates(id),
    
    -- Plan details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    diagnosis TEXT,
    goals JSONB DEFAULT '[]',
    
    -- Status and timing
    status care_plan_status DEFAULT 'DRAFT',
    priority priority_level DEFAULT 'MEDIUM',
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Plan data
    plan_data JSONB DEFAULT '{}',
    
    -- Collaboration
    secondary_providers UUID[] DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Medications
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id),
    
    -- Medication details
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    ndc_code VARCHAR(20), -- National Drug Code
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50), -- oral, IV, topical, etc.
    frequency VARCHAR(100) NOT NULL,
    instructions TEXT,
    
    -- Timing
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Metadata
    is_critical BOOLEAN DEFAULT false,
    requires_monitoring BOOLEAN DEFAULT false,
    side_effects_to_monitor TEXT[],
    drug_interactions JSONB DEFAULT '[]',
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Vital Signs Types
CREATE TABLE vital_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20),
    normalRangeMin DECIMAL(10,2),
    normalRangeMax DECIMAL(10,2),
    description TEXT,
    validation_rules JSONB DEFAULT '{}',
    
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Vital Requirements in care plans
CREATE TABLE vitalRequirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id),
    vitalTypeId UUID NOT NULL REFERENCES vital_types(id),
    
    frequency VARCHAR(100) NOT NULL, -- daily, twice_daily, weekly, etc.
    preferred_time TIME,
    is_critical BOOLEAN DEFAULT false,
    monitoring_notes TEXT,
    
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ====================================
-- SCHEDULING AND EVENTS
-- ====================================

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES healthcare_providers(id),
    
    -- Appointment details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_type VARCHAR(100), -- consultation, follow-up, emergency
    
    -- Scheduling
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Status and location
    status appointment_status DEFAULT 'SCHEDULED',
    location JSONB DEFAULT '{}', -- Can be physical address or virtual meeting info
    is_virtual BOOLEAN DEFAULT false,
    
    -- Metadata
    notes TEXT,
    reminder_preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Scheduled Events (medications, vitals, etc.)
CREATE TABLE scheduled_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id),
    care_plan_id UUID REFERENCES care_plans(id),
    
    -- Event details
    event_type event_type NOT NULL,
    event_id UUID, -- Reference to specific medication, vital requirement, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Status and priority
    status event_status DEFAULT 'SCHEDULED',
    priority priority_level DEFAULT 'MEDIUM',
    
    -- Event data
    event_data JSONB DEFAULT '{}',
    
    -- Completion tracking
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id),
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ====================================
-- ADHERENCE AND TRACKING
-- ====================================

-- Adherence Records
CREATE TABLE adherence_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id),
    scheduled_event_id UUID REFERENCES scheduled_events(id),
    
    -- Adherence details
    adherence_type event_type NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    recordedAt TIMESTAMPTZ,
    
    -- Adherence status
    is_completed BOOLEAN DEFAULT false,
    is_partial BOOLEAN DEFAULT false,
    is_missed BOOLEAN DEFAULT false,
    
    -- Additional data
    response_data JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Vital Readings
CREATE TABLE vital_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id),
    vitalTypeId UUID NOT NULL REFERENCES vital_types(id),
    adherence_record_id UUID REFERENCES adherence_records(id),
    
    -- Reading data
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    
    -- Context
    readingTime TIMESTAMPTZ NOT NULL,
    device_info JSONB DEFAULT '{}',
    isFlagged BOOLEAN DEFAULT false,
    
    -- Notes and attachments
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Validation
    is_validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES healthcare_providers(id),
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Symptoms Log
CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id),
    care_plan_id UUID REFERENCES care_plans(id),
    
    -- Symptom details
    symptom_name VARCHAR(255) NOT NULL,
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    description TEXT,
    body_location JSONB DEFAULT '{}',
    
    -- Timing
    onset_time TIMESTAMPTZ,
    recordedAt TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional data
    triggers JSONB DEFAULT '[]',
    relieving_factors JSONB DEFAULT '[]',
    associated_symptoms JSONB DEFAULT '[]',
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- NOTIFICATIONS
-- ====================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id),
    
    -- Notification details
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority priority_level DEFAULT 'MEDIUM',
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Channels
    channels notification_channel[] DEFAULT '{PUSH}',
    delivery_status JSONB DEFAULT '{}',
    
    -- Context
    reference_type VARCHAR(100),
    reference_id UUID,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- User Devices for push notifications
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES users(id),
    
    -- Device information
    deviceType VARCHAR(50) NOT NULL, -- ios, android, web
    push_token VARCHAR(500) NOT NULL,
    device_id VARCHAR(255),
    
    -- Settings
    isActive BOOLEAN DEFAULT true,
    notification_settings JSONB DEFAULT '{}',
    
    -- Timestamps
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- BILLING AND SUBSCRIPTIONS
-- ====================================

-- Service Plans
CREATE TABLE service_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES healthcare_providers(id),
    
    -- Plan details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_type VARCHAR(100),
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(50), -- monthly, yearly, one-time
    
    -- Features
    features JSONB DEFAULT '[]',
    patient_limit INTEGER,
    
    -- Status
    isActive BOOLEAN DEFAULT true,
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Patient Subscriptions
CREATE TABLE patient_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patientId UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES healthcare_providers(id),
    service_plan_id UUID NOT NULL REFERENCES service_plans(id),
    
    -- Subscription details
    status subscription_status DEFAULT 'ACTIVE',
    
    -- Billing
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE,
    
    -- Payment
    payment_method_id VARCHAR(255),
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ
);

-- ====================================
-- AUDIT AND LOGGING
-- ====================================

-- Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID REFERENCES users(id),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Timestamps
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- PERFORMANCE AND OPTIMIZATION
-- ====================================

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(account_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;

-- Indexes for healthcare_providers
CREATE INDEX idx_providers_user_id ON healthcare_providers(userId);
CREATE INDEX idx_providers_org ON healthcare_providers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_providers_specialties ON healthcare_providers USING GIN(specialties);
CREATE INDEX idx_providers_verified ON healthcare_providers(is_verified) WHERE deleted_at IS NULL;

-- Indexes for patients
CREATE INDEX idx_patients_user_id ON patients(userId);
CREATE INDEX idx_patients_org ON patients(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_mrn ON patients(medical_record_number) WHERE deleted_at IS NULL;

-- Indexes for patient_provider_assignments
CREATE INDEX idx_assignments_patient ON patient_provider_assignments(patientId) WHERE ended_at IS NULL;
CREATE INDEX idx_assignments_provider ON patient_provider_assignments(provider_id) WHERE ended_at IS NULL;
CREATE INDEX idx_assignments_active ON patient_provider_assignments(patientId, provider_id) WHERE ended_at IS NULL;

-- Indexes for care_plans
CREATE INDEX idx_care_plans_patient ON care_plans(patientId) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_provider ON care_plans(provider_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_status ON care_plans(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_care_plans_dates ON care_plans(start_date, end_date) WHERE deleted_at IS NULL;

-- Indexes for medications
CREATE INDEX idx_medications_care_plan ON medications(care_plan_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_medications_name ON medications(medication_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_medications_dates ON medications(start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_medications_critical ON medications(is_critical) WHERE deleted_at IS NULL;

-- Indexes for scheduled_events
CREATE INDEX idx_events_patient ON scheduled_events(patientId) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_scheduled_for ON scheduled_events(scheduled_for) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status ON scheduled_events(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_type ON scheduled_events(event_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_priority ON scheduled_events(priority) WHERE deleted_at IS NULL;

-- Indexes for adherence_records
CREATE INDEX idx_adherence_patient ON adherence_records(patientId);
CREATE INDEX idx_adherence_due_at ON adherence_records(due_at);
CREATE INDEX idx_adherence_type ON adherence_records(adherence_type);
CREATE INDEX idx_adherence_status ON adherence_records(is_completed, is_missed);

-- Indexes for appointments
CREATE INDEX idx_appointments_patient ON appointments(patientId) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_provider ON appointments(provider_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_time ON appointments(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_status ON appointments(status) WHERE deleted_at IS NULL;

-- Indexes for notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_priority ON notifications(priority) WHERE deleted_at IS NULL;

-- Full-text search indexes
CREATE INDEX idx_users_name_search ON users USING GIN(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));
CREATE INDEX idx_medications_name_search ON medications USING GIN(to_tsvector('english', medication_name));

-- ====================================
-- TRIGGERS AND FUNCTIONS
-- ====================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updatedAt trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_healthcare_providers_updated_at BEFORE UPDATE ON healthcare_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_appointments_updated_at();
CREATE TRIGGER update_scheduled_events_updated_at BEFORE UPDATE ON scheduled_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- VIEWS FOR COMMON QUERIES
-- ====================================

-- Active care plans with patient and provider info
CREATE VIEW v_active_care_plans AS
SELECT 
    cp.id,
    cp.title as name,
    cp.status,
    cp.priority,
    cp.start_date,
    cp.end_date,
    
    -- Patient info
    p.id as patientId,
    u_patient.first_name as patient_first_name,
    u_patient.last_name as patient_last_name,
    u_patient.email as patient_email,
    
    -- Provider info
    hp.id as provider_id,
    u_provider.first_name as provider_first_name,
    u_provider.last_name as provider_last_name,
    u_provider.email as provider_email,
    
    cp.createdAt,
    cp.updatedAt
FROM care_plans cp
JOIN patients p ON cp.patientId = p.id
JOIN users u_patient ON p.userId = u_patient.id
JOIN healthcare_providers hp ON cp.provider_id = hp.id
JOIN users u_provider ON hp.userId = u_provider.id
WHERE cp.deleted_at IS NULL 
    AND p.deleted_at IS NULL 
    AND u_patient.deleted_at IS NULL
    AND hp.deleted_at IS NULL 
    AND u_provider.deleted_at IS NULL
    AND cp.status = 'ACTIVE';

-- Patient adherence summary
CREATE VIEW v_patient_adherence_summary AS
SELECT 
    p.id as patientId,
    u.first_name,
    u.last_name,
    u.email,
    
    -- Adherence stats
    COUNT(ar.id) as total_events,
    COUNT(CASE WHEN ar.is_completed THEN 1 END) as completed_events,
    COUNT(CASE WHEN ar.is_missed THEN 1 END) as missed_events,
    ROUND(
        (COUNT(CASE WHEN ar.is_completed THEN 1 END)::DECIMAL / NULLIF(COUNT(ar.id), 0)) * 100, 
        2
    ) as adherence_percentage,
    
    -- Recent activity
    MAX(ar.recordedAt) as last_activity,
    
    p.createdAt,
    p.updatedAt
FROM patients p
JOIN users u ON p.userId = u.id
LEFT JOIN adherence_records ar ON p.id = ar.patientId
    AND ar.due_at >= NOW() - INTERVAL '30 days'
WHERE p.deleted_at IS NULL 
    AND u.deleted_at IS NULL
GROUP BY p.id, u.first_name, u.last_name, u.email, p.createdAt, p.updatedAt;

-- Upcoming scheduled events
CREATE VIEW v_upcoming_events AS
SELECT 
    se.id,
    se.event_type,
    se.title,
    se.scheduled_for,
    se.priority,
    se.status,
    
    -- Patient info
    p.id as patientId,
    u_patient.first_name as patient_first_name,
    u_patient.last_name as patient_last_name,
    
    -- Provider info (from care plan)
    hp.id as provider_id,
    u_provider.first_name as provider_first_name,
    u_provider.last_name as provider_last_name,
    
    se.createdAt
FROM scheduled_events se
JOIN patients p ON se.patientId = p.id
JOIN users u_patient ON p.userId = u_patient.id
LEFT JOIN care_plans cp ON se.care_plan_id = cp.id
LEFT JOIN healthcare_providers hp ON cp.provider_id = hp.id
LEFT JOIN users u_provider ON hp.userId = u_provider.id
WHERE se.deleted_at IS NULL 
    AND p.deleted_at IS NULL 
    AND u_patient.deleted_at IS NULL
    AND se.scheduled_for >= NOW()
    AND se.status IN ('SCHEDULED', 'PENDING')
ORDER BY se.scheduled_for ASC;

-- ====================================
-- SAMPLE DATA INSERTS
-- ====================================

-- Insert default vital types
INSERT INTO vital_types (name, unit, normalRangeMin, normalRangeMax, description) VALUES
('Blood Pressure Systolic', 'mmHg', 90, 140, 'Systolic blood pressure measurement'),
('Blood Pressure Diastolic', 'mmHg', 60, 90, 'Diastolic blood pressure measurement'),
('Heart Rate', 'bpm', 60, 100, 'Resting heart rate'),
('Body Temperature', '°F', 97.0, 99.5, 'Body temperature in Fahrenheit'),
('Weight', 'lbs', NULL, NULL, 'Body weight in pounds'),
('Blood Glucose', 'mg/dL', 70, 140, 'Blood glucose level'),
('Oxygen Saturation', '%', 95, 100, 'Blood oxygen saturation level');

-- Create a sample organization
INSERT INTO organizations (name, type, contact_info, address) VALUES 
('Sample Healthcare Clinic', 'clinic', 
 '{"phone": "+1-555-0123", "email": "contact@sampleclinic.com"}',
 '{"street": "123 Healthcare Ave", "city": "Medical City", "state": "HC", "zip": "12345"}');

-- ====================================
-- PERMISSIONS AND SECURITY
-- ====================================

-- Row Level Security policies would go here
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY patient_access_policy ON patients FOR ALL TO authenticated_users USING (userId = auth.uid() OR EXISTS (SELECT 1 FROM patient_provider_assignments WHERE patientId = patients.id AND provider_id IN (SELECT id FROM healthcare_providers WHERE userId = auth.uid())));

-- Additional RLS policies for other tables...

-- Grant permissions
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated_users;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated_users;