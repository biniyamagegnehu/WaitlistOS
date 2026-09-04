import { BadRequestException, Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { MonetizationPaymentStatus, MonetizationPaymentType, PaymentAccountStatus, PaymentProvider, Prisma, PreOrderDepositStatus, PreOrderDepositPolicy } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FeeService } from './fee.service';
import { StripeMonetizationProvider } from './providers/stripe-monetization.provider';
import { ChapaMonetizationProvider } from './providers/chapa-monetization.provider';
import { IMonetizationProvider, VerifyPaymentResult } from './providers/monetization-provider.interface';
import { CreateCheckoutDto, UpdatePreOrderDepositConfigDto } from './dto/monetization.dtos';
import { ParticipantsService } from '../participants/participants.service';
import { EmailsService } from '../emails/emails.service';
import { randomUUID } from 'crypto';

@Injectable()
export class MonetizationService {
  private readonly logger = new Logger(MonetizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feeService: FeeService,
    private readonly stripeProvider: StripeMonetizationProvider,
    private readonly chapaProvider: ChapaMonetizationProvider,
    private readonly configService: ConfigService,
    private readonly participantsService: ParticipantsService,
    private readonly emailsService: EmailsService,
  ) {}

  getProvider(provider: PaymentProvider): IMonetizationProvider {
    return provider === PaymentProvider.STRIPE ? this.stripeProvider : this.chapaProvider;
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Looks up the Founder record by userId.
   * The JWT strategy only provides userId; founderId must be resolved from the DB.
   */
  async getFounderByUserId(userId: string) {
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

      if (newStatus !== PaymentAccountStatus.ACTIVE) {
        await this.prisma.paymentAccount.delete({
          where: { id: account.id },
        });
        return { status: PaymentAccountStatus.NOT_CONNECTED };
      }

      await this.prisma.paymentAccount.update({
        where: { id: account.id },
        data: {
          status: newStatus,
          connectedAt: new Date(),
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

    await this.prisma.paymentAccount.delete({
      where: { id: account.id },
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
    // Auto-select provider if not provided
    let provider = dto.provider;
    if (!provider) {
      const activeAccount = await this.prisma.paymentAccount.findFirst({
        where: {
          founderId,
          status: PaymentAccountStatus.ACTIVE,
        },
      });
      if (!activeAccount) {
        throw new BadRequestException(
          'No active payment account found. Please connect a payment account first.',
        );
      }
      provider = activeAccount.provider;
    }

    const account = await this.prisma.paymentAccount.findUnique({
      where: {
        founderId_provider: {
          founderId,
          provider,
        },
      },
    });

    if (!account || account.status !== PaymentAccountStatus.ACTIVE) {
      throw new BadRequestException(
        `${provider} account is not connected or not active. Please connect your payment account in Settings.`,
      );
    }

    const { platformFee, providerFee, founderAmount } = this.feeService.calculateFees(dto.amount);

    // Fixed base currency: USD - system always uses USD as base currency
    // Payment providers handle any currency conversion for the customer
    const currency = 'USD';

    const payment = await this.prisma.monetizationPayment.create({
      data: {
        founderId,
        waitlistId: dto.waitlistId,
        participantId: dto.participantId,
        provider,
        providerPaymentId: `temp_${randomUUID()}`,
        paymentType: dto.paymentType,
        amount: dto.amount,
        currency,
        platformFee,
        providerFee,
        founderAmount,
        status: MonetizationPaymentStatus.PENDING,
      },
    });

    const providerService = this.getProvider(provider);

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

    // Create event record with idempotency constraint - this acts as a lock
    try {
      await this.prisma.monetizationPaymentEvent.create({
        data: {
          provider,
          providerEventId: eventResult.providerEventId,
          eventType: eventResult.eventType,
          payload: eventResult.payload,
        },
      });
    } catch (error) {
      // If creation fails due to unique constraint, webhook was already processed
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.log(`Webhook already processed: ${eventResult.providerEventId}`);
        return { received: true, alreadyProcessed: true };
      }
      throw error;
    }

    const payment = await this.prisma.monetizationPayment.findUnique({
      where: { providerPaymentId: eventResult.providerPaymentId },
    });

    // Update the event record with payment ID now that we have it
    await this.prisma.monetizationPaymentEvent.update({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId: eventResult.providerEventId,
        },
      },
      data: { paymentId: payment?.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for providerPaymentId: ${eventResult.providerPaymentId}`);
      await this.prisma.monetizationPaymentEvent.update({
        where: {
          provider_providerEventId: {
            provider,
            providerEventId: eventResult.providerEventId,
          },
        },
        data: { processedAt: new Date() },
      });
      return { received: true };
    }

    if (eventResult.status === 'SUCCESS' && payment.status === MonetizationPaymentStatus.PENDING) {
      await this.prisma.$transaction(async (tx) => {
        await tx.monetizationPayment.update({
          where: { id: payment.id },
          data: { 
            status: MonetizationPaymentStatus.SUCCEEDED,
            // Store provider-reported charged amount and currency when available
            ...(eventResult.chargedAmount && { chargedAmount: eventResult.chargedAmount }),
            ...(eventResult.chargedCurrency && { chargedCurrency: eventResult.chargedCurrency }),
          },
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

        // ── Grant Skip the Line Priority ─────────────────────────
        if (payment.paymentType === MonetizationPaymentType.SKIP_LINE && payment.participantId) {
          await tx.participant.update({
            where: { id: payment.participantId },
            data: {
              hasSkipLinePriority: true,
              skipLinePriorityGrantedAt: new Date(),
            },
          });

          this.logger.log(
            `Skip the Line priority granted to participant ${payment.participantId} for payment ${payment.id}`,
          );
        }

        // ── Pre-Order Deposit ─────────────────────────────────────
        if (payment.paymentType === MonetizationPaymentType.PRE_ORDER_DEPOSIT) {
          const deposit = await tx.preOrderDeposit.findFirst({
            where: { monetizationPaymentId: payment.id },
            include: { participant: true, waitlist: true }
          });
          if (deposit) {
            await tx.preOrderDeposit.update({
              where: { id: deposit.id },
              data: {
                status: PreOrderDepositStatus.PAID,
                paidAt: new Date(),
              }
            });
            this.logger.log(`Pre-Order Deposit marked as PAID for deposit ${deposit.id}`);
            
            // Queue confirmation email
            this.emailsService.queuePreOrderDepositSuccessfulEmail(
              deposit.participant.email,
              deposit.waitlist.name,
              Number(deposit.amount),
              deposit.currency,
            );
          }
        }
      });

      // ── Rerank participants outside transaction to see committed changes ─────────────
      if (payment.paymentType === MonetizationPaymentType.SKIP_LINE && payment.participantId) {
        await this.participantsService.rerankWaitlistParticipants(payment.waitlistId);
        this.logger.log(
          `Reranked participants for waitlist ${payment.waitlistId} after Skip the Line priority grant`,
        );
      }

      // Mark event as processed
      await this.prisma.monetizationPaymentEvent.update({
        where: {
          provider_providerEventId: {
            provider,
            providerEventId: eventResult.providerEventId,
          },
        },
        data: { processedAt: new Date() },
      });
    } else if (eventResult.status === 'FAILED' && payment.status === MonetizationPaymentStatus.PENDING) {
      await this.prisma.$transaction(async (tx) => {
        await tx.monetizationPayment.update({
          where: { id: payment.id },
          data: { status: MonetizationPaymentStatus.FAILED },
        });
        
        if (payment.paymentType === MonetizationPaymentType.PRE_ORDER_DEPOSIT) {
          const deposit = await tx.preOrderDeposit.findFirst({
            where: { monetizationPaymentId: payment.id }
          });
          if (deposit) {
            await tx.preOrderDeposit.update({
              where: { id: deposit.id },
              data: { status: PreOrderDepositStatus.FAILED }
            });
          }
        }

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
    } else {
      // Mark event as processed for other statuses
      await this.prisma.monetizationPaymentEvent.update({
        where: {
          provider_providerEventId: {
            provider,
            providerEventId: eventResult.providerEventId,
          },
        },
        data: { processedAt: new Date() },
      });
    }

    return { received: true };
  }

  // ── Pre-Order Deposit ───────────────────────────────────────────────────────

  async getPreOrderConfig(userId: string, waitlistId: string) {
    const founder = await this.getFounderByUserId(userId);
    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId: founder.id },
    });

    if (!waitlist) throw new NotFoundException('Waitlist not found');

    return {
      preOrderDepositEnabled: waitlist.preOrderDepositEnabled,
      preOrderDepositAmount: waitlist.preOrderDepositAmount,
      preOrderDepositDescription: waitlist.preOrderDepositDescription,
    };
  }

  async updatePreOrderConfig(userId: string, waitlistId: string, config: UpdatePreOrderDepositConfigDto) {
    const founder = await this.getFounderByUserId(userId);
    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId: founder.id },
    });

    if (!waitlist) throw new NotFoundException('Waitlist not found');

    const updated = await this.prisma.waitlist.update({
      where: { id: waitlistId },
      data: {
        preOrderDepositEnabled: config.preOrderDepositEnabled,
        preOrderDepositAmount: config.preOrderDepositAmount,
        preOrderDepositDescription: config.preOrderDepositDescription,
      },
    });

    return {
      preOrderDepositEnabled: updated.preOrderDepositEnabled,
      preOrderDepositAmount: updated.preOrderDepositAmount,
      preOrderDepositDescription: updated.preOrderDepositDescription,
    };
  }

  async createPreOrderCheckoutPublic(dto: CreateCheckoutDto) {
    const waitlist = await this.prisma.waitlist.findUnique({ where: { id: dto.waitlistId } });
    if (!waitlist || !waitlist.preOrderDepositEnabled) {
      throw new BadRequestException('Pre-Order Deposit is not enabled for this waitlist');
    }
    if (!waitlist.preOrderDepositAmount) {
      throw new BadRequestException('Pre-Order Deposit is misconfigured');
    }

    if (!dto.participantId) throw new BadRequestException('Participant ID is required');

    const participant = await this.prisma.participant.findUnique({ where: { id: dto.participantId } });
    if (!participant || participant.waitlistId !== waitlist.id) {
      throw new BadRequestException('Participant not found or invalid');
    }

    const existingDeposit = await this.prisma.preOrderDeposit.findFirst({
      where: {
        participantId: dto.participantId,
        waitlistId: dto.waitlistId,
        status: { in: [PreOrderDepositStatus.PAID, PreOrderDepositStatus.COLLECTION_PENDING, PreOrderDepositStatus.COLLECTED] },
      },
    });
    if (existingDeposit) throw new ConflictException('You have already paid a deposit');

    const amount = dto.amount || Number(waitlist.preOrderDepositAmount) || 5.00;
    // Fixed base currency: USD
    const currency = 'USD';
    const frontendUrl = this.configService.get<string>('app.frontendUrl') ?? 'http://localhost:3001';
    const returnUrl = `${frontendUrl}/payment/pre-order/success?waitlistId=${waitlist.id}`;
    const cancelUrl = `${frontendUrl}/payment/pre-order/cancel?waitlistId=${waitlist.id}`;

    const { checkoutUrl } = await this.createCheckout(
      waitlist.founderId,
      participant.email,
      {
        ...dto,
        paymentType: MonetizationPaymentType.PRE_ORDER_DEPOSIT,
        amount,
        currency,
      },
      returnUrl,
      cancelUrl,
    );

    // Retrieve the created payment to link it to the deposit
    // createCheckout returns checkoutUrl, so we need to find the latest payment
    const payment = await this.prisma.monetizationPayment.findFirst({
      where: {
        participantId: dto.participantId,
        waitlistId: dto.waitlistId,
        paymentType: MonetizationPaymentType.PRE_ORDER_DEPOSIT,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (payment) {
      await this.prisma.preOrderDeposit.create({
        data: {
          waitlistId: waitlist.id,
          participantId: participant.id,
          monetizationPaymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          provider: payment.provider,
          status: PreOrderDepositStatus.PENDING,
          policy: 'CREDIT_TOWARD_PURCHASE',
        }
      });
    }

    return { checkoutUrl };
  }

  async getPreOrderStatusPublic(depositId: string) {
    const deposit = await this.prisma.preOrderDeposit.findUnique({
      where: { id: depositId },
      include: {
        participant: { select: { id: true, email: true, position: true } },
        waitlist: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!deposit) throw new NotFoundException('Deposit not found');
    const { participant, waitlist, ...depositData } = deposit;
    return { deposit: depositData, participant, waitlist };
  }

  async getPreOrderLatestPublic(participantId: string, waitlistId: string) {
    const deposit = await this.prisma.preOrderDeposit.findFirst({
      where: { participantId, waitlistId },
      include: {
        participant: { select: { id: true, email: true, position: true } },
        waitlist: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!deposit) throw new NotFoundException('No deposit found');
    const { participant, waitlist, ...depositData } = deposit;
    return { deposit: depositData, participant, waitlist };
  }

  async getPreOrderDeposits(userId: string, waitlistId: string, query: any) {
    const founder = await this.getFounderByUserId(userId);
    const waitlist = await this.prisma.waitlist.findFirst({ where: { id: waitlistId, founderId: founder.id } });
    if (!waitlist) throw new NotFoundException('Waitlist not found');

    const deposits = await this.prisma.preOrderDeposit.findMany({
      where: { waitlistId },
      include: { 
        participant: { select: { email: true, createdAt: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    return deposits;
  }

  async getPreOrderAnalytics(userId: string, waitlistId: string, filters: any) {
    const founder = await this.getFounderByUserId(userId);
    const waitlist = await this.prisma.waitlist.findFirst({ where: { id: waitlistId, founderId: founder.id } });
    if (!waitlist) throw new NotFoundException('Waitlist not found');

    const deposits = await this.prisma.preOrderDeposit.findMany({
      where: { waitlistId, status: PreOrderDepositStatus.PAID },
    });
    const totalDeposits = deposits.length;
    const grossRevenue = deposits.reduce((sum, d) => sum + Number(d.amount), 0);

    return { 
      totalDeposits, 
      grossRevenue: Number(grossRevenue),
      preOrderEnabled: waitlist.preOrderDepositEnabled 
    };
  }

  // ── Skip the Line ───────────────────────────────────────────────────────────

  /**
   * Creates a Skip the Line checkout session (public endpoint).
   * This is for participants on the public waitlist page.
   * Auto-selects the active payment provider for the waitlist.
   */
  async createSkipLineCheckoutPublic(dto: CreateCheckoutDto) {
    // Load waitlist and validate Skip the Line is enabled
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { id: dto.waitlistId },
    });

    if (!waitlist) {
      throw new NotFoundException('Waitlist not found');
    }

    if (!waitlist.skipLineEnabled) {
      throw new BadRequestException('Skip the Line is not enabled for this waitlist');
    }

    // Validate participant
    if (!dto.participantId) {
      throw new BadRequestException('Participant ID is required');
    }

    const participant = await this.prisma.participant.findUnique({
      where: { id: dto.participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.waitlistId !== waitlist.id) {
      throw new BadRequestException('Participant does not belong to this waitlist');
    }

    // Check if participant already has Skip the Line priority
    if (participant.hasSkipLinePriority) {
      throw new ConflictException('You already have Skip the Line priority');
    }

    // Check for existing successful payment
    const existingPayment = await this.prisma.monetizationPayment.findFirst({
      where: {
        participantId: dto.participantId,
        waitlistId: dto.waitlistId,
        paymentType: MonetizationPaymentType.SKIP_LINE,
        status: MonetizationPaymentStatus.SUCCEEDED,
      },
    });

    if (existingPayment) {
      throw new ConflictException('You have already purchased Skip the Line');
    }

    // Use server-side configured price if not provided
    const amount = dto.amount || Number(waitlist.skipLinePrice) || 10.00;
    // Fixed base currency: USD
    const currency = 'USD';

    // Create checkout using existing infrastructure
    const frontendUrl = this.configService.get<string>('app.frontendUrl') ?? 'http://localhost:3001';
    const returnUrl = `${frontendUrl}/payment/skip-line/success`;
    const cancelUrl = `${frontendUrl}/payment/skip-line/cancel`;

    const { checkoutUrl } = await this.createCheckout(
      waitlist.founderId,
      participant.email,
      {
        ...dto,
        paymentType: MonetizationPaymentType.SKIP_LINE,
        amount,
        currency,
      },
      returnUrl,
      cancelUrl,
    );

    this.logger.log(
      `Skip the Line checkout created for participant ${participant.id} on waitlist ${waitlist.id}`,
    );

    return { checkoutUrl };
  }

  /**
   * Creates a Skip the Line checkout session (founder endpoint).
   * This is for founders testing the checkout flow.
   */
  async createSkipLineCheckout(founderId: string, dto: CreateCheckoutDto) {
    // Load waitlist and validate Skip the Line is enabled
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { id: dto.waitlistId },
    });

    if (!waitlist) {
      throw new NotFoundException('Waitlist not found');
    }

    if (!waitlist.skipLineEnabled) {
      throw new BadRequestException('Skip the Line is not enabled for this waitlist');
    }

    if (waitlist.founderId !== founderId) {
      throw new BadRequestException('You do not own this waitlist');
    }

    // Validate participant
    if (!dto.participantId) {
      throw new BadRequestException('Participant ID is required');
    }

    const participant = await this.prisma.participant.findUnique({
      where: { id: dto.participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.waitlistId !== waitlist.id) {
      throw new BadRequestException('Participant does not belong to this waitlist');
    }

    // Check if participant already has Skip the Line priority
    if (participant.hasSkipLinePriority) {
      throw new ConflictException('You already have Skip the Line priority');
    }

    // Check for existing successful payment
    const existingPayment = await this.prisma.monetizationPayment.findFirst({
      where: {
        participantId: dto.participantId,
        waitlistId: dto.waitlistId,
        paymentType: MonetizationPaymentType.SKIP_LINE,
        status: MonetizationPaymentStatus.SUCCEEDED,
      },
    });

    if (existingPayment) {
      throw new ConflictException('You have already purchased Skip the Line');
    }

    // Use server-side configured price if not provided
    const amount = dto.amount || Number(waitlist.skipLinePrice) || 10.00;
    // Fixed base currency: USD
    const currency = 'USD';

    // Create checkout using existing infrastructure
    const frontendUrl = this.configService.get<string>('app.frontendUrl') ?? 'http://localhost:3001';
    const returnUrl = `${frontendUrl}/payment/skip-line/success`;
    const cancelUrl = `${frontendUrl}/payment/skip-line/cancel`;

    const { checkoutUrl } = await this.createCheckout(
      founderId,
      participant.email,
      {
        ...dto,
        paymentType: MonetizationPaymentType.SKIP_LINE,
        amount,
        currency,
      },
      returnUrl,
      cancelUrl,
    );

    this.logger.log(
      `Skip the Line checkout created for participant ${participant.id} on waitlist ${waitlist.id}`,
    );

    return { checkoutUrl };
  }

  /**
   * Retrieves the status of a Skip the Line payment (public endpoint).
   */
  async getSkipLinePaymentStatusPublic(paymentId: string) {
    const payment = await this.prisma.monetizationPayment.findFirst({
      where: {
        id: paymentId,
        paymentType: MonetizationPaymentType.SKIP_LINE,
      },
      include: {
        participant: {
          select: {
            id: true,
            email: true,
            position: true,
            hasSkipLinePriority: true,
          },
        },
        waitlist: {
          select: {
            id: true,
            name: true,
            slug: true,
            skipLineEnabled: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
      },
      participant: payment.participant,
      waitlist: payment.waitlist,
    };
  }

  /**
   * Retrieves the status of a Skip the Line payment (protected endpoint).
   */
  async getSkipLinePaymentStatus(paymentId: string, userId: string) {
    const founder = await this.getFounderByUserId(userId);

    const payment = await this.prisma.monetizationPayment.findFirst({
      where: {
        id: paymentId,
        founderId: founder.id,
        paymentType: MonetizationPaymentType.SKIP_LINE,
      },
      include: {
        participant: {
          select: {
            id: true,
            email: true,
            position: true,
            hasSkipLinePriority: true,
          },
        },
        waitlist: {
          select: {
            id: true,
            name: true,
            skipLineEnabled: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
      },
      participant: payment.participant,
      waitlist: payment.waitlist,
    };
  }

  /**
   * Retrieves the latest Skip the Line payment for a founder (protected endpoint).
   */
  async getLatestSkipLinePaymentStatus(userId: string) {
    const founder = await this.getFounderByUserId(userId);

    const payment = await this.prisma.monetizationPayment.findFirst({
      where: {
        founderId: founder.id,
        paymentType: MonetizationPaymentType.SKIP_LINE,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        participant: {
          select: {
            id: true,
            email: true,
            position: true,
            hasSkipLinePriority: true,
          },
        },
        waitlist: {
          select: {
            id: true,
            name: true,
            slug: true,
            skipLineEnabled: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('No Skip the Line payment found');
    }

    return {
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
      },
      participant: payment.participant,
      waitlist: payment.waitlist,
    };
  }

  /**
   * Retrieves the latest Skip the Line payment for a participant (public endpoint).
   */
  async getLatestSkipLinePaymentStatusPublic(participantId: string, waitlistId: string) {
    const payment = await this.prisma.monetizationPayment.findFirst({
      where: {
        participantId,
        waitlistId,
        paymentType: MonetizationPaymentType.SKIP_LINE,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        participant: {
          select: {
            id: true,
            email: true,
            position: true,
            hasSkipLinePriority: true,
          },
        },
        waitlist: {
          select: {
            id: true,
            name: true,
            slug: true,
            skipLineEnabled: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('No Skip the Line payment found');
    }

    return {
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
      },
      participant: payment.participant,
      waitlist: payment.waitlist,
    };
  }

  /**
   * Manually verify a Pre-Order Chapa payment by checking its status directly from Chapa API.
   * This is used as a fallback when webhooks fail or for testing purposes.
   */
  async verifyPreOrderPayment(paymentId: string): Promise<{ message: string; payment: any }> {
    const payment = await this.prisma.monetizationPayment.findUnique({
      where: { id: paymentId },
      include: {
        participant: true,
        waitlist: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === MonetizationPaymentStatus.SUCCEEDED) {
      return { message: 'Payment already verified', payment };
    }

    if (payment.provider !== PaymentProvider.CHAPA) {
      throw new BadRequestException('Payment is not a Chapa payment');
    }

    const account = await this.prisma.paymentAccount.findFirst({
      where: {
        founderId: payment.founderId,
        provider: PaymentProvider.CHAPA,
        status: PaymentAccountStatus.ACTIVE,
      },
    });

    if (!account) {
      throw new BadRequestException('No active Chapa account found for this payment');
    }

    const provider = this.getProvider(PaymentProvider.CHAPA);
    const verificationResult: VerifyPaymentResult = await provider.verifyPayment(paymentId, account);

    if (verificationResult.status === 'SUCCEEDED') {
      this.logger.log(`Chapa pre-order payment verification returned SUCCEEDED for payment ${paymentId}`);
      
      await this.prisma.$transaction(async (tx) => {
        await tx.monetizationPayment.update({
          where: { id: paymentId },
          data: {
            status: MonetizationPaymentStatus.SUCCEEDED,
            providerPaymentId: verificationResult.providerPaymentId,
            // Note: Manual verification doesn't provide charged amount/currency
            // These fields will remain null and rely on webhook data
          },
        });

        const deposit = await tx.preOrderDeposit.findFirst({
          where: { monetizationPaymentId: paymentId },
        });

        if (deposit) {
          await tx.preOrderDeposit.update({
            where: { id: deposit.id },
            data: {
              status: PreOrderDepositStatus.PAID,
              paidAt: new Date(),
            }
          });
          
          this.logger.log(`Successfully updated Pre-Order Deposit ${deposit.id} to PAID`);
        }
      });

      const deposit = await this.prisma.preOrderDeposit.findFirst({
        where: { monetizationPaymentId: paymentId },
        include: { participant: true, waitlist: true }
      });
      if (deposit && deposit.participant) {
        this.emailsService.queuePreOrderDepositSuccessfulEmail(
          deposit.participant.email,
          deposit.waitlist.name,
          Number(deposit.amount),
          deposit.currency,
        );
      }

      this.logger.log(`Chapa pre-order payment ${paymentId} verified successfully via manual check`);
    } else {
      this.logger.warn(`Chapa pre-order payment verification returned ${verificationResult.status} for payment ${paymentId}`);
    }

    return { message: `Verification check completed. Status: ${verificationResult.status}`, payment };
  }

  /**
   * Manually verify a Chapa payment by checking its status directly from Chapa API.
   * This is used as a fallback when webhooks fail or for testing purposes.
   */
  async verifyChapaPayment(paymentId: string): Promise<{ message: string; payment: any }> {
    const payment = await this.prisma.monetizationPayment.findUnique({
      where: { id: paymentId },
      include: {
        participant: true,
        waitlist: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === MonetizationPaymentStatus.SUCCEEDED) {
      return { message: 'Payment already verified', payment };
    }

    if (payment.provider !== PaymentProvider.CHAPA) {
      throw new BadRequestException('Payment is not a Chapa payment');
    }

    // Get the payment account for this waitlist/founder
    const account = await this.prisma.paymentAccount.findFirst({
      where: {
        founderId: payment.founderId,
        provider: PaymentProvider.CHAPA,
        status: PaymentAccountStatus.ACTIVE,
      },
    });

    if (!account) {
      throw new BadRequestException('No active Chapa account found for this payment');
    }

    // Get Chapa provider
    const provider = this.getProvider(PaymentProvider.CHAPA);

    // Verify payment status with Chapa
    const verificationResult: VerifyPaymentResult = await provider.verifyPayment(paymentId, account);

    if (verificationResult.status === 'SUCCEEDED') {
      this.logger.log(`Chapa payment verification returned SUCCEEDED for payment ${paymentId}`);
      this.logger.log(`Payment participantId: ${payment.participantId}, waitlistId: ${payment.waitlistId}`);
      
      // Update payment status and grant priority in a transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.monetizationPayment.update({
          where: { id: paymentId },
          data: {
            status: MonetizationPaymentStatus.SUCCEEDED,
            providerPaymentId: verificationResult.providerPaymentId,
            // Note: Manual verification doesn't provide charged amount/currency
            // These fields will remain null and rely on webhook data
          },
        });

        // Grant skip line priority if participant exists
        if (payment.participantId) {
          this.logger.log(`Updating participant ${payment.participantId} hasSkipLinePriority to true`);
          await tx.participant.update({
            where: { id: payment.participantId },
            data: { hasSkipLinePriority: true },
          });
          this.logger.log(`Successfully set hasSkipLinePriority=true for participant ${payment.participantId}`);
        } else {
          this.logger.warn(`No participantId found for payment ${paymentId}`);
        }
      });

      // Rerank participants outside transaction to see committed changes
      if (payment.waitlistId) {
        this.logger.log(`Starting rerank for waitlist ${payment.waitlistId}`);
        await this.participantsService.rerankWaitlistParticipants(payment.waitlistId);
        this.logger.log(`Completed rerank for waitlist ${payment.waitlistId}`);
      }

      this.logger.log(`Chapa payment ${paymentId} verified successfully via manual check with reranking`);
    } else {
      this.logger.log(`Chapa payment verification returned status: ${verificationResult.status} for payment ${paymentId}`);
    }

    return { message: 'Payment verification completed', payment };
  }
  async getPayments(userId: string, query: any) {
    const founder = await this.getFounderByUserId(userId);

    const { waitlistId, paymentType, status, provider, startDate, endDate, page = 1, limit = 20 } = query;

    const where: any = {
      founderId: founder.id,
    };

    if (waitlistId) {
      where.waitlistId = waitlistId;
    }

    if (paymentType) {
      where.paymentType = paymentType;
    }

    if (status) {
      where.status = status;
    }

    if (provider) {
      where.provider = provider;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [payments, total] = await Promise.all([
      this.prisma.monetizationPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        select: {
          id: true,
          paymentType: true,
          amount: true,
          currency: true,
          platformFee: true,
          providerFee: true,
          founderAmount: true,
          status: true,
          provider: true,
          providerPaymentId: true,
          chargedAmount: true,
          chargedCurrency: true,
          createdAt: true,
          updatedAt: true,
          participant: {
            select: {
              id: true,
              email: true,
              position: true,
              hasSkipLinePriority: true,
            },
          },
          waitlist: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.monetizationPayment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSkipLineAnalytics(userId: string, waitlistId: string, filters: any = {}) {
    const founder = await this.getFounderByUserId(userId);

    // Verify waitlist ownership
    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId: founder.id },
    });

    if (!waitlist) {
      throw new NotFoundException('Waitlist not found');
    }

    const { startDate, endDate, provider } = filters;

    const where: any = {
      founderId: founder.id,
      waitlistId,
      paymentType: 'SKIP_LINE',
      status: 'SUCCEEDED',
    };

    if (provider) {
      where.provider = provider;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const payments = await this.prisma.monetizationPayment.findMany({
      where,
      select: {
        amount: true,
        currency: true,
        platformFee: true,
        providerFee: true,
        founderAmount: true,
        provider: true,
        createdAt: true,
      },
    });

    const summary = payments.reduce(
      (acc, payment) => {
        const providerKey = payment.provider.toLowerCase();
        acc.totalRevenue += Number(payment.amount);
        acc.platformFees += Number(payment.platformFee);
        acc.providerFees += Number(payment.providerFee);
        acc.founderRevenue += Number(payment.founderAmount);
        acc.paidParticipants += 1;
        
        if (!acc.byProvider[providerKey]) {
          acc.byProvider[providerKey] = {
            totalRevenue: 0,
            paidParticipants: 0,
            platformFees: 0,
            providerFees: 0,
            founderRevenue: 0,
          };
        }
        
        acc.byProvider[providerKey].totalRevenue += Number(payment.amount);
        acc.byProvider[providerKey].paidParticipants += 1;
        acc.byProvider[providerKey].platformFees += Number(payment.platformFee);
        acc.byProvider[providerKey].providerFees += Number(payment.providerFee);
        acc.byProvider[providerKey].founderRevenue += Number(payment.founderAmount);
        
        return acc;
      },
      {
        totalRevenue: 0,
        platformFees: 0,
        providerFees: 0,
        founderRevenue: 0,
        paidParticipants: 0,
        byProvider: {} as Record<string, any>,
      },
    );

    const averagePayment = payments.length > 0 ? summary.totalRevenue / payments.length : 0;

    return {
      ...summary,
      averagePayment,
      currency: payments[0]?.currency || 'USD',
      skipLineEnabled: waitlist.skipLineEnabled,
      skipLinePrice: waitlist.skipLinePrice,
      totalRevenue: summary.totalRevenue,
      paidParticipants: summary.paidParticipants,
    };
  }

  async getPaymentDetails(userId: string, paymentId: string) {
    const founder = await this.getFounderByUserId(userId);

    const payment = await this.prisma.monetizationPayment.findFirst({
      where: {
        id: paymentId,
        founderId: founder.id,
      },
      select: {
        id: true,
        paymentType: true,
        amount: true,
        currency: true,
        platformFee: true,
        providerFee: true,
        founderAmount: true,
        status: true,
        provider: true,
        providerPaymentId: true,
        chargedAmount: true,
        chargedCurrency: true,
        createdAt: true,
        updatedAt: true,
        participant: {
          select: {
            id: true,
            email: true,
            position: true,
            hasSkipLinePriority: true,
            createdAt: true,
          },
        },
        waitlist: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async updateSkipLineConfig(userId: string, waitlistId: string, config: any) {
    const founder = await this.getFounderByUserId(userId);

    // Verify waitlist ownership
    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId: founder.id },
    });

    if (!waitlist) {
      throw new NotFoundException('Waitlist not found');
    }

    // Validate configuration
    if (config.skipLinePrice !== undefined && config.skipLinePrice !== null) {
      const price = Number(config.skipLinePrice);
      if (isNaN(price) || price <= 0) {
        throw new BadRequestException('Price must be a positive number');
      }
    }

    // Update waitlist configuration (currency removed - fixed USD base currency)
    const updatedWaitlist = await this.prisma.waitlist.update({
      where: { id: waitlistId },
      data: {
        skipLineEnabled: config.skipLineEnabled,
        skipLinePrice: config.skipLinePrice ? Number(config.skipLinePrice) : null,
      },
    });

    return updatedWaitlist;
  }
}