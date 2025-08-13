/*
  Warnings:

  - You are about to drop the column `alert_level` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `alert_message` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `applies_to_all` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `condition_type` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `gender_specific` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `max_age` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `min_age` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `notification_delay` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `patient_conditions` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `threshold_max` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `threshold_min` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `threshold_value` on the `vital_alert_rules` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `vital_alert_rules` table. All the data in the column will be lost.
  - Added the required column `patient_id` to the `vital_alert_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rule_name` to the `vital_alert_rules` table without a default value. This is not possible if the table is not empty.
  - Made the column `created_by` on table `vital_alert_rules` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('WEARABLE', 'BLOOD_PRESSURE', 'GLUCOSE_METER', 'PULSE_OXIMETER', 'THERMOMETER', 'ECG_MONITOR', 'SCALE', 'SPIROMETER', 'GENERIC_BLUETOOTH');

-- CreateEnum
CREATE TYPE "public"."DeviceStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'SYNCING', 'ERROR', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."ConnectionType" AS ENUM ('BLUETOOTH_LE', 'WIFI', 'API_OAUTH', 'MANUAL_ENTRY', 'BRIDGE_DEVICE');

-- CreateEnum
CREATE TYPE "public"."VitalAlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "public"."VitalTrendType" AS ENUM ('STABLE', 'IMPROVING', 'DETERIORATING', 'CRITICAL_CHANGE', 'UNKNOWN');

-- DropForeignKey
ALTER TABLE "public"."vital_alert_rules" DROP CONSTRAINT "vital_alert_rules_created_by_fkey";

-- DropIndex
DROP INDEX "public"."vital_alert_rules_alert_level_idx";

-- DropIndex
DROP INDEX "public"."vital_alert_rules_vital_type_is_active_idx";

-- AlterTable
ALTER TABLE "public"."vital_alert_rules" DROP COLUMN "alert_level",
DROP COLUMN "alert_message",
DROP COLUMN "applies_to_all",
DROP COLUMN "condition_type",
DROP COLUMN "description",
DROP COLUMN "gender_specific",
DROP COLUMN "max_age",
DROP COLUMN "min_age",
DROP COLUMN "name",
DROP COLUMN "notification_delay",
DROP COLUMN "patient_conditions",
DROP COLUMN "threshold_max",
DROP COLUMN "threshold_min",
DROP COLUMN "threshold_value",
DROP COLUMN "unit",
ADD COLUMN     "active_days" TEXT[] DEFAULT ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::TEXT[],
ADD COLUMN     "active_hours_end" VARCHAR(5),
ADD COLUMN     "active_hours_start" VARCHAR(5),
ADD COLUMN     "alert_severity" "public"."AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "auto_resolve" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "condition_specific" VARCHAR(255),
ADD COLUMN     "consecutive_readings" INTEGER DEFAULT 1,
ADD COLUMN     "critical_max" DECIMAL(10,3),
ADD COLUMN     "critical_min" DECIMAL(10,3),
ADD COLUMN     "doctor_notes" TEXT,
ADD COLUMN     "escalation_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "last_triggered" TIMESTAMPTZ(6),
ADD COLUMN     "max_threshold" DECIMAL(10,3),
ADD COLUMN     "medication_dependent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "min_threshold" DECIMAL(10,3),
ADD COLUMN     "patient_id" UUID NOT NULL,
ADD COLUMN     "rule_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "suppress_duplicates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "time_window_minutes" INTEGER DEFAULT 60,
ADD COLUMN     "trend_detection" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trend_period_hours" INTEGER DEFAULT 24,
ADD COLUMN     "trigger_count" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "created_by" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."connected_devices" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "plugin_id" VARCHAR(100) NOT NULL,
    "device_name" VARCHAR(255) NOT NULL,
    "device_model" VARCHAR(255),
    "device_type" "public"."DeviceType" NOT NULL,
    "manufacturer" VARCHAR(255),
    "serial_number" VARCHAR(100),
    "firmware_version" VARCHAR(50),
    "connection_type" "public"."ConnectionType" NOT NULL,
    "device_identifier" VARCHAR(255) NOT NULL,
    "connection_config" JSONB DEFAULT '{}',
    "last_connected" TIMESTAMPTZ(6),
    "connection_status" "public"."DeviceStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "auto_sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sync_interval_minutes" INTEGER NOT NULL DEFAULT 15,
    "last_sync" TIMESTAMPTZ(6),
    "sync_error_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "added_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "connected_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."device_readings" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "plugin_id" VARCHAR(100) NOT NULL,
    "vital_reading_id" UUID,
    "reading_type" VARCHAR(100) NOT NULL,
    "measurement_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "received_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_data" JSONB NOT NULL DEFAULT '{}',
    "processed_values" JSONB NOT NULL DEFAULT '{}',
    "primary_value" DECIMAL(10,3),
    "secondary_value" DECIMAL(10,3),
    "measurement_unit" VARCHAR(50),
    "data_quality_score" DECIMAL(3,2),
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "validation_notes" TEXT,
    "is_anomaly" BOOLEAN NOT NULL DEFAULT false,
    "anomaly_reason" VARCHAR(255),
    "reading_context" VARCHAR(255),
    "symptoms_reported" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medication_taken" BOOLEAN,
    "triggered_alerts" BOOLEAN NOT NULL DEFAULT false,
    "alert_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sync_batch_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."device_plugins" (
    "id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "supported_devices" "public"."DeviceType"[],
    "supported_regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "api_version" VARCHAR(10) NOT NULL,
    "default_config" JSONB NOT NULL DEFAULT '{}',
    "oauth_config" JSONB DEFAULT '{}',
    "rate_limits" JSONB DEFAULT '{}',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "requires_auth" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "installed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMPTZ(6) NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "device_plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_DeviceReadingToEmergencyAlert" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_DeviceReadingToEmergencyAlert_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "connected_devices_plugin_id_device_type_idx" ON "public"."connected_devices"("plugin_id", "device_type");

-- CreateIndex
CREATE INDEX "connected_devices_patient_id_connection_status_idx" ON "public"."connected_devices"("patient_id", "connection_status");

-- CreateIndex
CREATE UNIQUE INDEX "connected_devices_patient_id_device_identifier_key" ON "public"."connected_devices"("patient_id", "device_identifier");

-- CreateIndex
CREATE INDEX "device_readings_patient_id_reading_type_measurement_timesta_idx" ON "public"."device_readings"("patient_id", "reading_type", "measurement_timestamp");

-- CreateIndex
CREATE INDEX "device_readings_device_id_measurement_timestamp_idx" ON "public"."device_readings"("device_id", "measurement_timestamp");

-- CreateIndex
CREATE INDEX "device_readings_plugin_id_reading_type_idx" ON "public"."device_readings"("plugin_id", "reading_type");

-- CreateIndex
CREATE INDEX "device_readings_triggered_alerts_measurement_timestamp_idx" ON "public"."device_readings"("triggered_alerts", "measurement_timestamp");

-- CreateIndex
CREATE INDEX "_DeviceReadingToEmergencyAlert_B_index" ON "public"."_DeviceReadingToEmergencyAlert"("B");

-- CreateIndex
CREATE INDEX "vital_alert_rules_patient_id_vital_type_is_active_idx" ON "public"."vital_alert_rules"("patient_id", "vital_type", "is_active");

-- CreateIndex
CREATE INDEX "vital_alert_rules_is_active_last_triggered_idx" ON "public"."vital_alert_rules"("is_active", "last_triggered");

-- AddForeignKey
ALTER TABLE "public"."connected_devices" ADD CONSTRAINT "connected_devices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connected_devices" ADD CONSTRAINT "connected_devices_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."device_readings" ADD CONSTRAINT "device_readings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."connected_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."device_readings" ADD CONSTRAINT "device_readings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."device_readings" ADD CONSTRAINT "device_readings_vital_reading_id_fkey" FOREIGN KEY ("vital_reading_id") REFERENCES "public"."vital_readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vital_alert_rules" ADD CONSTRAINT "vital_alert_rules_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vital_alert_rules" ADD CONSTRAINT "vital_alert_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" ADD CONSTRAINT "_DeviceReadingToEmergencyAlert_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."device_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" ADD CONSTRAINT "_DeviceReadingToEmergencyAlert_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."emergency_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
