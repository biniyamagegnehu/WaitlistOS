-- CreateEnum
CREATE TYPE "FileProvider" AS ENUM ('CLOUDINARY');

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "folder" TEXT NOT NULL,
    "provider" "FileProvider" NOT NULL DEFAULT 'CLOUDINARY',
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "waitlists" ADD COLUMN "tagline" TEXT;
ALTER TABLE "waitlists" ADD COLUMN "description" TEXT;
ALTER TABLE "waitlists" ADD COLUMN "logoId" TEXT;
ALTER TABLE "waitlists" ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "waitlists" SET "tagline" = "name", "updatedAt" = "createdAt" WHERE "tagline" IS NULL;

ALTER TABLE "waitlists" ALTER COLUMN "tagline" SET NOT NULL;
ALTER TABLE "waitlists" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "waitlists" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "brandings" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "logoId" TEXT,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "buttonColor" TEXT NOT NULL,
    "font" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brandings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widgets" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "scriptUrl" TEXT NOT NULL,
    "embedCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_uploadedByUserId_idx" ON "files"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "waitlists_founderId_idx" ON "waitlists"("founderId");

-- CreateIndex
CREATE UNIQUE INDEX "brandings_waitlistId_key" ON "brandings"("waitlistId");

-- CreateIndex
CREATE UNIQUE INDEX "widgets_waitlistId_key" ON "widgets"("waitlistId");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brandings" ADD CONSTRAINT "brandings_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brandings" ADD CONSTRAINT "brandings_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill branding and widget records for existing waitlists
INSERT INTO "brandings" (
    "id",
    "waitlistId",
    "logoId",
    "primaryColor",
    "secondaryColor",
    "backgroundColor",
    "buttonColor",
    "font",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    w."id",
    w."logoId",
    '#6366F1',
    '#818CF8',
    '#0D0D14',
    '#6366F1',
    'Inter',
    w."createdAt",
    w."updatedAt"
FROM "waitlists" w
WHERE NOT EXISTS (
    SELECT 1 FROM "brandings" b WHERE b."waitlistId" = w."id"
);

INSERT INTO "widgets" (
    "id",
    "waitlistId",
    "scriptUrl",
    "embedCode",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    w."id",
    'http://localhost:3001/widget.js',
    '<script src="http://localhost:3001/widget.js" data-waitlist="' || w."slug" || '"></script>',
    w."createdAt",
    w."updatedAt"
FROM "waitlists" w
WHERE NOT EXISTS (
    SELECT 1 FROM "widgets" wt WHERE wt."waitlistId" = w."id"
);
