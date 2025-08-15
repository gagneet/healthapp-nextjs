/*
  Warnings:

  - You are about to drop the `healthcare_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."healthcare_sessions" DROP CONSTRAINT "healthcare_sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."accounts" ADD COLUMN     "last_used_at" TIMESTAMPTZ(6),
ADD COLUMN     "linked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "provider_email" VARCHAR(255),
ADD COLUMN     "provider_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."sessions" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "healthcare_context" JSONB DEFAULT '{}',
ADD COLUMN     "ip_address" VARCHAR(45),
ADD COLUMN     "last_accessed_at" TIMESTAMPTZ(6),
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "email_verified_at" TIMESTAMPTZ(6),
ADD COLUMN     "image" VARCHAR(500),
ADD COLUMN     "name" VARCHAR(255),
ALTER COLUMN "password_hash" DROP NOT NULL;

-- Populate Auth.js v5 fields from existing data
UPDATE "public"."users" SET 
    "name" = COALESCE(
        NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), 
        first_name, 
        last_name, 
        email
    ),
    "image" = profile_picture_url,
    "email_verified_at" = CASE 
        WHEN email_verified = true THEN created_at 
        ELSE NULL 
    END
WHERE "name" IS NULL;

-- DropTable
DROP TABLE "public"."healthcare_sessions";

-- CreateIndex
CREATE INDEX "accounts_userId_provider_idx" ON "public"."accounts"("userId", "provider");

-- CreateIndex
CREATE INDEX "sessions_user_id" ON "public"."sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expires" ON "public"."sessions"("expires");

-- CreateIndex
CREATE INDEX "sessions_ip_address" ON "public"."sessions"("ip_address");
