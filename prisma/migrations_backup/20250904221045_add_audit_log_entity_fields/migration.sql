-- Add missing entityType and entityId columns to auditLogs table
ALTER TABLE "public"."auditLogs" ADD COLUMN "entityType" VARCHAR(50);
ALTER TABLE "public"."auditLogs" ADD COLUMN "entityId" UUID;

-- Add index for better query performance
CREATE INDEX "audit_logs_entityType_idx" ON "public"."auditLogs"("entityType");
CREATE INDEX "audit_logs_entityId_idx" ON "public"."auditLogs"("entityId");