#!/bin/bash
# fix-schema-mappings.sh - Script to fix Prisma schema table mappings

echo "🔧 Fixing Prisma schema table mappings..."

# Backup original file
cp prisma/schema.prisma prisma/schema.prisma.backup

# Fix all the capitalized table mappings to lowercase
sed -i 's/@@map("Users")/@@map("users")/g' prisma/schema.prisma
sed -i 's/@@map("Organizations")/@@map("organizations")/g' prisma/schema.prisma
sed -i 's/@@map("Patients")/@@map("patients")/g' prisma/schema.prisma
sed -i 's/@@map("HealthcareProviders")/@@map("healthcare_providers")/g' prisma/schema.prisma
sed -i 's/@@map("Specialities")/@@map("specialities")/g' prisma/schema.prisma
sed -i 's/@@map("Clinics")/@@map("clinics")/g' prisma/schema.prisma
sed -i 's/@@map("CarePlans")/@@map("care_plans")/g' prisma/schema.prisma
sed -i 's/@@map("Medicines")/@@map("medicines")/g' prisma/schema.prisma
sed -i 's/@@map("Medications")/@@map("medications")/g' prisma/schema.prisma
sed -i 's/@@map("Appointments")/@@map("appointments")/g' prisma/schema.prisma
sed -i 's/@@map("DoctorAvailability")/@@map("doctor_availability")/g' prisma/schema.prisma
sed -i 's/@@map("VitalTypes")/@@map("vital_types")/g' prisma/schema.prisma
sed -i 's/@@map("VitalReadings")/@@map("vital_readings")/g' prisma/schema.prisma
sed -i 's/@@map("Symptoms")/@@map("symptoms")/g' prisma/schema.prisma
sed -i 's/@@map("AdherenceRecords")/@@map("adherence_records")/g' prisma/schema.prisma
sed -i 's/@@map("Doctor")/@@map("doctors")/g' prisma/schema.prisma
sed -i 's/@@map("Hsp")/@@map("hsps")/g' prisma/schema.prisma
sed -i 's/@@map("MedicationLogs")/@@map("medication_logs")/g' prisma/schema.prisma
sed -i 's/@@map("PatientAlerts")/@@map("patient_alerts")/g' prisma/schema.prisma
sed -i 's/@@map("PatientConsentOtp")/@@map("patient_consent_otp")/g' prisma/schema.prisma
sed -i 's/@@map("PatientProviderAssignments")/@@map("patient_provider_assignments")/g' prisma/schema.prisma
sed -i 's/@@map("PatientProviderConsentHistory")/@@map("patient_provider_consent_history")/g' prisma/schema.prisma
sed -i 's/@@map("PaymentMethods")/@@map("payment_methods")/g' prisma/schema.prisma
sed -i 's/@@map("Payments")/@@map("payments")/g' prisma/schema.prisma
sed -i 's/@@map("ProviderChangeHistory")/@@map("provider_change_history")/g' prisma/schema.prisma
sed -i 's/@@map("Providers")/@@map("providers")/g' prisma/schema.prisma
sed -i 's/@@map("ScheduleEvents")/@@map("schedule_events")/g' prisma/schema.prisma
sed -i 's/@@map("ScheduledEvents")/@@map("scheduled_events")/g' prisma/schema.prisma
sed -i 's/@@map("SecondaryDoctorAssignments")/@@map("secondary_doctor_assignments")/g' prisma/schema.prisma
sed -i 's/@@map("SymptomsDatabase")/@@map("symptoms_database")/g' prisma/schema.prisma
sed -i 's/@@map("TreatmentDatabase")/@@map("treatment_database")/g' prisma/schema.prisma
sed -i 's/@@map("TreatmentPlans")/@@map("treatment_plans")/g' prisma/schema.prisma
sed -i 's/@@map("UserRoles")/@@map("user_roles")/g' prisma/schema.prisma
sed -i 's/@@map("VitalRequirements")/@@map("vital_requirements")/g' prisma/schema.prisma
sed -i 's/@@map("VitalTemplates")/@@map("vital_templates")/g' prisma/schema.prisma
sed -i 's/@@map("Vitals")/@@map("vitals")/g' prisma/schema.prisma
sed -i 's/@@map("AuditLogs")/@@map("audit_logs")/g' prisma/schema.prisma
sed -i 's/@@map("AppointmentSlots")/@@map("appointment_slots")/g' prisma/schema.prisma
sed -i 's/@@map("CarePlanTemplates")/@@map("care_plan_templates")/g' prisma/schema.prisma
sed -i 's/@@map("DashboardMetrics")/@@map("dashboard_metrics")/g' prisma/schema.prisma
sed -i 's/@@map("Notifications")/@@map("notifications")/g' prisma/schema.prisma
sed -i 's/@@map("UserDevices")/@@map("user_devices")/g' prisma/schema.prisma
sed -i 's/@@map("PatientDoctorAssignments")/@@map("patient_doctor_assignments")/g' prisma/schema.prisma
sed -i 's/@@map("ServicePlans")/@@map("service_plans")/g' prisma/schema.prisma
sed -i 's/@@map("PatientSubscriptions")/@@map("patient_subscriptions")/g' prisma/schema.prisma

# Fix Auth.js table mappings
sed -i 's/@@map("Accounts")/@@map("accounts")/g' prisma/schema.prisma
sed -i 's/@@map("Sessions")/@@map("sessions")/g' prisma/schema.prisma
sed -i 's/@@map("VerificationTokens")/@@map("verificationtokens")/g' prisma/schema.prisma
sed -i 's/@@map("AccountLinks")/@@map("account_links")/g' prisma/schema.prisma

# Fix medical safety table mappings
sed -i 's/@@map("DrugInteractions")/@@map("drug_interactions")/g' prisma/schema.prisma
sed -i 's/@@map("PatientAllergies")/@@map("patient_allergies")/g' prisma/schema.prisma
sed -i 's/@@map("MedicationSafetyAlerts")/@@map("medication_safety_alerts")/g' prisma/schema.prisma
sed -i 's/@@map("EmergencyAlerts")/@@map("emergency_alerts")/g' prisma/schema.prisma
sed -i 's/@@map("VitalAlertRules")/@@map("vital_alert_rules")/g' prisma/schema.prisma
sed -i 's/@@map("EmergencyContacts")/@@map("emergency_contacts")/g' prisma/schema.prisma

# Fix telemedicine table mappings
sed -i 's/@@map("VideoConsultations")/@@map("video_consultations")/g' prisma/schema.prisma
sed -i 's/@@map("ConsultationPrescriptions")/@@map("consultation_prescriptions")/g' prisma/schema.prisma
sed -i 's/@@map("ConsultationNotes")/@@map("consultation_notes")/g' prisma/schema.prisma
sed -i 's/@@map("LabOrders")/@@map("lab_orders")/g' prisma/schema.prisma
sed -i 's/@@map("LabResults")/@@map("lab_results")/g' prisma/schema.prisma
sed -i 's/@@map("PatientGameProfiles")/@@map("patient_game_profiles")/g' prisma/schema.prisma
sed -i 's/@@map("GameBadgeAwards")/@@map("game_badge_awards")/g' prisma/schema.prisma
sed -i 's/@@map("GameChallengeProgress")/@@map("game_challenge_progress")/g' prisma/schema.prisma

# Fix IoT device table mappings
sed -i 's/@@map("ConnectedDevices")/@@map("connected_devices")/g' prisma/schema.prisma
sed -i 's/@@map("DeviceReadings")/@@map("device_readings")/g' prisma/schema.prisma
sed -i 's/@@map("DevicePlugins")/@@map("device_plugins")/g' prisma/schema.prisma

echo "✅ Schema mappings fixed!"
echo "📝 Backup saved as: prisma/schema.prisma.backup"
echo ""
echo "Next steps:"
echo "1. Run: npx prisma generate"
echo "2. Run: npm run seed"
