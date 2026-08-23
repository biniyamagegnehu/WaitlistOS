import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentProvider } from '@prisma/client';
import {
  IAffiliatePayoutProvider,
  AffiliatePayoutProviderContext,
  InitiatePayoutResult,
} from './affiliate-payout-provider.interface';

/**
 * Stripe affiliate payout provider.
 *
 * Uses Stripe Connect Transfers to send funds from the WaitlistOS platform
 * Stripe account to the affiliate's connected Stripe account.
 *
 * The affiliate must have a connected Stripe account (Express or Standard)
 * with payouts enabled. This is set up via the Connect onboarding flow.
 */
@Injectable()
export class StripeAffiliatePayoutProvider implements IAffiliatePayoutProvider {
  readonly provider = PaymentProvider.STRIPE;
  private readonly logger = new Logger(StripeAffiliatePayoutProvider.name);
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2026-07-29.dahlia' as any,
        typescript: true,
      });
    } else {
      this.stripe = {} as Stripe;
    }
  }

  private assertConfigured() {
    if (!this.stripe.transfers) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
    }
  }

  async initiatePayout(
    amount: string,
    currency: string,
    idempotencyKey: string,
    context: AffiliatePayoutProviderContext,
  ): Promise<InitiatePayoutResult> {
    this.assertConfigured();

    try {
      // Amount in cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(parseFloat(amount) * 100);

      // Create a Transfer to the connected account
      const transfer = await this.stripe.transfers.create(
        {
          amount: amountInCents,
          currency: currency.toLowerCase(),
          destination: context.providerAccountId,
          metadata: {
            idempotencyKey,
            source: 'waitlistos_affiliate_payout',
          },
        },
        {
          idempotencyKey,
        },
      );

      this.logger.log(`Stripe transfer created: ${transfer.id} for ${amount} ${currency}`);

      return {
        providerTransactionId: transfer.id,
        status: 'PAID',
      };
    } catch (err: any) {
      this.logger.error(`Stripe transfer failed: ${err.message}`);
      return {
        providerTransactionId: '',
        status: 'FAILED',
        failureReason: err.message,
      };
    }
  }

  async getPayoutStatus(
    providerTransactionId: string,
    _context: AffiliatePayoutProviderContext,
  ): Promise<InitiatePayoutResult> {
    this.assertConfigured();

    try {
      const transfer = await this.stripe.transfers.retrieve(providerTransactionId);
      return {
        providerTransactionId: transfer.id,
        status: 'PAID',
      };
    } catch (err: any) {
      return {
        providerTransactionId,
        status: 'FAILED',
        failureReason: err.message,
      };
    }
  }

  /**
   * Create a Stripe Connect onboarding link for the affiliate.
   * The affiliate completes onboarding to connect their Stripe account.
   */
  async createOnboardingLink(returnUrl: string, refreshUrl: string): Promise<string> {
    this.assertConfigured();

    // Create an Express account for the affiliate
    const account = await this.stripe.accounts.create({
      type: 'express',
      capabilities: {
        transfers: { requested: true },
      },
    });

    const link = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return JSON.stringify({ accountId: account.id, url: link.url });
  }

  /**
   * Verify that the connected account has payouts enabled.
   */
  async verifyPayoutCapability(providerAccountId: string): Promise<boolean> {
    this.assertConfigured();
    try {
      const account = await this.stripe.accounts.retrieve(providerAccountId);
      return account.payouts_enabled === true;
    } catch {
      return false;
    }
  }
}
