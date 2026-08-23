import { PaymentProvider } from '@prisma/client';

export interface InitiatePayoutResult {
  providerTransactionId: string;
  status: 'PAID' | 'PROCESSING' | 'FAILED';
  failureReason?: string;
}

export interface AffiliatePayoutProviderContext {
  providerAccountId: string;
  currency: string;
  metadata?: Record<string, unknown>;
}

/**
 * Provider-agnostic interface for affiliate payout providers.
 * Every concrete provider (Stripe, Chapa) must implement this.
 */
export interface IAffiliatePayoutProvider {
  readonly provider: PaymentProvider;

  /**
   * Transfer `amount` in `currency` to the affiliate's payout account.
   * @param amount Amount in smallest precision (e.g. "84.00")
   * @param currency ISO 4217 currency code
   * @param idempotencyKey Deterministic key to prevent duplicate transfers
   * @param context Provider-specific account context
   */
  initiatePayout(
    amount: string,
    currency: string,
    idempotencyKey: string,
    context: AffiliatePayoutProviderContext,
  ): Promise<InitiatePayoutResult>;

  /**
   * Check the current status of a previously initiated payout.
   */
  getPayoutStatus(providerTransactionId: string, context: AffiliatePayoutProviderContext): Promise<InitiatePayoutResult>;
}
