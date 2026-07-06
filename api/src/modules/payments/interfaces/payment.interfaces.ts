import {
  BillingCycle,
  PaymentEventType,
  PaymentStatus,
  Prisma,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '@prisma/client';

export interface ChapaInitializePayload {
  amount: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
  };
}

export interface ChapaInitializeResponse {
  status: string;
  message: string;
  data?: {
    checkout_url: string;
  };
}

export interface ChapaVerifyResponse {
  status: string;
  message: string;
  data?: {
    status: string;
    amount: number;
    currency: string;
    tx_ref: string;
    reference?: string;
  };
}

export interface ChapaWebhookPayload {
  event?: string;
  tx_ref?: string;
  status?: string;
  reference?: string;
  amount?: string | number;
  currency?: string;
  [key: string]: unknown;
}

export interface CreatePaymentRecordInput {
  userId: string;
  subscriptionId?: string;
  planCode: SubscriptionPlanCode;
  amount: number;
  currency: string;
  providerReference: string;
  checkoutUrl?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface ActivateSubscriptionInput {
  userId: string;
  planCode: SubscriptionPlanCode;
  amount: number;
  currency: string;
  providerReference: string;
  transactionId?: string;
  billingCycle?: BillingCycle;
  expiresAt?: Date;
}

export interface SubscriptionHistoryInput {
  subscriptionId: string;
  userId: string;
  fromPlan?: SubscriptionPlanCode | null;
  toPlan: SubscriptionPlanCode;
  fromStatus?: SubscriptionStatus | null;
  toStatus: SubscriptionStatus;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface RecordPaymentEventInput {
  paymentId: string;
  eventType: PaymentEventType;
  payload: Prisma.InputJsonValue;
  idempotencyKey: string;
  processed?: boolean;
}

export interface UpdatePaymentStatusInput {
  providerReference: string;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
}
