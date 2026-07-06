import { api } from "@/lib/axios";
import type {
  InitializePaymentResponse,
  PaymentHistoryItem,
  PublicPlan,
  SubscriptionPlanCode,
  SubscriptionSummary,
} from "@/types/billing";

export async function getPublicPlans(): Promise<PublicPlan[]> {
  const response = await api.get<{ success: boolean; data: PublicPlan[] }>(
    "/payments/plans"
  );
  return response.data.data;
}

export async function getSubscription(): Promise<SubscriptionSummary> {
  const response = await api.get<{ success: boolean; data: SubscriptionSummary }>(
    "/payments/subscription"
  );
  return response.data.data;
}

export async function getPaymentHistory(): Promise<PaymentHistoryItem[]> {
  const response = await api.get<{ success: boolean; data: PaymentHistoryItem[] }>(
    "/payments/history"
  );
  return response.data.data;
}

export async function initializePayment(
  plan: SubscriptionPlanCode
): Promise<InitializePaymentResponse> {
  const response = await api.post<{ success: boolean; data: InitializePaymentResponse }>(
    "/payments/initialize",
    { plan }
  );
  return response.data.data;
}

export async function verifyPayment(txRef: string) {
  const response = await api.get<{
    success: boolean;
    status: string;
    planCode: SubscriptionPlanCode;
  }>("/payments/verify", { params: { txRef } });
  return response.data;
}
