-- CreateEnum
CREATE TYPE "TrafficSource" AS ENUM ('DIRECT', 'TWITTER', 'WHATSAPP', 'INSTAGRAM', 'EMAIL', 'PRODUCT_HUNT', 'LINKEDIN', 'FACEBOOK', 'TELEGRAM', 'GOOGLE', 'OTHER', 'UNKNOWN');

-- AlterTable
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "browserName" TEXT,
ADD COLUMN IF NOT EXISTS "campaign" TEXT,
ADD COLUMN IF NOT EXISTS "countryCode" TEXT,
ADD COLUMN IF NOT EXISTS "deviceType" TEXT,
ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
ADD COLUMN IF NOT EXISTS "landingPath" TEXT,
ADD COLUMN IF NOT EXISTS "medium" TEXT,
ADD COLUMN IF NOT EXISTS "referrer" TEXT,
ADD COLUMN IF NOT EXISTS "source" "TrafficSource";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "participants_waitlistId_countryCode_createdAt_idx" ON "participants"("waitlistId", "countryCode", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "participants_waitlistId_deviceType_createdAt_idx" ON "participants"("waitlistId", "deviceType", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "participants_waitlistId_browserName_createdAt_idx" ON "participants"("waitlistId", "browserName", "createdAt");
