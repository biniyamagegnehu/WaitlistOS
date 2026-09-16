-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "SignupStatus" AS ENUM ('PARTIAL', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RiskLevel" AS ENUM ('HEALTHY', 'MEDIUM_RISK', 'HIGH_RISK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "FunnelEventType" AS ENUM ('PAGE_VISIT', 'FORM_FOCUS', 'SIGNUP_SUBMITTED', 'REFERRAL_SHARED', 'EMAIL_SUBMITTED', 'QUESTIONS_STARTED', 'QUESTIONS_COMPLETED', 'SIGNUP_COMPLETED', 'REFERRAL_STEP_VIEWED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "GrowthPeriodType" AS ENUM ('HOUR', 'DAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ThemeMode" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PaymentAccountStatus" AS ENUM ('NOT_CONNECTED', 'PENDING', 'ACTION_REQUIRED', 'ACTIVE', 'RESTRICTED', 'DISCONNECTED', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MonetizationPaymentType" AS ENUM ('SKIP_LINE', 'PRE_ORDER_DEPOSIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MonetizationPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PreOrderDepositPolicy" AS ENUM ('REFUNDABLE', 'CREDIT_TOWARD_PURCHASE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PreOrderDepositStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED', 'COLLECTION_PENDING', 'COLLECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AffiliateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AffiliateAttributionStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AffiliateConversionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REVERSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AffiliateCommissionStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'PAID', 'REVERSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AffiliatePayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'STRIPE';

-- AlterTable
ALTER TABLE "founders" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT,
ALTER COLUMN "onboardingCompleted" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "accessTokenCreatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "accessTokenHash" TEXT,
ADD COLUMN IF NOT EXISTS "accessTokenRevokedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "customFields" JSONB,
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "hasSkipLinePriority" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastPositionUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "lastSuccessfulReferralAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "signupStatus" "SignupStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN IF NOT EXISTS "skipLinePriorityGrantedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "teamId" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "waitlists" ADD COLUMN IF NOT EXISTS "batchDescription" TEXT,
ADD COLUMN IF NOT EXISTS "batchEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "batchName" TEXT,
ADD COLUMN IF NOT EXISTS "batchSize" INTEGER,
ADD COLUMN IF NOT EXISTS "countdownEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "doubleSidedRewardsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "doubleSidedRewardsGranted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "launchDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "maxTeamSize" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS "newParticipantRankingBonus" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS "preOrderDepositAmount" DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS "preOrderDepositDescription" TEXT,
ADD COLUMN IF NOT EXISTS "preOrderDepositEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "referrerRankingBonus" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS "showBatchProgress" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "showCountdown" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "showRemainingSpots" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "skipLineEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "skipLinePrice" DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS "streakBonusesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "teamReferralsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "themeMode" "ThemeMode" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN IF NOT EXISTS "totalNewParticipantRankingBonusAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalReferrerRankingBonusAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "urgencyEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "waitlist_signup_configs" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_signup_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "streak_milestones" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "type" "RewardType" NOT NULL,
    "value" INTEGER,
    "valueType" TEXT DEFAULT 'fixed',
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streak_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "participant_streak_rewards" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "streakMilestoneId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_streak_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "waitlist_copies" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subheadline" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "faqs" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "waitlist_copy_versions" (
    "id" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subheadline" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "faqs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_copy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "participant_referral_messages" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "twitter" TEXT NOT NULL,
    "linkedin" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_referral_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "participant_engagements" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEmailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "participant_engagement_logs" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_engagement_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "teams" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "team_invitations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "team_reward_milestones" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "type" "RewardType" NOT NULL,
    "value" INTEGER,
    "valueType" TEXT DEFAULT 'fixed',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_reward_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "team_milestone_rewards" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamRewardMilestoneId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_milestone_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "team_participant_rewards" (
    "id" TEXT NOT NULL,
    "teamMilestoneRewardId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_participant_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "attribution_visits" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "source" "TrafficSource" NOT NULL,
    "medium" TEXT,
    "campaign" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribution_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "funnel_events" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" "FunnelEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "daily_funnel_stats" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "eventType" "FunnelEventType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_funnel_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "growth_timeseries" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodType" "GrowthPeriodType" NOT NULL,
    "signupCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_timeseries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "referral_spikes" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "referrerParticipantId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "signupCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_spikes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_accounts" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerAccountId" TEXT,
    "status" "PaymentAccountStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "connectedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "monetization_payments" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "participantId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "paymentType" "MonetizationPaymentType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "platformFee" DECIMAL(12,2) NOT NULL,
    "providerFee" DECIMAL(12,2) NOT NULL,
    "founderAmount" DECIMAL(12,2) NOT NULL,
    "status" "MonetizationPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "chargedAmount" DECIMAL(12,2),
    "chargedCurrency" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monetization_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "monetization_payment_events" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "paymentId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monetization_payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "pre_order_deposits" (
    "id" TEXT NOT NULL,
    "waitlistId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "monetizationPaymentId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PreOrderDepositStatus" NOT NULL DEFAULT 'PENDING',
    "policy" "PreOrderDepositPolicy" NOT NULL,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_order_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "affiliates" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'ACTIVE',
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "preferredPayoutProvider" "PaymentProvider",
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    "commissionDurationMonths" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "sessionToken" TEXT,
    "ipHash" TEXT,
    "deviceType" TEXT,
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "affiliate_attributions" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "referredFounderId" TEXT NOT NULL,
    "affiliateClickId" TEXT,
    "status" "AffiliateAttributionStatus" NOT NULL DEFAULT 'ACTIVE',
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "affiliate_conversions" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "referredFounderId" TEXT NOT NULL,
    "attributionId" TEXT NOT NULL,
    "sourcePaymentId" TEXT NOT NULL,
    "status" "AffiliateConversionStatus" NOT NULL DEFAULT 'PENDING',
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "affiliate_commissions" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "referredFounderId" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "sourcePaymentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "status" "AffiliateCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "eligibleAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "affiliate_payouts" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "payoutAccountId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "AffiliatePayoutStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "providerTransactionId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "failureReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_signup_configs_waitlistId_key" ON "waitlist_signup_configs"("waitlistId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "streak_milestones_waitlistId_days_key" ON "streak_milestones"("waitlistId", "days");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "participant_streak_rewards_participantId_streakMilestoneId_key" ON "participant_streak_rewards"("participantId", "streakMilestoneId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_logs_userId_idx" ON "ai_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_copies_waitlistId_key" ON "waitlist_copies"("waitlistId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "waitlist_copy_versions_copyId_idx" ON "waitlist_copy_versions"("copyId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "participant_referral_messages_participantId_key" ON "participant_referral_messages"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "participant_engagements_participantId_key" ON "participant_engagements"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "participant_engagement_logs_participantId_idx" ON "participant_engagement_logs"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "teams_inviteCode_key" ON "teams"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "teams_waitlistId_name_key" ON "teams"("waitlistId", "name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "team_invitations_teamId_participantId_key" ON "team_invitations"("teamId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "team_reward_milestones_waitlistId_milestone_key" ON "team_reward_milestones"("waitlistId", "milestone");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "team_milestone_rewards_teamId_teamRewardMilestoneId_key" ON "team_milestone_rewards"("teamId", "teamRewardMilestoneId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "team_participant_rewards_teamMilestoneRewardId_participantI_key" ON "team_participant_rewards"("teamMilestoneRewardId", "participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attribution_visits_waitlistId_source_idx" ON "attribution_visits"("waitlistId", "source");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attribution_visits_waitlistId_timestamp_idx" ON "attribution_visits"("waitlistId", "timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attribution_visits_waitlistId_sessionId_idx" ON "attribution_visits"("waitlistId", "sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "funnel_events_waitlistId_idx" ON "funnel_events"("waitlistId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "funnel_events_waitlistId_eventType_idx" ON "funnel_events"("waitlistId", "eventType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "funnel_events_waitlistId_createdAt_idx" ON "funnel_events"("waitlistId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "funnel_events_waitlistId_sessionId_eventType_idx" ON "funnel_events"("waitlistId", "sessionId", "eventType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_funnel_stats_waitlistId_date_idx" ON "daily_funnel_stats"("waitlistId", "date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "daily_funnel_stats_waitlistId_date_eventType_key" ON "daily_funnel_stats"("waitlistId", "date", "eventType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "growth_timeseries_waitlistId_periodStart_idx" ON "growth_timeseries"("waitlistId", "periodStart");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "growth_timeseries_waitlistId_periodType_periodStart_idx" ON "growth_timeseries"("waitlistId", "periodType", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "growth_timeseries_waitlistId_periodStart_periodType_key" ON "growth_timeseries"("waitlistId", "periodStart", "periodType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "referral_spikes_waitlistId_startAt_idx" ON "referral_spikes"("waitlistId", "startAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "referral_spikes_waitlistId_referrerParticipantId_idx" ON "referral_spikes"("waitlistId", "referrerParticipantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "referral_spikes_waitlistId_endAt_idx" ON "referral_spikes"("waitlistId", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payment_accounts_founderId_provider_key" ON "payment_accounts"("founderId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "monetization_payments_providerPaymentId_key" ON "monetization_payments"("providerPaymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "monetization_payments_founderId_idx" ON "monetization_payments"("founderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "monetization_payments_waitlistId_idx" ON "monetization_payments"("waitlistId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "monetization_payments_participantId_idx" ON "monetization_payments"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "monetization_payments_status_idx" ON "monetization_payments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "monetization_payment_events_paymentId_idx" ON "monetization_payment_events"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "monetization_payment_events_provider_providerEventId_key" ON "monetization_payment_events"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pre_order_deposits_waitlistId_idx" ON "pre_order_deposits"("waitlistId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pre_order_deposits_participantId_idx" ON "pre_order_deposits"("participantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pre_order_deposits_status_idx" ON "pre_order_deposits"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "affiliates_founderId_key" ON "affiliates"("founderId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "affiliates_code_key" ON "affiliates"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliates_code_idx" ON "affiliates"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_clicks_affiliateId_idx" ON "affiliate_clicks"("affiliateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_clicks_createdAt_idx" ON "affiliate_clicks"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_attributions_referredFounderId_key" ON "affiliate_attributions"("referredFounderId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_attributions_affiliateClickId_key" ON "affiliate_attributions"("affiliateClickId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_attributions_affiliateId_idx" ON "affiliate_attributions"("affiliateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_attributions_status_idx" ON "affiliate_attributions"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_conversions_sourcePaymentId_key" ON "affiliate_conversions"("sourcePaymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_conversions_affiliateId_idx" ON "affiliate_conversions"("affiliateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_conversions_referredFounderId_idx" ON "affiliate_conversions"("referredFounderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_conversions_status_idx" ON "affiliate_conversions"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_commissions_affiliateId_status_idx" ON "affiliate_commissions"("affiliateId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_commissions_referredFounderId_idx" ON "affiliate_commissions"("referredFounderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_commissions_sourcePaymentId_idx" ON "affiliate_commissions"("sourcePaymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_commissions_status_eligibleAt_idx" ON "affiliate_commissions"("status", "eligibleAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_payouts_idempotencyKey_key" ON "affiliate_payouts"("idempotencyKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_payouts_affiliateId_status_idx" ON "affiliate_payouts"("affiliateId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "affiliate_payouts_idempotencyKey_idx" ON "affiliate_payouts"("idempotencyKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "participants_waitlistId_createdAt_idx" ON "participants"("waitlistId", "createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "waitlist_signup_configs" ADD CONSTRAINT "waitlist_signup_configs_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "participants" ADD CONSTRAINT "participants_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "streak_milestones" ADD CONSTRAINT "streak_milestones_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "participant_streak_rewards" ADD CONSTRAINT "participant_streak_rewards_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "participant_streak_rewards" ADD CONSTRAINT "participant_streak_rewards_streakMilestoneId_fkey" FOREIGN KEY ("streakMilestoneId") REFERENCES "streak_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "waitlist_copies" ADD CONSTRAINT "waitlist_copies_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "waitlist_copy_versions" ADD CONSTRAINT "waitlist_copy_versions_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "waitlist_copies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "participant_referral_messages" ADD CONSTRAINT "participant_referral_messages_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "participant_engagements" ADD CONSTRAINT "participant_engagements_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "participant_engagement_logs" ADD CONSTRAINT "participant_engagement_logs_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "teams" ADD CONSTRAINT "teams_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "teams" ADD CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "team_reward_milestones" ADD CONSTRAINT "team_reward_milestones_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "team_milestone_rewards" ADD CONSTRAINT "team_milestone_rewards_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "team_milestone_rewards" ADD CONSTRAINT "team_milestone_rewards_teamRewardMilestoneId_fkey" FOREIGN KEY ("teamRewardMilestoneId") REFERENCES "team_reward_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "team_participant_rewards" ADD CONSTRAINT "team_participant_rewards_teamMilestoneRewardId_fkey" FOREIGN KEY ("teamMilestoneRewardId") REFERENCES "team_milestone_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "team_participant_rewards" ADD CONSTRAINT "team_participant_rewards_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "attribution_visits" ADD CONSTRAINT "attribution_visits_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "funnel_events" ADD CONSTRAINT "funnel_events_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "growth_timeseries" ADD CONSTRAINT "growth_timeseries_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "referral_spikes" ADD CONSTRAINT "referral_spikes_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "referral_spikes" ADD CONSTRAINT "referral_spikes_referrerParticipantId_fkey" FOREIGN KEY ("referrerParticipantId") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "monetization_payments" ADD CONSTRAINT "monetization_payments_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "monetization_payments" ADD CONSTRAINT "monetization_payments_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "monetization_payments" ADD CONSTRAINT "monetization_payments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "monetization_payment_events" ADD CONSTRAINT "monetization_payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "monetization_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "pre_order_deposits" ADD CONSTRAINT "pre_order_deposits_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "pre_order_deposits" ADD CONSTRAINT "pre_order_deposits_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "pre_order_deposits" ADD CONSTRAINT "pre_order_deposits_monetizationPaymentId_fkey" FOREIGN KEY ("monetizationPaymentId") REFERENCES "monetization_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_attributions" ADD CONSTRAINT "affiliate_attributions_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_attributions" ADD CONSTRAINT "affiliate_attributions_referredFounderId_fkey" FOREIGN KEY ("referredFounderId") REFERENCES "founders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_attributions" ADD CONSTRAINT "affiliate_attributions_affiliateClickId_fkey" FOREIGN KEY ("affiliateClickId") REFERENCES "affiliate_clicks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_referredFounderId_fkey" FOREIGN KEY ("referredFounderId") REFERENCES "founders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_conversions" ADD CONSTRAINT "affiliate_conversions_attributionId_fkey" FOREIGN KEY ("attributionId") REFERENCES "affiliate_attributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_referredFounderId_fkey" FOREIGN KEY ("referredFounderId") REFERENCES "founders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "affiliate_conversions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "affiliate_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_payoutAccountId_fkey" FOREIGN KEY ("payoutAccountId") REFERENCES "payment_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

