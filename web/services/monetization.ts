import { api } from "@/lib/axios";

export interface PaymentAccount {
  id: string;
  provider: "STRIPE" | "CHAPA";
  status: "NOT_CONNECTED" | "PENDING" | "ACTION_REQUIRED" | "ACTIVE" | "RESTRICTED" | "DISCONNECTED" | "ERROR";
  connectedAt?: string;
  lastError?: string;
  createdAt: string;
}

export interface SkipLineStatus {
  eligible: boolean;
  hasPriority: boolean;
  waitlist: {
    skipLineEnabled: boolean;
    skipLinePrice: number | null;
    skipLineCurrency: string | null;
  };
  capacity: {
    total: number;
    priorityCapacity: number;
    currentPaid: number;
    availableSlots: number;
  };
  position: number;
}

export const monetizationService = {
  getAccounts: async (): Promise<PaymentAccount[]> => {
    const { data } = await api.get("/monetization/accounts");
    return data;
  },

  connectStripe: async (): Promise<{ url: string }> => {
    const { data } = await api.post("/monetization/accounts/stripe/connect");
    return data;
  },

  connectChapa: async (bankCode: string, accountNumber: string, businessName: string): Promise<PaymentAccount> => {
    const { data } = await api.post("/monetization/accounts/chapa/connect", {
      bankCode,
      accountNumber,
      businessName,
    });
    return data;
  },

  disconnectAccount: async (provider: "STRIPE" | "CHAPA"): Promise<void> => {
    await api.delete(`/monetization/accounts/${provider}`);
  },

  // Skip the Line
  createSkipLineCheckout: async (waitlistId: string, participantId: string, provider: "STRIPE" | "CHAPA" = "STRIPE"): Promise<{ checkoutUrl: string }> => {
    const { data } = await api.post("/monetization/skip-line/checkout", {
      waitlistId,
      participantId,
      provider,
      paymentType: "SKIP_LINE",
    });
    return data;
  },

  getSkipLineStatus: async (participantId: string, waitlistId: string): Promise<{ success: boolean; data: SkipLineStatus }> => {
    const { data } = await api.get(`/participants/${participantId}/skip-line-status?waitlistId=${waitlistId}`);
    return data;
  },

  getSkipLinePaymentStatus: async (paymentId: string): Promise<any> => {
    const { data } = await api.get(`/monetization/skip-line/status/${paymentId}`);
    return data;
  },

  getLatestSkipLineStatus: async (participantId: string, waitlistId: string): Promise<any> => {
    const { data } = await api.get(`/monetization/skip-line/status/public/latest?participantId=${participantId}&waitlistId=${waitlistId}`);
    return data;
  },
};
