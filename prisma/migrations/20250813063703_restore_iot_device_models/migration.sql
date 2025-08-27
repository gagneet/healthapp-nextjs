-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('WEARABLE', 'BLOOD_PRESSURE', 'GLUCOSE_METER', 'PULSE_OXIMETER', 'THERMOMETER', 'ECG_MONITOR', 'SCALE', 'SPIROMETER', 'GENERIC_BLUETOOTH');

-- CreateEnum
CREATE TYPE "public"."DeviceStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'SYNCING', 'ERROR', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."ConnectionType" AS ENUM ('BLUETOOTH_LE', 'WIFI', 'API_OAUTH', 'MANUAL_ENTRY', 'BRIDGE_DEVICE');

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
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" ADD CONSTRAINT "_DeviceReadingToEmergencyAlert_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."device_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_DeviceReadingToEmergencyAlert" ADD CONSTRAINT "_DeviceReadingToEmergencyAlert_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."emergency_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
