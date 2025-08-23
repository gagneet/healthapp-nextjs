-- ============================================================================
-- PRISMA SCHEMA NAMING CONVENTIONS MIGRATION
-- ============================================================================
-- This migration updates enum names and fixes table naming inconsistencies
-- to align with Prisma best practices:
-- - PascalCase enums (UserRole, UserAccountStatus, etc.)
-- - PascalCase table names (Users, Doctors, HSPs, etc.)
-- - Field names remain unchanged (using @map directives in schema)
-- ============================================================================

-- ============================================================================
-- ENUM RENAMES: Convert snake_case enums to PascalCase
-- ============================================================================

-- User-related enums
ALTER TYPE enum_users_role RENAME TO "UserRole";
ALTER TYPE enum_users_account_status RENAME TO "UserAccountStatus";
ALTER TYPE enum_users_gender RENAME TO "UserGender";

-- Appointment-related enums
ALTER TYPE enum_appointments_organizer_type RENAME TO "AppointmentOrganizerType";
ALTER TYPE enum_appointments_participant_one_type RENAME TO "AppointmentParticipantOneType";
ALTER TYPE enum_appointments_participant_two_type RENAME TO "AppointmentParticipantTwoType";
ALTER TYPE enum_appointment_slots_slot_type RENAME TO "AppointmentSlotType";

-- Medication-related enums
ALTER TYPE enum_medications_organizer_type RENAME TO "MedicationOrganizerType";
ALTER TYPE enum_medication_logs_adherence_status RENAME TO "MedicationLogAdherenceStatus";
ALTER TYPE enum_adherence_records_adherence_type RENAME TO "AdherenceType";

-- Patient-related enums
ALTER TYPE enum_patient_alerts_alert_type RENAME TO "PatientAlertType";
ALTER TYPE enum_patient_alerts_severity RENAME TO "PatientAlertSeverity";
ALTER TYPE enum_patient_consent_otp_otp_method RENAME TO "PatientConsentOtpMethod";
ALTER TYPE enum_patient_provider_consent_history_consent_method RENAME TO "PatientProviderConsentMethod";
ALTER TYPE enum_patient_provider_consent_history_status RENAME TO "PatientProviderConsentStatus";
ALTER TYPE enum_patients_provider_consent_method RENAME TO "PatientProviderConsentMethodLegacy";
ALTER TYPE enum_patient_subscriptions_status RENAME TO "PatientSubscriptionStatus";
ALTER TYPE enum_patient_doctor_assignment_type RENAME TO "PatientDoctorAssignmentType";
ALTER TYPE enum_patient_doctor_assignment_consent_status RENAME TO "PatientDoctorAssignmentConsentStatus";

-- Payment-related enums
ALTER TYPE enum_payment_methods_type RENAME TO "PaymentMethodType";
ALTER TYPE enum_payments_payment_method RENAME TO "PaymentMethod";
ALTER TYPE enum_payments_status RENAME TO "PaymentStatus";

-- Provider-related enums
ALTER TYPE enum_provider_change_history_practitioner_type RENAME TO "ProviderChangeHistoryPractitionerType";
ALTER TYPE enum_provider_change_history_status RENAME TO "ProviderChangeHistoryStatus";

-- Schedule-related enums
ALTER TYPE enum_schedule_events_event_type RENAME TO "ScheduleEventType";
ALTER TYPE enum_schedule_events_status RENAME TO "ScheduleEventStatus";
ALTER TYPE enum_scheduled_events_event_type RENAME TO "ScheduledEventType";
ALTER TYPE enum_scheduled_events_priority RENAME TO "ScheduledEventPriority";
ALTER TYPE enum_scheduled_events_status RENAME TO "ScheduledEventStatus";

-- Service and assignment-related enums
ALTER TYPE enum_service_plans_billing_cycle RENAME TO "ServicePlanBillingCycle";
ALTER TYPE enum_secondary_doctor_assignments_consent_status RENAME TO "SecondaryDoctorAssignmentConsentStatus";
ALTER TYPE enum_user_roles_linked_with RENAME TO "UserRoleLinkedWith";

-- Vital-related enums
ALTER TYPE enum_vital_readings_alert_level RENAME TO "VitalReadingAlertLevel";

-- Dashboard-related enums
ALTER TYPE enum_dashboard_metrics_entity_type RENAME TO "DashboardMetricsEntityType";

-- ============================================================================
-- TABLE RENAMES: Fix inconsistencies from previous migration
-- ============================================================================

-- Fix table names that don't match current schema @@map directives
-- Previous migration had: "doctors" RENAME TO "Doctor" (singular)
-- Schema now has: @@map("Doctors") (plural)
ALTER TABLE "Doctor" RENAME TO "Doctors";

-- Previous migration had: "hsps" RENAME TO "Hsp"
-- Schema now has: @@map("HSPs")  
ALTER TABLE "Hsp" RENAME TO "HSPs";

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All enum names now follow PascalCase convention
-- All table names now match schema @@map directives
-- Field names unchanged (handled by @map directives in schema)
-- ============================================================================