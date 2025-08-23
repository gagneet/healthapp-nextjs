#!/bin/bash
# create-rename-migration.sh - Create a Prisma migration to rename tables to PascalCase

echo "🔧 Creating migration to rename tables to PascalCase..."

# Create a new migration directory
MIGRATION_NAME="$(date +%Y%m%d%H%M%S)_rename_tables_to_pascalcase"
MIGRATION_DIR="prisma/migrations/$MIGRATION_NAME"
mkdir -p "$MIGRATION_DIR"

# Create the migration SQL file
cat > "$MIGRATION_DIR/migration.sql" << 'EOF'
-- Rename all tables to match PascalCase @@map() directives

-- Core entity tables
ALTER TABLE "users" RENAME TO "Users";
ALTER TABLE "organizations" RENAME TO "Organizations";
ALTER TABLE "patients" RENAME TO "Patients";
ALTER TABLE "doctors" RENAME TO "Doctor";
ALTER TABLE "hsps" RENAME TO "Hsp";
ALTER TABLE "specialities" RENAME TO "Specialities";

-- Medical and care tables
ALTER TABLE "medicines" RENAME TO "Medicines";
ALTER TABLE "medications" RENAME TO "Medications";
ALTER TABLE "medication_logs" RENAME TO "MedicationLogs";
ALTER TABLE "care_plans" RENAME TO "CarePlans";
ALTER TABLE "appointments" RENAME TO "Appointments";

-- Support tables
ALTER TABLE "clinics" RENAME TO "Clinics";
ALTER TABLE "appointment_slots" RENAME TO "AppointmentSlots";
ALTER TABLE "doctor_availability" RENAME TO "DoctorAvailability";
ALTER TABLE "notifications" RENAME TO "Notifications";
ALTER TABLE "audit_logs" RENAME TO "AuditLogs";

-- Vital and monitoring tables
ALTER TABLE "vital_types" RENAME TO "VitalTypes";
ALTER TABLE "vital_readings" RENAME TO "VitalReadings";
ALTER TABLE "vital_requirements" RENAME TO "VitalRequirements";
ALTER TABLE "vital_templates" RENAME TO "VitalTemplates";
ALTER TABLE "vitals" RENAME TO "Vitals";
ALTER TABLE "symptoms" RENAME TO "Symptoms";
ALTER TABLE "adherence_records" RENAME TO "AdherenceRecords";

-- Patient management
ALTER TABLE "patient_alerts" RENAME TO "PatientAlerts";
ALTER TABLE "patient_consent_otp" RENAME TO "PatientConsentOtp";
ALTER TABLE "patient_doctor_assignments" RENAME TO "PatientDoctorAssignments";
ALTER TABLE "patient_provider_assignments" RENAME TO "PatientProviderAssignments";
ALTER TABLE "patient_provider_consent_history" RENAME TO "PatientProviderConsentHistory";
ALTER TABLE "secondary_doctor_assignments" RENAME TO "SecondaryDoctorAssignments";

-- System tables
ALTER TABLE "user_devices" RENAME TO "UserDevices";
ALTER TABLE "user_roles" RENAME TO "UserRoles";
ALTER TABLE "scheduled_events" RENAME TO "ScheduledEvents";
ALTER TABLE "schedule_events" RENAME TO "ScheduleEvents";

-- Provider and billing
ALTER TABLE "healthcare_providers" RENAME TO "HealthcareProviders";
ALTER TABLE "providers" RENAME TO "Providers";
ALTER TABLE "provider_change_history" RENAME TO "ProviderChangeHistory";
ALTER TABLE "service_plans" RENAME TO "ServicePlans";
ALTER TABLE "patient_subscriptions" RENAME TO "PatientSubscriptions";
ALTER TABLE "payment_methods" RENAME TO "PaymentMethods";
ALTER TABLE "payments" RENAME TO "Payments";

-- Templates and planning
ALTER TABLE "care_plan_templates" RENAME TO "CarePlanTemplates";
ALTER TABLE "treatment_plans" RENAME TO "TreatmentPlans";
ALTER TABLE "dashboard_metrics" RENAME TO "DashboardMetrics";
ALTER TABLE "symptoms_database" RENAME TO "SymptomsDatabase";
ALTER TABLE "treatment_database" RENAME TO "TreatmentDatabase";

-- Auth.js tables
ALTER TABLE "accounts" RENAME TO "Accounts";
ALTER TABLE "sessions" RENAME TO "Sessions";
ALTER TABLE "verificationtokens" RENAME TO "VerificationTokens";
ALTER TABLE "account_links" RENAME TO "AccountLinks";

-- Medical safety tables
ALTER TABLE "drug_interactions" RENAME TO "DrugInteractions";
ALTER TABLE "patient_allergies" RENAME TO "PatientAllergies";
ALTER TABLE "medication_safety_alerts" RENAME TO "MedicationSafetyAlerts";
ALTER TABLE "emergency_alerts" RENAME TO "EmergencyAlerts";
ALTER TABLE "vital_alert_rules" RENAME TO "VitalAlertRules";
ALTER TABLE "emergency_contacts" RENAME TO "EmergencyContacts";

-- Telemedicine tables
ALTER TABLE "video_consultations" RENAME TO "VideoConsultations";
ALTER TABLE "consultation_prescriptions" RENAME TO "ConsultationPrescriptions";
ALTER TABLE "consultation_notes" RENAME TO "ConsultationNotes";
ALTER TABLE "lab_orders" RENAME TO "LabOrders";
ALTER TABLE "lab_results" RENAME TO "LabResults";
ALTER TABLE "patient_game_profiles" RENAME TO "PatientGameProfiles";
ALTER TABLE "game_badge_awards" RENAME TO "GameBadgeAwards";
ALTER TABLE "game_challenge_progress" RENAME TO "GameChallengeProgress";

-- IoT device tables
ALTER TABLE "connected_devices" RENAME TO "ConnectedDevices";
ALTER TABLE "device_readings" RENAME TO "DeviceReadings";
ALTER TABLE "device_plugins" RENAME TO "DevicePlugins";
EOF

echo "✅ Migration created: $MIGRATION_DIR/migration.sql"
echo ""
echo "Next steps:"
echo "1. Review the migration file if needed"
echo "2. Run: npx prisma migrate deploy"
echo "3. Run: npx prisma generate" 
echo "4. Run: npm run seed"
