-- CreateTable
CREATE TABLE "public"."blacklistedTokens" (
    "jti" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklistedTokens_pkey" PRIMARY KEY ("jti")
);

-- CreateIndex
CREATE INDEX "blacklistedTokens_expiresAt_idx" ON "public"."blacklistedTokens"("expiresAt");