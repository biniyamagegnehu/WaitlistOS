import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { IPaymentProvider, InitializeTransactionPayload, VerifyTransactionResponse } from '../payment-provider.interface';

@Injectable()
export class StripeService implements IPaymentProvider {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    this.webhookSecret = this.configService.get<string>('stripe.webhookSecret') ?? '';

    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2026-07-29.dahlia' as any, // Cast if the exact string literal in DT mismatches but we need to satisfy it
        typescript: true,
      });
    } else {
      // It's okay if not configured immediately, we'll throw when used
      this.stripe = {} as Stripe;
    }
  }

  async initializeTransaction(payload: InitializeTransactionPayload): Promise<{ checkoutUrl: string; providerReference: string }> {
    this.assertConfigured();

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: payload.email,
        line_items: [
          {
            price_data: {
              currency: payload.currency.toLowerCase(),
              product_data: {
                name: payload.planName,
                description: `Subscription to ${payload.planName}`,
              },
              unit_amount: Math.round(payload.amount * 100), // Stripe expects amounts in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: payload.returnUrl,
        cancel_url: payload.callbackUrl,
        client_reference_id: payload.txRef,
        metadata: {
          txRef: payload.txRef,
          planName: payload.planName,
        },
      });

      if (!session.url) {
        throw new Error('No checkout URL returned from Stripe');
      }

      return {
        checkoutUrl: session.url,
        providerReference: session.id, // Using Stripe Session ID as the provider reference
      };
    } catch (error) {
      this.logger.error(`Stripe initialize failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('PAYMENT_INITIALIZATION_FAILED');
    }
  }

  async verifyTransaction(providerReference: string): Promise<VerifyTransactionResponse> {
    this.assertConfigured();

    try {
      const session = await this.stripe.checkout.sessions.retrieve(providerReference);
      
      if (session.payment_status === 'paid') {
        return {
          success: true,
          providerReference: session.id,
        };
      }

      return {
        success: false,
        providerReference: session.id,
      };
    } catch (error) {
      this.logger.error(`Stripe verify network error: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException('PAYMENT_PROVIDER_UNAVAILABLE');
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET is not configured');
      return false;
    }

    if (!signature) {
      return false;
    }

    try {
      this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
      return true;
    } catch (err) {
      this.logger.error(`Stripe webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  constructEvent(rawBody: string, signature: string) {
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }

  private assertConfigured() {
    if (!this.configService.get<string>('stripe.secretKey')) {
      throw new InternalServerErrorException('STRIPE_NOT_CONFIGURED');
    }
  }
}
