"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getPaymentHistory,
  getPublicPlans,
  getSubscription,
  initializePayment,
  verifyPayment,
} from "@/services/billing";
import type { SubscriptionPlanCode } from "@/types/billing";

export function usePublicPlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: getPublicPlans,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: getSubscription,
  });
}

export function usePaymentHistory() {
  return useQuery({
    queryKey: ["billing", "history"],
    queryFn: getPaymentHistory,
  });
}

export function useInitializePayment() {
  return useMutation({
    mutationFn: (plan: SubscriptionPlanCode) => initializePayment(plan),
    onSuccess: (data) => {
      const checkoutUrl = data?.checkoutUrl?.trim();
      if (!checkoutUrl) {
        throw new Error("Missing checkout URL from payment provider");
      }
      window.location.assign(checkoutUrl);
    },
  });
}

export function useVerifyPayment(txRef: string | null) {
  return useQuery({
    queryKey: ["billing", "verify", txRef],
    queryFn: () => verifyPayment(txRef!),
    enabled: Boolean(txRef),
    retry: 2,
  });
}
