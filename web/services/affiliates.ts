import { api } from '@/lib/axios';

export interface Affiliate {
  id: string;
  code: string;
  status: string;
  commissionRate: number;
  commissionDurationMonths: number;
  clickCount: number;
  preferredPayoutProvider: string | null;
}

export interface PaymentAccountSummary {
  id: string;
  provider: 'STRIPE' | 'CHAPA';
  status: string;
  providerAccountId: string | null;
  isEligible: boolean;
}

export interface AffiliateCommission {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface AffiliatePayout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  processedAt?: string;
}

export interface AffiliateConversion {
  id: string;
  sourcePaymentId: string;
  status: string;
  convertedAt: string;
}

export interface AffiliateDashboardStats {
  totalEarned: number;
  pendingBalance: number;
  eligibleBalance: number;
  paidOut: number;
  referredCount: number;
  convertedCount: number;
  conversionRate: string;
}

export interface AffiliateDashboardResponse {
  affiliate: Affiliate;
  stats: AffiliateDashboardStats;
  paymentAccounts: PaymentAccountSummary[];
  recentCommissions: AffiliateCommission[];
  recentPayouts: AffiliatePayout[];
  conversions: AffiliateConversion[];
}

export const affiliateService = {
  getMe: async (): Promise<Affiliate> => {
    const { data } = await api.get('/affiliates/me');
    return data;
  },

  getDashboard: async (): Promise<AffiliateDashboardResponse> => {
    const { data } = await api.get('/affiliates/dashboard');
    return data;
  },

  setPayoutPreference: async (provider: 'STRIPE' | 'CHAPA'): Promise<{ success: boolean; preferredPayoutProvider: string }> => {
    const { data } = await api.patch('/affiliates/payout-preference', { provider });
    return data;
  },

  trackClick: async (ref: string): Promise<{ tracked: boolean; ref?: string; reason?: string }> => {
    const { data } = await api.get('/affiliates/track', { params: { ref } });
    return data;
  }
};
