import { api } from "@/lib/axios";

export interface PaymentAccount {
  id: string;
  provider: "STRIPE" | "CHAPA";
  status: "NOT_CONNECTED" | "PENDING" | "ACTION_REQUIRED" | "ACTIVE" | "RESTRICTED" | "DISCONNECTED" | "ERROR";
  connectedAt?: string;
  lastError?: string;
  createdAt: string;
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
};
