import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MonetizationPaymentStatus, PaymentAccountStatus, PaymentProvider } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FeeService } from './fee.service';
import { StripeMonetizationProvider } from './providers/stripe-monetization.provider';
import { ChapaMonetizationProvider } from './providers/chapa-monetization.provider';
import { IMonetizationProvider } from './providers/monetization-provider.interface';
import { CreateCheckoutDto } from './dto/monetization.dtos';

@Injectable()
export class MonetizationService {
  private readonly logger = new Logger(MonetizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feeService: FeeService,
    private readonly stripeProvider: StripeMonetizationProvider,
    private readonly chapaProvider: ChapaMonetizationProvider,
  ) {}

  getProvider(provider: PaymentProvider): IMonetizationProvider {
    return provider === PaymentProvider.STRIPE ? this.stripeProvider : this.chapaProvider;
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Looks up the Founder record by userId.
   * The JWT strategy only provides userId; founderId must be resolved from the DB.
   */
  private async getFounderByUserId(userId: string) {
    const founder = await this.prisma.founder.findUnique({
      where: { userId },
    });

    if (!founder) {
      throw new NotFoundException('Founder profile not found. Please complete onboarding.');
    }

    return founder;
  }

  // ── Payment Account APIs ──────────────────────────────────────────────────

  async getPaymentAccounts(userId: string) {
    const founder = await this.getFounderByUserId(userId);
    return this.prisma.paymentAccount.findMany({
      where: { founderId: founder.id },
      select: {
        id: true,
        provider: true,
        status: true,
        connectedAt: true,
        createdAt: true,
        updatedAt: true,
        lastError: true,
      },
    });
  }

  // ── Stripe ────────────────────────────────────────────────────────────────

  /**
   * Initiates Stripe Connect onboarding.
   * Creates or reuses a connected account, then returns an Account Link URL.
   * The frontend must redirect the user to this URL immediately.
   */
  async connectStripe(userId: string, frontendUrl: string): Promise<{ url: string }> {
    const founder = await this.getFounderByUserId(userId);

    // Find or create the PaymentAccount record
    let account = await this.prisma.paymentAccount.findUnique({
      where: { founderId_provider: { founderId: founder.id, provider: PaymentProvider.STRIPE } },
    });

    try {
      // Create or reuse the Stripe connected account
      const stripeAccountId = await this.stripeProvider.createOrRetrieveConnectedAccount(
        account?.providerAccountId,
      );

      // Upsert the PaymentAccount record with PENDING status
      account = await this.prisma.paymentAccount.upsert({
        where: { founderId_provider: { founderId: founder.id, provider: PaymentProvider.STRIPE } },
        update: {
          providerAccountId: stripeAccountId,
          status: PaymentAccountStatus.PENDING,
          lastError: null,
        },
        create: {
          founderId: founder.id,
          provider: PaymentProvider.STRIPE,
          providerAccountId: stripeAccountId,
          status: PaymentAccountStatus.PENDING,
        },
      });

      // Generate the hosted onboarding URL
      const returnUrl = `${frontendUrl}/dashboard/settings/payments/stripe/return`;
      const refreshUrl = `${frontendUrl}/dashboard/settings/payments/stripe/refresh`;
      const onboardingUrl = await this.stripeProvider.createAccountLink(
        stripeAccountId,
        returnUrl,
        refreshUrl,
      );

      return { url: onboardingUrl };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stripe connect failed for founder ${founder.id}: ${errorMessage}`);

      // Record the error in the DB for visibility
      if (account) {
        await this.prisma.paymentAccount.update({
          where: { id: account.id },
          data: { status: PaymentAccountStatus.ERROR, lastError: errorMessage },
        });
      }

      throw error;
    }
  }

  /**
   * Called when the founder returns from Stripe onboarding.
   * Queries Stripe for the actual account status and updates the DB.
   * Returns the updated account status.
   */
  async handleStripeReturn(userId: string): Promise<{ status: PaymentAccountStatus }> {
    const founder = await this.getFounderByUserId(userId);

    const account = await this.prisma.paymentAccount.findUnique({
      where: { founderId_provider: { founderId: founder.id, provider: PaymentProvider.STRIPE } },
    });

    if (!account || !account.providerAccountId) {
      throw new NotFoundException('No Stripe account found. Please start the connection process again.');
    }

    try {
      const stripeStatus = await this.stripeProvider.retrieveAccountStatus(account.providerAccountId);
      this.logger.log(`Stripe account ${account.providerAccountId} status: ${JSON.stringify(stripeStatus)}`);

      let newStatus: PaymentAccountStatus;
      if (stripeStatus.chargesEnabled && stripeStatus.detailsSubmitted) {
        newStatus = PaymentAccountStatus.ACTIVE;
      } else if (stripeStatus.requirementsDue.length > 0) {
        newStatus = PaymentAccountStatus.ACTION_REQUIRED;
      } else {
        newStatus = PaymentAccountStatus.PENDING;
      }

      await this.prisma.paymentAccount.update({
        where: { id: account.id },
        data: {
          status: newStatus,
          connectedAt: newStatus === PaymentAccountStatus.ACTIVE ? new Date() : account.connectedAt,
          lastError: null,
        },
      });

      return { status: newStatus };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stripe status check failed for account ${account.providerAccountId}: ${errorMessage}`);

      await this.prisma.paymentAccount.update({
        where: { id: account.id },
        data: { status: PaymentAccountStatus.ERROR, lastError: errorMessage },
      });

      throw error;
    }
  }

  /**
   * Called when the Stripe Account Link has expired (refresh URL).
   * Generates a fresh Account Link for the same connected account.
   */
  async refreshStripeAccountLink(userId: string, frontendUrl: string): Promise<{ url: string }> {
    const founder = await this.getFounderByUserId(userId);

    const account = await this.prisma.paymentAccount.findUnique({
      where: { founderId_provider: { founderId: founder.id, provider: PaymentProvider.STRIPE } },
    });

    if (!account || !account.providerAccountId) {
      // No existing account — start fresh
      return this.connectStripe(userId, frontendUrl);
    }

    try {
      const returnUrl = `${frontendUrl}/dashboard/settings/payments/stripe/return`;
      const refreshUrl = `${frontendUrl}/dashboard/settings/payments/stripe/refresh`;
      const url = await this.stripeProvider.createAccountLink(
        account.providerAccountId,
        returnUrl,
        refreshUrl,
      );
      return { url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stripe link refresh failed: ${errorMessage}`);
      throw error;
    }
  }

  // ── Chapa ─────────────────────────────────────────────────────────────────

  /**
   * Connects a Chapa subaccount for the founder.
   * Chapa uses a subaccount model (not OAuth). The founder provides their bank details
   * and WaitlistOS creates the subaccount via the Chapa API.
   */
  async connectChapa(
    userId: string,
    bankCode: string,
    accountNumber: string,
    businessName: string,
  ) {
    const founder = await this.getFounderByUserId(userId);

    try {
      const subaccountId = await this.chapaProvider.createSubaccount(
        bankCode,
        accountNumber,
        businessName,
      );

      const account = await this.prisma.paymentAccount.upsert({
        where: { founderId_provider: { founderId: founder.id, provider: PaymentProvider.CHAPA } },
        update: {
          providerAccountId: subaccountId,
          status: PaymentAccountStatus.ACTIVE,
          connectedAt: new Date(),
          lastError: null,
        },
        create: {
          founderId: founder.id,
          provider: PaymentProvider.CHAPA,
          providerAccountId: subaccountId,
          status: PaymentAccountStatus.ACTIVE,
          connectedAt: new Date(),
        },
      });

      return {
        id: account.id,
        provider: account.provider,
        status: account.status,
        connectedAt: account.connectedAt,
        createdAt: account.createdAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chapa connect failed for founder ${founder.id}: ${errorMessage}`);

      // Record error
      await this.prisma.paymentAccount.upsert({
        where: { founderId_provider: { founderId: founder.id, provider: PaymentProvider.CHAPA } },
        update: { status: PaymentAccountStatus.ERROR, lastError: errorMessage },
        create: {
          founderId: founder.id,
          provider: PaymentProvider.CHAPA,
          status: PaymentAccountStatus.ERROR,
          lastError: errorMessage,
        },
      });

      throw error;
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  async disconnectAccount(userId: string, provider: PaymentProvider) {
    const founder = await this.getFounderByUserId(userId);

    const account = await this.prisma.paymentAccount.findUnique({
      where: { founderId_provider: { founderId: founder.id, provider } },
    });

    if (!account) {
      throw new NotFoundException(`No ${provider} account found.`);
    }

    await this.prisma.paymentAccount.update({
      where: { id: account.id },
      data: { status: PaymentAccountStatus.DISCONNECTED },
    });
  }

  // ── Checkout ──────────────────────────────────────────────────────────────

  async createCheckout(
    founderId: string,
    customerEmail: string,
    dto: CreateCheckoutDto,
    returnUrl: string,
    cancelUrl: string,
  ) {
    const account = await this.prisma.paymentAccount.findUnique({
      where: {
        founderId_provider: {
          founderId,
          provider: dto.provider,
        },
      },
    });

    if (!account || account.status !== PaymentAccountStatus.ACTIVE) {
      throw new BadRequestException(
        `${dto.provider} account is not connected or not active. Please connect your payment account in Settings.`,
      );
    }

    const { platformFee, providerFee, founderAmount } = this.feeService.calculateFees(dto.amount);

    const payment = await this.prisma.monetizationPayment.create({
      data: {
        founderId,
        waitlistId: dto.waitlistId,
        participantId: dto.participantId,
        provider: dto.provider,
        providerPaymentId: `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        paymentType: dto.paymentType,
        amount: dto.amount,
        currency: dto.currency,
        platformFee,
        providerFee,
        founderAmount,
        status: MonetizationPaymentStatus.PENDING,
      },
    });

    const providerService = this.getProvider(dto.provider);

    try {
      const { checkoutUrl, providerPaymentId } = await providerService.initializePayment(
        payment,
        account,
        returnUrl,
        cancelUrl,
        customerEmail,
      );

      await this.prisma.monetizationPayment.update({
        where: { id: payment.id },
        data: { providerPaymentId },
      });

      return { checkoutUrl };
    } catch (error) {
      await this.prisma.monetizationPayment.delete({ where: { id: payment.id } });
      throw error;
    }
  }

  // ── Webhooks ──────────────────────────────────────────────────────────────

  async handleWebhook(provider: PaymentProvider, rawBody: string, signature: string | undefined) {
    const providerService = this.getProvider(provider);

    if (!providerService.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventResult = await providerService.parseWebhookEvent(rawBody, signature);

    // Idempotency check
    const existingEvent = await this.prisma.monetizationPaymentEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId: eventResult.providerEventId,
        },
      },
    });

    if (existingEvent?.processedAt) {
      this.logger.log(`Webhook already processed: ${eventResult.providerEventId}`);
      return { received: true };
    }

    const payment = await this.prisma.monetizationPayment.findUnique({
      where: { providerPaymentId: eventResult.providerPaymentId },
    });

    await this.prisma.monetizationPaymentEvent.upsert({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId: eventResult.providerEventId,
        },
      },
      update: {},
      create: {
        provider,
        providerEventId: eventResult.providerEventId,
        paymentId: payment?.id,
        eventType: eventResult.eventType,
        payload: eventResult.payload,
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for providerPaymentId: ${eventResult.providerPaymentId}`);
      return { received: true };
    }

    if (eventResult.status === 'SUCCESS' && payment.status === MonetizationPaymentStatus.PENDING) {
      await this.prisma.$transaction(async (tx) => {
        await tx.monetizationPayment.update({
          where: { id: payment.id },
          data: { status: MonetizationPaymentStatus.SUCCEEDED },
        });
        await tx.monetizationPaymentEvent.update({
          where: {
            provider_providerEventId: {
              provider,
              providerEventId: eventResult.providerEventId,
            },
          },
          data: { processedAt: new Date() },
        });
      });
    } else if (eventResult.status === 'FAILED' && payment.status === MonetizationPaymentStatus.PENDING) {
      await this.prisma.$transaction(async (tx) => {
        await tx.monetizationPayment.update({
          where: { id: payment.id },
          data: { status: MonetizationPaymentStatus.FAILED },
        });
        await tx.monetizationPaymentEvent.update({
          where: {
            provider_providerEventId: {
              provider,
              providerEventId: eventResult.providerEventId,
            },
          },
          data: { processedAt: new Date() },
        });
      });
    }

    return { received: true };
  }
}
