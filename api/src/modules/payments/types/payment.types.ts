export {
  SubscriptionPlanCode,
  SubscriptionStatus,
  BillingCycle,
  PaymentProvider,
  PaymentStatus,
  PaymentEventType,
} from '@prisma/client';

export const PAID_PLANS = ['STARTER', 'PRO'] as const;
export type PaidPlanCode = (typeof PAID_PLANS)[number];

export interface PlanFeatureFlags {
  referralSystem: boolean;
  emailAutomation: boolean;
  customBranding: boolean;
  embedWidget: boolean;
  dynamicOgImages: boolean;
  advancedAnalytics: boolean;
  teamMembers: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface PlanLimits {
  maxWaitlists: number | null;
  maxParticipants: number | null;
}

export interface PublicPlanDto {
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingCycle: string;
  features: PlanFeatureFlags;
  limits: PlanLimits;
}

export interface SubscriptionSummaryDto {
  planCode: string;
  planName: string;
  status: string;
  billingCycle: string;
  amount: number;
  currency: string;
  startedAt: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  features: PlanFeatureFlags;
  limits: PlanLimits;
}

export interface PaymentHistoryItemDto {
  id: string;
  planCode: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  providerReference: string;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface InitializePaymentResult {
  checkoutUrl: string;
  providerReference: string;
  paymentId: string;
}
