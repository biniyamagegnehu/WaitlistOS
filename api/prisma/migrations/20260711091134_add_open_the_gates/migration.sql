-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('WAITING', 'INVITED', 'ACCESSED');

-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "accessedAt" TIMESTAMP(3),
ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ParticipantStatus" NOT NULL DEFAULT 'WAITING';

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_invitations" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cohorts_waitlistId_idx" ON "cohorts"("waitlistId");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_waitlistId_batchNumber_key" ON "cohorts"("waitlistId", "batchNumber");

-- CreateIndex
CREATE INDEX "cohort_invitations_participantId_idx" ON "cohort_invitations"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_invitations_cohortId_participantId_key" ON "cohort_invitations"("cohortId", "participantId");

-- CreateIndex
CREATE INDEX "participants_waitlistId_status_idx" ON "participants"("waitlistId", "status");

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_invitations" ADD CONSTRAINT "cohort_invitations_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_invitations" ADD CONSTRAINT "cohort_invitations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
