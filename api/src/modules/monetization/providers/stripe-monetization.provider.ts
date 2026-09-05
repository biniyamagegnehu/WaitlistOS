import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonetizationPayment, PaymentAccount } from '@prisma/client';
import Stripe from 'stripe';
import { IMonetizationProvider, InitializePaymentResult, WebhookEventResult, VerifyPaymentResult } from './monetization-provider.interface';

export interface StripeAccountStatus {
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsDue: string[];
}

@Injectable()
export class StripeMonetizationProvider implements IMonetizationProvider {
  private readonly logger = new Logger(StripeMonetizationProvider.name);
  private readonly stripe: Stripe | null;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    this.webhookSecret = this.configService.get<string>('stripe.webhookSecret') ?? '';

    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16' as any,
        typescript: true,
      });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be unavailable.');
      this.stripe = null;
    }
  }

  private assertStripeInitialized(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.');
    }
    return this.stripe;
  }

  // ── Connect Onboarding (Account Links) ───────────────────────────────────

  /**
   * Finds an existing connected account or creates a new Express account.
   * Using Express accounts is the recommended type for platforms.
   */
  async createOrRetrieveConnectedAccount(existingAccountId?: string | null): Promise<string> {
    const stripe = this.assertStripeInitialized();

    if (existingAccountId) {
      try {
        // Verify the account still exists and is accessible
        const account = await stripe.accounts.retrieve(existingAccountId);
        this.logger.log(`Reusing existing Stripe connected account: ${account.id}`);
        return account.id;
      } catch (err) {
        this.logger.warn(`Existing account ${existingAccountId} not found, creating a new one. Error: ${String(err)}`);
      }
    }

    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    this.logger.log(`Created new Stripe Express connected account: ${account.id}`);
    return account.id;
  }

  /**
   * Creates a Stripe Account Link for hosted onboarding.
   * Account Links are single-use and short-lived.
   */
  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<string> {
    const stripe = this.assertStripeInitialized();

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });

    this.logger.log(`Created Account Link for ${accountId}, expires: ${new Date(accountLink.expires_at * 1000).toISOString()}`);
    return accountLink.url;
  }

  /**
   * Retrieves the current onboarding status of a connected account.
   */
  async retrieveAccountStatus(accountId: string): Promise<StripeAccountStatus> {
    const stripe = this.assertStripeInitialized();

    const account = await stripe.accounts.retrieve(accountId);
    const requirementsDue = [
      ...(account.requirements?.currently_due ?? []),
      ...(account.requirements?.past_due ?? []),
    ];

    return {
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirementsDue,
    };
  }

  // ── Payment Checkout ──────────────────────────────────────────────────────

  async initializePayment(
    payment: MonetizationPayment,
    account: PaymentAccount,
    returnUrl: string,
    cancelUrl: string,
    customerEmail: string,
    metadata?: Record<string, string>,
  ): Promise<InitializePaymentResult> {
    const stripe = this.assertStripeInitialized();

    try {
      const session = await stripe.checkout.sessions.create(
        {
          payment_method_types: ['card'],
          customer_email: customerEmail,
          line_items: [
            {
              price_data: {
                currency: payment.currency.toLowerCase(),
                product_data: {
                  name: `Getlist: ${payment.paymentType}`,
                },
                unit_amount: Math.round(Number(payment.amount) * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          payment_intent_data: {
            application_fee_amount: Math.round(Number(payment.platformFee) * 100),
          },
          success_url: returnUrl,
          cancel_url: cancelUrl,
          client_reference_id: payment.id,
          metadata: {
            ...metadata,
            paymentId: payment.id,
          },
        },
        {
          stripeAccount: account.providerAccountId!,
        },
      );

      return {
        checkoutUrl: session.url!,
        providerPaymentId: session.id,
      };
    } catch (error) {
      this.logger.error(`Stripe checkout failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to initialize Stripe payment');
    }
  }

  // ── Webhooks ──────────────────────────────────────────────────────────────

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    if (!this.webhookSecret || !signature) {
      this.logger.warn('Stripe webhook secret or signature is missing — rejecting webhook');
      return false;
    }
    try {
      this.assertStripeInitialized().webhooks.constructEvent(rawBody, signature, this.webhookSecret);
      return true;
    } catch {
      return false;
    }
  }

  async parseWebhookEvent(rawBody: string, signature: string | undefined): Promise<WebhookEventResult> {
    const stripe = this.assertStripeInitialized();
    const event = stripe.webhooks.constructEvent(rawBody, signature!, this.webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract the actual charged amount and currency from Stripe
      // Stripe returns amounts in cents, so we need to convert to dollars
      const chargedAmount = session.amount_total ? session.amount_total / 100 : undefined;
      const chargedCurrency = session.currency ? session.currency.toUpperCase() : undefined;
      
      return {
        providerPaymentId: session.id,
        status: 'SUCCESS',
        providerEventId: event.id,
        eventType: event.type,
        payload: event,
        chargedAmount,
        chargedCurrency,
      };
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        providerPaymentId: session.id,
        status: 'FAILED',
        providerEventId: event.id,
        eventType: event.type,
        payload: event,
      };
    }

    return {
      providerPaymentId: (event.data.object as any).id ?? '',
      status: 'PENDING',
      providerEventId: event.id,
      eventType: event.type,
      payload: event,
    };
  }

  async verifyPayment(
    paymentId: string,
    account: PaymentAccount,
  ): Promise<VerifyPaymentResult> {
    const stripe = this.assertStripeInitialized();

    try {
      // For Stripe, paymentId is the session ID
      const session = await stripe.checkout.sessions.retrieve(paymentId);

      if (session.payment_status === 'paid') {
        return {
          status: 'SUCCEEDED',
          providerPaymentId: paymentId,
        };
      } else if (session.status === 'expired') {
        return {
          status: 'FAILED',
          providerPaymentId: paymentId,
        };
      }

      return {
        status: 'PENDING',
        providerPaymentId: paymentId,
      };
    } catch (error) {
      this.logger.error(`Stripe payment verification failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        status: 'PENDING',
        providerPaymentId: paymentId,
      };
    }
  }
}
