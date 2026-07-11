-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('POSITION_BOOST', 'EARLY_ACCESS', 'VIP_ACCESS', 'DISCOUNT', 'CUSTOM');

-- AlterTable
ALTER TABLE "waitlists" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "type" "RewardType" NOT NULL,
    "value" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_rewards" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rewards_waitlistId_milestone_key" ON "rewards"("waitlistId", "milestone");

-- CreateIndex
CREATE UNIQUE INDEX "participant_rewards_participantId_rewardId_key" ON "participant_rewards"("participantId", "rewardId");

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_rewards" ADD CONSTRAINT "participant_rewards_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_rewards" ADD CONSTRAINT "participant_rewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
