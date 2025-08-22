/*
  Warnings:

  - The `assignment_type` column on the `patient_doctor_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `patient_consent_status` column on the `patient_doctor_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."enum_patient_doctor_assignment_type" AS ENUM ('PRIMARY', 'SPECIALIST', 'SUBSTITUTE', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "public"."enum_patient_doctor_assignment_consent_status" AS ENUM ('NOT_REQUIRED', 'PENDING', 'REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."patient_doctor_assignments" DROP COLUMN "assignment_type",
ADD COLUMN     "assignment_type" "public"."enum_patient_doctor_assignment_type" NOT NULL DEFAULT 'SPECIALIST',
DROP COLUMN "patient_consent_status",
ADD COLUMN     "patient_consent_status" "public"."enum_patient_doctor_assignment_consent_status" DEFAULT 'NOT_REQUIRED';

-- CreateIndex
CREATE INDEX "idx_assignments_patient_type_active" ON "public"."patient_doctor_assignments"("patient_id", "assignment_type", "is_active");

-- CreateIndex
CREATE INDEX "patient_doctor_assignments_assignment_type" ON "public"."patient_doctor_assignments"("assignment_type");

-- CreateIndex
CREATE INDEX "patient_doctor_assignments_patient_consent_status" ON "public"."patient_doctor_assignments"("patient_consent_status");
