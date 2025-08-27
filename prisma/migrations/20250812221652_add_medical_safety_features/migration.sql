-- CreateEnum
CREATE TYPE "public"."DrugInteractionSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATION');

-- CreateEnum
CREATE TYPE "public"."AllergenType" AS ENUM ('MEDICATION', 'FOOD', 'ENVIRONMENTAL', 'LATEX', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'ANAPHYLAXIS');

-- CreateEnum
CREATE TYPE "public"."MedicationAlertType" AS ENUM ('DRUG_INTERACTION', 'ALLERGY_CONFLICT', 'DOSE_LIMIT_EXCEEDED', 'DUPLICATE_THERAPY', 'AGE_INAPPROPRIATE', 'CONTRAINDICATION', 'MONITORING_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."EmergencyAlertType" AS ENUM ('VITAL_CRITICAL', 'MEDICATION_MISSED_CRITICAL', 'DEVICE_OFFLINE', 'PATIENT_UNRESPONSIVE', 'EMERGENCY_BUTTON', 'FALL_DETECTED', 'MEDICATION_OVERDOSE');

-- CreateEnum
CREATE TYPE "public"."EmergencyPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY', 'LIFE_THREATENING');

-- CreateEnum
CREATE TYPE "public"."VitalConditionType" AS ENUM ('GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'OUTSIDE_RANGE', 'PERCENTAGE_CHANGE');

-- CreateTable
CREATE TABLE "public"."drug_interactions" (
    "id" UUID NOT NULL,
    "rxcui_one" VARCHAR(50) NOT NULL,
    "rxcui_two" VARCHAR(50) NOT NULL,
    "drug_name_one" VARCHAR(255) NOT NULL,
    "drug_name_two" VARCHAR(255) NOT NULL,
    "severity_level" "public"."DrugInteractionSeverity" NOT NULL,
    "interaction_type" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "clinical_effect" TEXT NOT NULL,
    "management_advice" TEXT NOT NULL,
    "evidence_level" VARCHAR(10) NOT NULL,
    "source" VARCHAR(50) NOT NULL DEFAULT 'RxNorm',
    "last_updated" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drug_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_allergies" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "allergen_type" "public"."AllergenType" NOT NULL,
    "allergen_name" VARCHAR(255) NOT NULL,
    "allergen_rxnorm" VARCHAR(50),
    "reaction_severity" "public"."AllergySeverity" NOT NULL,
    "reaction_symptoms" TEXT,
    "onset_date" DATE,
    "verified_by_doctor" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medication_safety_alerts" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "medication_id" UUID,
    "drug_interaction_id" UUID,
    "patient_allergy_id" UUID,
    "alert_type" "public"."MedicationAlertType" NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL,
    "alert_title" VARCHAR(255) NOT NULL,
    "alert_message" TEXT NOT NULL,
    "recommendation" TEXT,
    "requires_override" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "resolution_notes" TEXT,
    "override_reason" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "medication_safety_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emergency_alerts" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "alert_type" "public"."EmergencyAlertType" NOT NULL,
    "priority_level" "public"."EmergencyPriority" NOT NULL,
    "vital_reading_id" UUID,
    "triggered_by_rule" VARCHAR(255),
    "alert_title" VARCHAR(255) NOT NULL,
    "alert_message" TEXT NOT NULL,
    "clinical_context" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by" UUID,
    "acknowledged_at" TIMESTAMPTZ(6),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "resolution_notes" TEXT,
    "notifications_sent" JSONB NOT NULL DEFAULT '[]',
    "escalation_level" INTEGER NOT NULL DEFAULT 0,
    "max_escalations" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vital_alert_rules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "vital_type" VARCHAR(100) NOT NULL,
    "condition_type" "public"."VitalConditionType" NOT NULL,
    "threshold_value" DECIMAL(10,2),
    "threshold_min" DECIMAL(10,2),
    "threshold_max" DECIMAL(10,2),
    "unit" VARCHAR(20),
    "alert_level" "public"."AlertSeverity" NOT NULL,
    "alert_message" TEXT NOT NULL,
    "notification_delay" INTEGER NOT NULL DEFAULT 0,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "gender_specific" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "applies_to_all" BOOLEAN NOT NULL DEFAULT true,
    "patient_conditions" JSONB DEFAULT '[]',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vital_alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emergency_contacts" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "relationship" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "address" JSONB,
    "priority_order" INTEGER NOT NULL DEFAULT 1,
    "can_receive_medical" BOOLEAN NOT NULL DEFAULT false,
    "preferred_contact" VARCHAR(20) NOT NULL DEFAULT 'phone',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hipaa_authorized" BOOLEAN NOT NULL DEFAULT false,
    "authorization_date" TIMESTAMPTZ(6),
    "authorization_expires" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drug_interactions_severity_level_idx" ON "public"."drug_interactions"("severity_level");

-- CreateIndex
CREATE INDEX "drug_interactions_drug_name_one_drug_name_two_idx" ON "public"."drug_interactions"("drug_name_one", "drug_name_two");

-- CreateIndex
CREATE UNIQUE INDEX "drug_interactions_rxcui_one_rxcui_two_key" ON "public"."drug_interactions"("rxcui_one", "rxcui_two");

-- CreateIndex
CREATE INDEX "patient_allergies_patient_id_is_active_idx" ON "public"."patient_allergies"("patient_id", "is_active");

-- CreateIndex
CREATE INDEX "patient_allergies_allergen_type_allergen_name_idx" ON "public"."patient_allergies"("allergen_type", "allergen_name");

-- CreateIndex
CREATE INDEX "medication_safety_alerts_patient_id_severity_resolved_idx" ON "public"."medication_safety_alerts"("patient_id", "severity", "resolved");

-- CreateIndex
CREATE INDEX "medication_safety_alerts_alert_type_created_at_idx" ON "public"."medication_safety_alerts"("alert_type", "created_at");

-- CreateIndex
CREATE INDEX "medication_safety_alerts_resolved_created_at_idx" ON "public"."medication_safety_alerts"("resolved", "created_at");

-- CreateIndex
CREATE INDEX "emergency_alerts_patient_id_priority_level_acknowledged_res_idx" ON "public"."emergency_alerts"("patient_id", "priority_level", "acknowledged", "resolved");

-- CreateIndex
CREATE INDEX "emergency_alerts_alert_type_created_at_idx" ON "public"."emergency_alerts"("alert_type", "created_at");

-- CreateIndex
CREATE INDEX "emergency_alerts_resolved_created_at_idx" ON "public"."emergency_alerts"("resolved", "created_at");

-- CreateIndex
CREATE INDEX "vital_alert_rules_vital_type_is_active_idx" ON "public"."vital_alert_rules"("vital_type", "is_active");

-- CreateIndex
CREATE INDEX "vital_alert_rules_alert_level_idx" ON "public"."vital_alert_rules"("alert_level");

-- CreateIndex
CREATE INDEX "emergency_contacts_patient_id_priority_order_idx" ON "public"."emergency_contacts"("patient_id", "priority_order");

-- CreateIndex
CREATE INDEX "emergency_contacts_patient_id_is_active_idx" ON "public"."emergency_contacts"("patient_id", "is_active");

-- AddForeignKey
ALTER TABLE "public"."patient_allergies" ADD CONSTRAINT "patient_allergies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_allergies" ADD CONSTRAINT "patient_allergies_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_safety_alerts" ADD CONSTRAINT "medication_safety_alerts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_safety_alerts" ADD CONSTRAINT "medication_safety_alerts_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_safety_alerts" ADD CONSTRAINT "medication_safety_alerts_drug_interaction_id_fkey" FOREIGN KEY ("drug_interaction_id") REFERENCES "public"."drug_interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_safety_alerts" ADD CONSTRAINT "medication_safety_alerts_patient_allergy_id_fkey" FOREIGN KEY ("patient_allergy_id") REFERENCES "public"."patient_allergies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_safety_alerts" ADD CONSTRAINT "medication_safety_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_safety_alerts" ADD CONSTRAINT "medication_safety_alerts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_alerts" ADD CONSTRAINT "emergency_alerts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_alerts" ADD CONSTRAINT "emergency_alerts_vital_reading_id_fkey" FOREIGN KEY ("vital_reading_id") REFERENCES "public"."vital_readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_alerts" ADD CONSTRAINT "emergency_alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_alerts" ADD CONSTRAINT "emergency_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vital_alert_rules" ADD CONSTRAINT "vital_alert_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_contacts" ADD CONSTRAINT "emergency_contacts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
