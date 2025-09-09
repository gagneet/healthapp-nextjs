/*
  Warnings:

  - Made the column `lastUpdatedAt` on table `drugInteractions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `patientAllergies` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."accountLinks" RENAME CONSTRAINT "account_links_pkey" TO "accountLinks_pkey";

-- AlterTable
ALTER TABLE "public"."adherenceLogs" RENAME CONSTRAINT "adherence_logs_pkey" TO "adherenceLogs_pkey";

-- AlterTable
ALTER TABLE "public"."adherenceRecords" RENAME CONSTRAINT "adherence_records_pkey" TO "adherenceRecords_pkey";

-- AlterTable
ALTER TABLE "public"."appointmentSlots" RENAME CONSTRAINT "appointment_slots_pkey" TO "appointmentSlots_pkey";

-- AlterTable
ALTER TABLE "public"."auditLogs" RENAME CONSTRAINT "audit_logs_pkey" TO "auditLogs_pkey";

-- AlterTable
ALTER TABLE "public"."blacklistedTokens" RENAME CONSTRAINT "blacklisted_tokens_pkey" TO "blacklistedTokens_pkey";

-- AlterTable
ALTER TABLE "public"."carePlanTemplates" RENAME CONSTRAINT "care_plan_templates_pkey" TO "carePlanTemplates_pkey";

-- AlterTable
ALTER TABLE "public"."carePlans" RENAME CONSTRAINT "care_plans_pkey" TO "carePlans_pkey";

-- AlterTable
ALTER TABLE "public"."clinics" ALTER COLUMN "createdAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."connectedDevices" RENAME CONSTRAINT "connected_devices_pkey" TO "connectedDevices_pkey";

-- AlterTable
ALTER TABLE "public"."consultationNotes" RENAME CONSTRAINT "consultation_notes_pkey" TO "consultationNotes_pkey";

-- AlterTable
ALTER TABLE "public"."consultationPrescriptions" RENAME CONSTRAINT "consultation_prescriptions_pkey" TO "consultationPrescriptions_pkey";

-- AlterTable
ALTER TABLE "public"."dashboardMetrics" RENAME CONSTRAINT "dashboard_metrics_pkey" TO "dashboardMetrics_pkey";

-- AlterTable
ALTER TABLE "public"."devicePlugins" RENAME CONSTRAINT "device_plugins_pkey" TO "devicePlugins_pkey";

-- AlterTable
ALTER TABLE "public"."deviceReadings" RENAME CONSTRAINT "device_readings_pkey" TO "deviceReadings_pkey";

-- AlterTable
ALTER TABLE "public"."doctorAvailability" RENAME CONSTRAINT "doctor_availability_pkey" TO "doctorAvailability_pkey";

-- AlterTable
ALTER TABLE "public"."drugInteractions" RENAME CONSTRAINT "drug_interactions_pkey" TO "drugInteractions_pkey",
ALTER COLUMN "lastUpdatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."emergencyAlerts" RENAME CONSTRAINT "emergency_alerts_pkey" TO "emergencyAlerts_pkey";

-- AlterTable
ALTER TABLE "public"."emergencyContacts" RENAME CONSTRAINT "emergency_contacts_pkey" TO "emergencyContacts_pkey";

-- AlterTable
ALTER TABLE "public"."gameBadgeAwards" RENAME CONSTRAINT "game_badge_awards_pkey" TO "gameBadgeAwards_pkey";

-- AlterTable
ALTER TABLE "public"."gameChallengeProgress" RENAME CONSTRAINT "game_challenge_progress_pkey" TO "gameChallengeProgress_pkey";

-- AlterTable
ALTER TABLE "public"."healthcareProviders" RENAME CONSTRAINT "healthcare_providers_pkey" TO "healthcareProviders_pkey";

-- AlterTable
ALTER TABLE "public"."labOrders" RENAME CONSTRAINT "lab_orders_pkey" TO "labOrders_pkey";

-- AlterTable
ALTER TABLE "public"."labResults" RENAME CONSTRAINT "lab_results_pkey" TO "labResults_pkey";

-- AlterTable
ALTER TABLE "public"."medicalDevices" RENAME CONSTRAINT "medical_devices_pkey" TO "medicalDevices_pkey";

-- AlterTable
ALTER TABLE "public"."medicationLogs" RENAME CONSTRAINT "medication_logs_pkey" TO "medicationLogs_pkey";

-- AlterTable
ALTER TABLE "public"."medicationSafetyAlerts" RENAME CONSTRAINT "medication_safety_alerts_pkey" TO "medicationSafetyAlerts_pkey";

-- AlterTable
ALTER TABLE "public"."notifications" ALTER COLUMN "channels" SET DATA TYPE TEXT[];

-- AlterTable
ALTER TABLE "public"."organizations" ALTER COLUMN "createdAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."patientAlerts" RENAME CONSTRAINT "patient_alerts_pkey" TO "patientAlerts_pkey";

-- AlterTable
ALTER TABLE "public"."patientAllergies" RENAME CONSTRAINT "patient_allergies_pkey" TO "patientAllergies_pkey",
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."patientConsentOtps" RENAME CONSTRAINT "patient_consent_otps_pkey" TO "patientConsentOtps_pkey";

-- AlterTable
ALTER TABLE "public"."patientDoctorAssignments" RENAME CONSTRAINT "patient_doctor_assignments_pkey" TO "patientDoctorAssignments_pkey";

-- AlterTable
ALTER TABLE "public"."patientGameProfiles" RENAME CONSTRAINT "patient_game_profiles_pkey" TO "patientGameProfiles_pkey";

-- AlterTable
ALTER TABLE "public"."patientProviderAssignments" RENAME CONSTRAINT "patient_provider_assignments_pkey" TO "patientProviderAssignments_pkey";

-- AlterTable
ALTER TABLE "public"."patientProviderConsentHistory" RENAME CONSTRAINT "patient_provider_consent_history_pkey" TO "patientProviderConsentHistory_pkey";

-- AlterTable
ALTER TABLE "public"."patientSubscriptions" RENAME CONSTRAINT "patient_subscriptions_pkey" TO "patientSubscriptions_pkey";

-- AlterTable
ALTER TABLE "public"."paymentMethods" RENAME CONSTRAINT "payment_methods_pkey" TO "paymentMethods_pkey";

-- AlterTable
ALTER TABLE "public"."providerChanges" RENAME CONSTRAINT "provider_changes_pkey" TO "providerChanges_pkey";

-- AlterTable
ALTER TABLE "public"."scheduleEvents" RENAME CONSTRAINT "schedule_events_pkey" TO "scheduleEvents_pkey";

-- AlterTable
ALTER TABLE "public"."scheduledEvents" RENAME CONSTRAINT "scheduled_events_pkey" TO "scheduledEvents_pkey";

-- AlterTable
ALTER TABLE "public"."secondaryDoctorAssignments" RENAME CONSTRAINT "secondary_doctor_assignments_pkey" TO "secondaryDoctorAssignments_pkey",
ALTER COLUMN "carePlanIds" SET DATA TYPE TEXT[];

-- AlterTable
ALTER TABLE "public"."sequelizeMeta" RENAME CONSTRAINT "sequelize_meta_pkey" TO "sequelizeMeta_pkey";

-- AlterTable
ALTER TABLE "public"."servicePlans" RENAME CONSTRAINT "service_plans_pkey" TO "servicePlans_pkey";

-- AlterTable
ALTER TABLE "public"."specialties" ALTER COLUMN "createdAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."symptomsDatabase" RENAME CONSTRAINT "symptoms_database_pkey" TO "symptomsDatabase_pkey";

-- AlterTable
ALTER TABLE "public"."treatmentDatabase" RENAME CONSTRAINT "treatment_database_pkey" TO "treatmentDatabase_pkey";

-- AlterTable
ALTER TABLE "public"."treatmentPlans" RENAME CONSTRAINT "treatment_plans_pkey" TO "treatmentPlans_pkey",
ALTER COLUMN "assignedHsps" SET DATA TYPE TEXT[];

-- AlterTable
ALTER TABLE "public"."userDevices" RENAME CONSTRAINT "user_devices_pkey" TO "userDevices_pkey";

-- AlterTable
ALTER TABLE "public"."userRoleAssignments" RENAME CONSTRAINT "user_role_assignments_pkey" TO "userRoleAssignments_pkey";

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "createdAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."videoConsultations" RENAME CONSTRAINT "video_consultations_pkey" TO "videoConsultations_pkey";

-- AlterTable
ALTER TABLE "public"."vitalAlertRules" RENAME CONSTRAINT "vital_alert_rules_pkey" TO "vitalAlertRules_pkey";

-- AlterTable
ALTER TABLE "public"."vitalReadings" RENAME CONSTRAINT "vital_readings_pkey" TO "vitalReadings_pkey";

-- AlterTable
ALTER TABLE "public"."vitalRequirements" RENAME CONSTRAINT "vital_requirements_pkey" TO "vitalRequirements_pkey";

-- AlterTable
ALTER TABLE "public"."vitalTemplates" RENAME CONSTRAINT "vital_templates_pkey" TO "vitalTemplates_pkey";

-- AlterTable
ALTER TABLE "public"."vitalTypes" RENAME CONSTRAINT "vital_types_pkey" TO "vitalTypes_pkey";

-- CreateTable
CREATE TABLE "public"."DietPlan" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(100),
    "details" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkoutPlan" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(100),
    "details" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CarePlanToDietPlan" (
    "carePlanId" UUID NOT NULL,
    "dietPlanId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "CarePlanToDietPlan_pkey" PRIMARY KEY ("carePlanId","dietPlanId")
);

-- CreateTable
CREATE TABLE "public"."CarePlanToWorkoutPlan" (
    "carePlanId" UUID NOT NULL,
    "workoutPlanId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "CarePlanToWorkoutPlan_pkey" PRIMARY KEY ("carePlanId","workoutPlanId")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "carePlanId" UUID,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DietPlan_name_key" ON "public"."DietPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutPlan_name_key" ON "public"."WorkoutPlan"("name");

-- CreateIndex
CREATE INDEX "auditLogs_entityType_entityId_idx" ON "public"."auditLogs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "public"."CarePlanToDietPlan" ADD CONSTRAINT "CarePlanToDietPlan_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlanToDietPlan" ADD CONSTRAINT "CarePlanToDietPlan_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "public"."DietPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlanToWorkoutPlan" ADD CONSTRAINT "CarePlanToWorkoutPlan_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarePlanToWorkoutPlan" ADD CONSTRAINT "CarePlanToWorkoutPlan_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "public"."WorkoutPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "public"."carePlans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."patients_userId_doctorId" RENAME TO "idx_patients_user_doctor";
