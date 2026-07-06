export type SubscriptionPlanCode = "FREE" | "STARTER" | "PRO";



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



export interface PublicPlan {

  code: SubscriptionPlanCode;

  name: string;

  description: string | null;

  price: number;

  currency: string;

  billingCycle: string;

  features: PlanFeatureFlags;

  limits: PlanLimits;

}



export interface SubscriptionSummary {

  planCode: SubscriptionPlanCode;

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



export interface PaymentHistoryItem {

  id: string;

  planCode: SubscriptionPlanCode;

  amount: number;

  currency: string;

  paymentStatus: string;

  providerReference: string;

  transactionId: string | null;

  paidAt: string | null;

  createdAt: string;

}



export interface InitializePaymentResponse {

  checkoutUrl: string;

  providerReference: string;

  paymentId: string;

}


