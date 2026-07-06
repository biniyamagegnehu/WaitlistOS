import {
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '@prisma/client';
import type { PlanFeatureFlags, PlanLimits } from '../types/payment.types';

const FREE_FEATURES: PlanFeatureFlags = {
  referralSystem: false,
  emailAutomation: false,
  customBranding: false,
  embedWidget: false,
  dynamicOgImages: false,
  advancedAnalytics: false,
  teamMembers: false,
  apiAccess: false,
  prioritySupport: false,
};

const STARTER_FEATURES: PlanFeatureFlags = {
  referralSystem: true,
  emailAutomation: true,
  customBranding: false,
  embedWidget: true,
  dynamicOgImages: true,
  advancedAnalytics: false,
  teamMembers: false,
  apiAccess: false,
  prioritySupport: false,
};

const PRO_FEATURES: PlanFeatureFlags = {
  ...STARTER_FEATURES,
  customBranding: true,
  advancedAnalytics: true,
  teamMembers: true,
  apiAccess: true,
  prioritySupport: true,
};

export function getPlanFeatures(planCode: SubscriptionPlanCode): PlanFeatureFlags {
  switch (planCode) {
    case SubscriptionPlanCode.STARTER:
      return STARTER_FEATURES;
    case SubscriptionPlanCode.PRO:
      return PRO_FEATURES;
    case SubscriptionPlanCode.FREE:
    default:
      return FREE_FEATURES;
  }
}

export function isPaidPlan(planCode: SubscriptionPlanCode): boolean {
  return (
    planCode === SubscriptionPlanCode.STARTER ||
    planCode === SubscriptionPlanCode.PRO
  );
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.ACTIVE;
}

export function hasMinimumPlan(
  currentPlan: SubscriptionPlanCode,
  requiredPlans: SubscriptionPlanCode[],
): boolean {
  if (requiredPlans.length === 0) {
    return true;
  }

  const rank: Record<SubscriptionPlanCode, number> = {
    [SubscriptionPlanCode.FREE]: 0,
    [SubscriptionPlanCode.STARTER]: 1,
    [SubscriptionPlanCode.PRO]: 2,
  };

  const currentRank = rank[currentPlan];
  const minRequired = Math.min(...requiredPlans.map((plan) => rank[plan]));
  return currentRank >= minRequired;
}

export function buildPlanLimits(
  planCode: SubscriptionPlanCode,
  maxWaitlists: number | null,
  maxParticipants: number | null,
): PlanLimits {
  if (planCode === SubscriptionPlanCode.PRO) {
    return {
      maxWaitlists: null,
      maxParticipants: null,
    };
  }

  return {
    maxWaitlists,
    maxParticipants,
  };
}
