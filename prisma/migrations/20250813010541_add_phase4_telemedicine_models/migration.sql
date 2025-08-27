/*
  Warnings:

  - You are about to drop the column `active_days` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `active_hours_end` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `active_hours_start` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `alert_severity` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `auto_resolve` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `condition_specific` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `consecutive_readings` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `critical_max` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `critical_min` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `doctor_notes` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `escalation_minutes` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `last_triggered` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `max_threshold` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `medication_dependent` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `min_threshold` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `patient_id` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `rule_name` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `suppress_duplicates` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `time_window_minutes` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `trend_detection` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `trend_period_hours` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `trigger_count` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the `_DeviceReadingToEmergencyAlert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `connected_devices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `device_plugins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `device_readings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `alert_level` to the `vital_alert_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `alert_message` to the `vital_alert_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `condition_type` to the `vital_alert_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `vital_alert_rules` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ConsultationType" AS ENUM ('VIDEO_CONSULTATION', 'AUDIO_CONSULTATION', 'CHAT_CONSULTATION', 'EMERGENCY_CONSULTATION', 'FOLLOW_UP_CONSULTATION', 'SPECIALIST_REFERRAL');

-- CreateEnum
CREATE TYPE "public"."ConsultationStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED', 'INTERRUPTED');

-- CreateEnum
CREATE TYPE "public"."ConsultationPriority" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "public"."LabOrderStatus" AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REPORT_READY');

-- CreateEnum
CREATE TYPE "public"."LabTestCategory" AS ENUM ('BLOOD_CHEMISTRY', 'HEMATOLOGY', 'MICROBIOLOGY', 'PATHOLOGY', 'RADIOLOGY', 'CARDIOLOGY', 'ENDOCRINOLOGY', 'IMMUNOLOGY');

-- CreateEnum
CREATE TYPE "public"."GameBadgeType" AS ENUM ('ADHERENCE_STREAK', 'APPOINTMENT_KEEPER', 'VITAL_TRACKER', 'EXERCISE_CHAMPION', 'MEDICATION_MASTER', 'HEALTH_IMPROVEMENT', 'GOAL_ACHIEVER');

-- CreateEnum
CREATE TYPE "public"."GameChallengeType" AS ENUM ('DAILY_MEDICATION', 'WEEKLY_VITALS', 'MONTHLY_CHECKUP', 'EXERCISE_MINUTES', 'WEIGHT_MANAGEMENT', 'BLOOD_PRESSURE_CONTROL', 'GLUCOSE_MANAGEMENT');

-- DropForeignKey
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" DROP CONSTRAINT "_DeviceReadingToEmergencyAlert_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" DROP CONSTRAINT "_DeviceReadingToEmergencyAlert_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."connected_devices" DROP CONSTRAINT "connected_devices_added_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."connected_devices" DROP CONSTRAINT "connected_devices_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."device_readings" DROP CONSTRAINT "device_readings_device_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."device_readings" DROP CONSTRAINT "device_readings_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."device_readings" DROP CONSTRAINT "device_readings_vital_reading_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vital_alert_rules" DROP CONSTRAINT "vital_alert_rules_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."vital_alert_rules" DROP CONSTRAINT "vital_alert_rules_patient_id_fkey";

-- DropIndex
DROP INDEX "public"."vital_alert_rules_is_active_last_triggered_idx";

-- DropIndex
DROP INDEX "public"."vital_alert_rules_patient_id_vital_type_is_active_idx";

-- AlterTable
ALTER TABLE "public"."vital_alert_rules" DROP COLUMN "active_days",
DROP COLUMN "active_hours_end",
DROP COLUMN "active_hours_start",
DROP COLUMN "alert_severity",
DROP COLUMN "auto_resolve",
DROP COLUMN "condition_specific",
DROP COLUMN "consecutive_readings",
DROP COLUMN "critical_max",
DROP COLUMN "critical_min",
DROP COLUMN "doctor_notes",
DROP COLUMN "escalation_minutes",
DROP COLUMN "last_triggered",
DROP COLUMN "max_threshold",
DROP COLUMN "medication_dependent",
DROP COLUMN "min_threshold",
DROP COLUMN "patient_id",
DROP COLUMN "rule_name",
DROP COLUMN "suppress_duplicates",
DROP COLUMN "time_window_minutes",
DROP COLUMN "trend_detection",
DROP COLUMN "trend_period_hours",
DROP COLUMN "trigger_count",
ADD COLUMN     "alert_level" "public"."AlertSeverity" NOT NULL,
ADD COLUMN     "alert_message" TEXT NOT NULL,
ADD COLUMN     "applies_to_all" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "condition_type" "public"."VitalConditionType" NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "gender_specific" VARCHAR(10),
ADD COLUMN     "max_age" INTEGER,
ADD COLUMN     "min_age" INTEGER,
ADD COLUMN     "name" VARCHAR(255) NOT NULL,
ADD COLUMN     "notification_delay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "patient_conditions" JSONB DEFAULT '[]',
ADD COLUMN     "threshold_max" DECIMAL(10,2),
ADD COLUMN     "threshold_min" DECIMAL(10,2),
ADD COLUMN     "threshold_value" DECIMAL(10,2),
ADD COLUMN     "unit" VARCHAR(20),
ALTER COLUMN "created_by" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."_DeviceReadingToEmergencyAlert";

-- DropTable
DROP TABLE "public"."connected_devices";

-- DropTable
DROP TABLE "public"."device_plugins";

-- DropTable
DROP TABLE "public"."device_readings";

-- DropEnum
DROP TYPE "public"."ConnectionType";

-- DropEnum
DROP TYPE "public"."DeviceStatus";

-- DropEnum
DROP TYPE "public"."DeviceType";

-- DropEnum
DROP TYPE "public"."VitalAlertStatus";

-- DropEnum
DROP TYPE "public"."VitalTrendType";

-- CreateTable
CREATE TABLE "public"."video_consultations" (
    "id" UUID NOT NULL,
    "consultation_id" VARCHAR(255) NOT NULL,
    "doctor_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "appointment_id" UUID,
    "consultation_type" "public"."ConsultationType" NOT NULL DEFAULT 'VIDEO_CONSULTATION',
    "status" "public"."ConsultationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "priority" "public"."ConsultationPriority" NOT NULL DEFAULT 'ROUTINE',
    "scheduled_start" TIMESTAMPTZ(6) NOT NULL,
    "scheduled_end" TIMESTAMPTZ(6) NOT NULL,
    "actual_start" TIMESTAMPTZ(6),
    "actual_end" TIMESTAMPTZ(6),
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "room_id" VARCHAR(255),
    "room_token" TEXT,
    "doctor_join_url" TEXT,
    "patient_join_url" TEXT,
    "recording_enabled" BOOLEAN NOT NULL DEFAULT false,
    "recording_url" TEXT,
    "chief_complaint" TEXT,
    "presenting_symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consultation_notes" TEXT,
    "diagnosis" TEXT,
    "treatment_plan" TEXT,
    "follow_up_required" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" TIMESTAMPTZ(6),
    "connection_quality" JSONB DEFAULT '{}',
    "technical_issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration_minutes" INTEGER,
    "consultation_fee" DECIMAL(10,2),
    "insurance_covered" BOOLEAN NOT NULL DEFAULT false,
    "payment_status" VARCHAR(50) DEFAULT 'pending',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "video_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultation_prescriptions" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "medication_name" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "quantity" INTEGER,
    "instructions" TEXT,
    "refills_allowed" INTEGER NOT NULL DEFAULT 0,
    "ndc_code" VARCHAR(50),
    "generic_substitution" BOOLEAN NOT NULL DEFAULT true,
    "pharmacy_instructions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consultation_notes" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "note_type" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "consultation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lab_orders" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(100) NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "consultation_id" UUID,
    "order_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" VARCHAR(50) NOT NULL DEFAULT 'routine',
    "status" "public"."LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "category" "public"."LabTestCategory" NOT NULL DEFAULT 'BLOOD_CHEMISTRY',
    "ordered_tests" JSONB NOT NULL DEFAULT '[]',
    "clinical_indication" TEXT,
    "special_instructions" TEXT,
    "lab_facility_name" VARCHAR(255),
    "lab_facility_code" VARCHAR(100),
    "collection_date" TIMESTAMPTZ(6),
    "expected_result_date" TIMESTAMPTZ(6),
    "results_available" BOOLEAN NOT NULL DEFAULT false,
    "results_data" JSONB DEFAULT '{}',
    "results_pdf_url" TEXT,
    "critical_values" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lab_results" (
    "id" UUID NOT NULL,
    "lab_order_id" UUID NOT NULL,
    "test_name" VARCHAR(255) NOT NULL,
    "test_code" VARCHAR(50),
    "result_value" VARCHAR(255),
    "numeric_value" DECIMAL(10,3),
    "result_unit" VARCHAR(50),
    "reference_range" VARCHAR(255),
    "result_status" VARCHAR(50) NOT NULL DEFAULT 'final',
    "abnormal_flag" VARCHAR(10),
    "critical_flag" BOOLEAN NOT NULL DEFAULT false,
    "collection_date" TIMESTAMPTZ(6),
    "result_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_date" TIMESTAMPTZ(6),
    "method" VARCHAR(255),
    "specimen_type" VARCHAR(100),
    "comments" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_game_profiles" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "experience_points" INTEGER NOT NULL DEFAULT 0,
    "medication_streak" INTEGER NOT NULL DEFAULT 0,
    "appointment_streak" INTEGER NOT NULL DEFAULT 0,
    "vitals_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "badges_earned" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "challenges_completed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "login_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity" TIMESTAMPTZ(6),
    "total_activities" INTEGER NOT NULL DEFAULT 0,
    "gamification_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "public_profile" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_game_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_badge_awards" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "badge_type" "public"."GameBadgeType" NOT NULL,
    "badge_name" VARCHAR(255) NOT NULL,
    "badge_description" TEXT,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "awarded_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "badge_icon" VARCHAR(255),
    "badge_color" VARCHAR(50),
    "achievement_data" JSONB DEFAULT '{}',

    CONSTRAINT "game_badge_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_challenge_progress" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "challenge_type" "public"."GameChallengeType" NOT NULL,
    "challenge_name" VARCHAR(255) NOT NULL,
    "target_value" INTEGER NOT NULL,
    "current_progress" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completion_date" TIMESTAMPTZ(6),
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "challenge_rules" JSONB DEFAULT '{}',
    "progress_data" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "game_challenge_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_consultations_consultation_id_key" ON "public"."video_consultations"("consultation_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_consultations_room_id_key" ON "public"."video_consultations"("room_id");

-- CreateIndex
CREATE INDEX "video_consultations_doctor_id_scheduled_start_idx" ON "public"."video_consultations"("doctor_id", "scheduled_start");

-- CreateIndex
CREATE INDEX "video_consultations_patient_id_status_idx" ON "public"."video_consultations"("patient_id", "status");

-- CreateIndex
CREATE INDEX "video_consultations_status_scheduled_start_idx" ON "public"."video_consultations"("status", "scheduled_start");

-- CreateIndex
CREATE INDEX "video_consultations_consultation_type_priority_idx" ON "public"."video_consultations"("consultation_type", "priority");

-- CreateIndex
CREATE INDEX "consultation_prescriptions_consultation_id_idx" ON "public"."consultation_prescriptions"("consultation_id");

-- CreateIndex
CREATE INDEX "consultation_notes_consultation_id_note_type_idx" ON "public"."consultation_notes"("consultation_id", "note_type");

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_order_number_key" ON "public"."lab_orders"("order_number");

-- CreateIndex
CREATE INDEX "lab_orders_patient_id_status_idx" ON "public"."lab_orders"("patient_id", "status");

-- CreateIndex
CREATE INDEX "lab_orders_doctor_id_order_date_idx" ON "public"."lab_orders"("doctor_id", "order_date");

-- CreateIndex
CREATE INDEX "lab_orders_status_expected_result_date_idx" ON "public"."lab_orders"("status", "expected_result_date");

-- CreateIndex
CREATE INDEX "lab_results_lab_order_id_idx" ON "public"."lab_results"("lab_order_id");

-- CreateIndex
CREATE INDEX "lab_results_test_name_result_date_idx" ON "public"."lab_results"("test_name", "result_date");

-- CreateIndex
CREATE INDEX "lab_results_critical_flag_result_date_idx" ON "public"."lab_results"("critical_flag", "result_date");

-- CreateIndex
CREATE UNIQUE INDEX "patient_game_profiles_patient_id_key" ON "public"."patient_game_profiles"("patient_id");

-- CreateIndex
CREATE INDEX "patient_game_profiles_total_points_current_level_idx" ON "public"."patient_game_profiles"("total_points", "current_level");

-- CreateIndex
CREATE INDEX "patient_game_profiles_patient_id_last_activity_idx" ON "public"."patient_game_profiles"("patient_id", "last_activity");

-- CreateIndex
CREATE INDEX "game_badge_awards_patient_id_awarded_date_idx" ON "public"."game_badge_awards"("patient_id", "awarded_date");

-- CreateIndex
CREATE INDEX "game_badge_awards_badge_type_idx" ON "public"."game_badge_awards"("badge_type");

-- CreateIndex
CREATE INDEX "game_challenge_progress_patient_id_is_completed_idx" ON "public"."game_challenge_progress"("patient_id", "is_completed");

-- CreateIndex
CREATE INDEX "game_challenge_progress_challenge_type_end_date_idx" ON "public"."game_challenge_progress"("challenge_type", "end_date");

-- CreateIndex
CREATE INDEX "vital_alert_rules_vital_type_is_active_idx" ON "public"."vital_alert_rules"("vital_type", "is_active");

-- CreateIndex
CREATE INDEX "vital_alert_rules_alert_level_idx" ON "public"."vital_alert_rules"("alert_level");

-- AddForeignKey
ALTER TABLE "public"."vital_alert_rules" ADD CONSTRAINT "vital_alert_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_consultations" ADD CONSTRAINT "video_consultations_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_consultations" ADD CONSTRAINT "video_consultations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_consultations" ADD CONSTRAINT "video_consultations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_consultations" ADD CONSTRAINT "video_consultations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_prescriptions" ADD CONSTRAINT "consultation_prescriptions_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."video_consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_notes" ADD CONSTRAINT "consultation_notes_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."video_consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consultation_notes" ADD CONSTRAINT "consultation_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_orders" ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_orders" ADD CONSTRAINT "lab_orders_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_orders" ADD CONSTRAINT "lab_orders_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."video_consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_results" ADD CONSTRAINT "lab_results_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "public"."lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_game_profiles" ADD CONSTRAINT "patient_game_profiles_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_badge_awards" ADD CONSTRAINT "game_badge_awards_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_game_profiles"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."game_challenge_progress" ADD CONSTRAINT "game_challenge_progress_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient_game_profiles"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;
