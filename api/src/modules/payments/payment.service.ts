import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BillingCycle,
  PaymentEventType,
  PaymentStatus,
  Prisma,
  SubscriptionPlanCode,
  SubscriptionStatus,
  PaymentProvider,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { ChapaService } from './providers/chapa/chapa.service';
import { StripeService } from './providers/stripe/stripe.service';
import { PaymentRepository } from './payment.repository';
import {
  buildPlanLimits,
  getPlanFeatures,
  hasMinimumPlan,
  isPaidPlan,
  isSubscriptionActive,
} from './constants/plan-features';
import type {
  InitializePaymentResult,
  PaymentHistoryItemDto,
  PublicPlanDto,
  SubscriptionSummaryDto,
} from './types/payment.types';
import type { PremiumFeature } from './decorators/subscription.decorator';
import { EmailsService } from '../emails/emails.service';
import { AffiliateCommissionEngine } from '../affiliates/services/affiliate-commission.engine';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly repository: PaymentRepository,
    private readonly chapaService: ChapaService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly emailsService: EmailsService,
    private readonly affiliateCommissionEngine: AffiliateCommissionEngine,
  ) {}

  private getProvider(providerType: PaymentProvider) {
    if (providerType === PaymentProvider.STRIPE) {
      return this.stripeService;
    }
    return this.chapaService;
  }

  async seedPlans() {
    const currency = this.configService.get<string>('plans.currency') ?? 'USD';
    const freeMaxWaitlists =
      this.configService.get<number>('plans.freeMaxWaitlists') ?? 1;
    const freeMaxParticipants =
      this.configService.get<number>('plans.freeMaxParticipants') ?? 500;
    const starterPrice =
      this.configService.get<number>('plans.starterPrice') ?? 19;
    const starterMaxWaitlists =
      this.configService.get<number>('plans.starterMaxWaitlists') ?? 5;
    const starterMaxParticipants =
      this.configService.get<number>('plans.starterMaxParticipants') ?? 5000;
    const proPrice = this.configService.get<number>('plans.proPrice') ?? 49;

    await this.repository.upsertPlan({
      code: SubscriptionPlanCode.FREE,
      name: 'Free',
      description: '1 waitlist, 500 signups',
      price: 0,
      currency,
      billingCycle: BillingCycle.FREE,
      maxWaitlists: freeMaxWaitlists,
      maxParticipants: freeMaxParticipants,
      features: getPlanFeatures(SubscriptionPlanCode.FREE) as object,
    });

    await this.repository.upsertPlan({
      code: SubscriptionPlanCode.STARTER,
      name: 'Starter',
      description: '5 waitlists, 5,000 signups',
      price: starterPrice,
      currency,
      billingCycle: BillingCycle.MONTHLY,
      maxWaitlists: starterMaxWaitlists,
      maxParticipants: starterMaxParticipants,
      features: getPlanFeatures(SubscriptionPlanCode.STARTER) as object,
    });

    await this.repository.upsertPlan({
      code: SubscriptionPlanCode.PRO,
      name: 'Pro',
      description: 'Unlimited waitlists, custom domain',
      price: proPrice,
      currency,
      billingCycle: BillingCycle.MONTHLY,
      maxWaitlists: null,
      maxParticipants: null,
      features: getPlanFeatures(SubscriptionPlanCode.PRO) as object,
    });
  }

  async getPublicPlans(): Promise<PublicPlanDto[]> {
    const plans = await this.repository.findAllActivePlans();
    return plans.map((plan) => this.toPublicPlan(plan));
  }

  async getSubscriptionSummary(userId: string): Promise<SubscriptionSummaryDto> {
    const subscription = await this.ensureSubscription(userId);
    return this.toSubscriptionSummary(subscription);
  }

  async cancelSubscription(userId: string): Promise<SubscriptionSummaryDto> {
    const subscription = await this.ensureSubscription(userId);
    
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('SUBSCRIPTION_NOT_ACTIVE');
    }

    const updated = await this.repository.cancelSubscription(userId);
    return this.toSubscriptionSummary(updated);
  }

  async resumeSubscription(userId: string): Promise<SubscriptionSummaryDto> {
    const subscription = await this.ensureSubscription(userId);
    
    if (subscription.status !== SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('SUBSCRIPTION_NOT_CANCELLED');
    }

    // Only allow resume if it hasn't expired yet
    if (subscription.expiresAt && subscription.expiresAt < new Date()) {
      throw new BadRequestException('SUBSCRIPTION_EXPIRED');
    }

    const updated = await this.repository.resumeSubscription(userId);
    return this.toSubscriptionSummary(updated);
  }

  async getPaymentHistory(userId: string): Promise<PaymentHistoryItemDto[]> {
    const payments = await this.repository.listPaymentsByUserId(userId);
    return payments.map((payment) => ({
      id: payment.id,
      planCode: payment.planCode,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentStatus: payment.paymentStatus,
      providerReference: payment.providerReference,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
    }));
  }

  async initializePayment(
    userId: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    planCode: SubscriptionPlanCode,
    provider: PaymentProvider,
  ): Promise<InitializePaymentResult> {
    if (!isPaidPlan(planCode)) {
      throw new BadRequestException('INVALID_PAID_PLAN');
    }

    const plan = await this.repository.findPlanByCode(planCode);
    if (!plan || !plan.isActive) {
      throw new NotFoundException('PLAN_NOT_FOUND');
    }

    const subscription = await this.ensureSubscription(userId);
    const txRef = this.buildTxRef(userId);
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ??
      'http://localhost:3001';

    const providerService = this.getProvider(provider);
    
    const { checkoutUrl, providerReference } = await providerService.initializeTransaction({
      amount: Number(plan.price),
      currency: plan.currency,
      email,
      firstName: firstName || 'Founder',
      lastName: lastName || 'User',
      txRef,
      callbackUrl: `${frontendUrl}/payment/pending?tx_ref=${encodeURIComponent(txRef)}`,
      returnUrl: `${frontendUrl}/payment/success?tx_ref=${encodeURIComponent(txRef)}`,
      planName: plan.name,
    });

    const payment = await this.repository.createPaymentRecord({
      userId,
      subscriptionId: subscription.id,
      planCode,
      amount: Number(plan.price),
      currency: plan.currency,
      provider,
      providerReference: providerReference || txRef,
      checkoutUrl,
      metadata: { planName: plan.name, internalTxRef: txRef },
    });

    await this.repository.recordPaymentEvent({
      paymentId: payment.id,
      eventType: PaymentEventType.INITIALIZED,
      payload: { txRef, planCode },
      idempotencyKey: `init:${txRef}`,
      processed: true,
    });

    return {
      checkoutUrl,
      providerReference: providerReference || txRef,
      paymentId: payment.id,
    };
  }

  async verifyPayment(userId: string, txRef: string) {
    const payment = await this.repository.findPaymentByReferenceOrMetadata(txRef);
    // If it's stripe, the passed txRef might be the internal one, but we saved the stripe session ID as providerReference
    // Let's assume txRef here is what we passed back to the frontend (internal TxRef)
    // Wait, the frontend gets txRef from the URL parameter. In initializeTransaction, we returned `providerReference`. 
    // If we used the Stripe session id as providerReference, the frontend won't have it because we redirected it with internal txRef.
    // Let's find payment by providerReference OR metadata.internalTxRef.
    // We'll update the repository later, for now let's just find the payment properly.

    if (!payment || payment.userId !== userId) {
      throw new NotFoundException('PAYMENT_NOT_FOUND');
    }

    if (payment.paymentStatus === PaymentStatus.SUCCESS) {
      return {
        success: true,
        status: payment.paymentStatus,
        planCode: payment.planCode,
      };
    }

    const providerService = this.getProvider(payment.provider);
    const verification = await providerService.verifyTransaction(payment.providerReference);

    if (verification.success) {
      await this.completeSuccessfulPayment(
        payment.id,
        payment.userId,
        payment.planCode,
        Number(payment.amount),
        payment.currency,
        payment.providerReference,
        verification.providerReference,
        { source: 'verify' },
      );

      return {
        success: true,
        status: PaymentStatus.SUCCESS,
        planCode: payment.planCode,
      };
    }

    await this.repository.updatePaymentStatus({
      providerReference: payment.providerReference,
      paymentStatus: PaymentStatus.FAILED,
    });

    return {
      success: false,
      status: PaymentStatus.FAILED,
      planCode: payment.planCode,
    };
  }

  async handleChapaWebhook(rawBody: string, signature: string | undefined) {
    if (!this.chapaService.verifyWebhookSignature(rawBody, signature)) {
      throw new ForbiddenException('INVALID_WEBHOOK_SIGNATURE');
    }
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    return this.processWebhookEvent(payload);
  }

  async handleStripeWebhook(payload: Record<string, unknown>) {
    return this.processWebhookEvent(payload);
  }

  private async processWebhookEvent(payload: Record<string, unknown>) {
    const txRef = String(payload.tx_ref ?? payload.txRef ?? '');
    const eventName = String(payload.event ?? payload.status ?? 'webhook');
    const idempotencyKey = `webhook:${txRef}:${eventName}`;

    if (!txRef) {
      throw new BadRequestException('MISSING_TX_REF');
    }

    const existingEvent = await this.repository.paymentEventExists(idempotencyKey);
    if (existingEvent?.processed) {
      return { success: true, duplicate: true };
    }

    // The tx_ref here might be the internal txRef depending on provider.
    // For Chapa it is tx_ref, for Stripe we passed it in metadata as txRef.
    const payment = await this.repository.findPaymentByReferenceOrMetadata(txRef);
    if (!payment) {
      throw new NotFoundException('PAYMENT_NOT_FOUND');
    }

    if (!existingEvent) {
      await this.repository.recordPaymentEvent({
        paymentId: payment.id,
        eventType: PaymentEventType.WEBHOOK_RECEIVED,
        payload: payload as Prisma.InputJsonValue,
        idempotencyKey,
      });
    }

    const status = String(payload.status ?? '').toLowerCase();

    if (status === 'success') {
      await this.completeSuccessfulPayment(
        payment.id,
        payment.userId,
        payment.planCode,
        Number(payment.amount),
        payment.currency,
        payment.providerReference,
        payload.reference ? String(payload.reference) : undefined,
        { source: 'webhook' },
      );
      await this.repository.markPaymentEventProcessed(idempotencyKey);
      return { success: true, status: PaymentStatus.SUCCESS };
    }

    if (status === 'failed' || status === 'cancelled') {
      await this.repository.updatePaymentStatus({
        providerReference: payment.providerReference,
        paymentStatus:
          status === 'cancelled'
            ? PaymentStatus.CANCELLED
            : PaymentStatus.FAILED,
      });
      await this.repository.markPaymentEventProcessed(idempotencyKey);
      const user = await this.repository.findUserById(payment.userId);
      if (user) {
        this.emailsService.queuePaymentFailedEmail(
          user.email,
          user.firstName,
          payment.planCode,
        );
      }
      return {
        success: true,
        status:
          status === 'cancelled'
            ? PaymentStatus.CANCELLED
            : PaymentStatus.FAILED,
      };
    }

    return { success: true, status: PaymentStatus.PENDING };
  }

  async ensureSubscription(userId: string) {
    const freePlan = await this.repository.findPlanByCode(
      SubscriptionPlanCode.FREE,
    );

    if (!freePlan) {
      throw new NotFoundException('FREE_PLAN_NOT_FOUND');
    }

    return this.repository.ensureFreeSubscription(userId, freePlan.id);
  }

  async assertCanCreateWaitlist(userId: string) {
    const subscription = await this.ensureSubscription(userId);
    const limits = buildPlanLimits(
      subscription.planCode,
      subscription.plan.maxWaitlists,
      subscription.plan.maxParticipants,
    );

    if (limits.maxWaitlists == null) {
      return;
    }

    const count = await this.repository.countFounderWaitlists(userId);
    if (count >= limits.maxWaitlists) {
      throw new ForbiddenException('WAITLIST_LIMIT_REACHED');
    }
  }

  async assertCanAddParticipant(userId: string) {
    const subscription = await this.ensureSubscription(userId);
    const limits = buildPlanLimits(
      subscription.planCode,
      subscription.plan.maxWaitlists,
      subscription.plan.maxParticipants,
    );

    if (limits.maxParticipants == null) {
      return;
    }

    const count = await this.repository.countFounderParticipants(userId);
    if (count >= limits.maxParticipants) {
      throw new ForbiddenException('PARTICIPANT_LIMIT_REACHED');
    }
  }

  async assertFeatureAccess(userId: string, feature: PremiumFeature) {
    const subscription = await this.ensureSubscription(userId);

    if (!isSubscriptionActive({ status: subscription.status, expiresAt: subscription.expiresAt })) {
      throw new ForbiddenException('SUBSCRIPTION_INACTIVE');
    }

    const features = getPlanFeatures(subscription.planCode);

    const featureMap: Record<PremiumFeature, boolean> = {
      UNLIMITED_WAITLISTS: subscription.planCode === SubscriptionPlanCode.PRO,
      EMBED_WIDGET: features.embedWidget,
      DYNAMIC_OG: features.dynamicOgImages,
      ADVANCED_ANALYTICS: features.advancedAnalytics,
      CUSTOM_BRANDING: features.customBranding,
      API_ACCESS: features.apiAccess,
    };

    if (!featureMap[feature]) {
      throw new ForbiddenException('PREMIUM_FEATURE_REQUIRED');
    }
  }

  async assertMinimumPlan(
    userId: string,
    requiredPlans: SubscriptionPlanCode[],
  ) {
    const subscription = await this.ensureSubscription(userId);

    if (!isSubscriptionActive({ status: subscription.status, expiresAt: subscription.expiresAt })) {
      throw new ForbiddenException('SUBSCRIPTION_INACTIVE');
    }

    if (!hasMinimumPlan(subscription.planCode, requiredPlans)) {
      throw new ForbiddenException('PLAN_UPGRADE_REQUIRED');
    }
  }

  private async completeSuccessfulPayment(
    paymentId: string,
    userId: string,
    planCode: SubscriptionPlanCode,
    amount: number,
    currency: string,
    providerReference: string,
    transactionId: string | undefined,
    metadata: Record<string, unknown>,
  ) {
    const payment = await this.repository.findPaymentById(paymentId);
    if (payment?.paymentStatus === PaymentStatus.SUCCESS) {
      return;
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.repository.updatePaymentStatus({
      providerReference,
      paymentStatus: PaymentStatus.SUCCESS,
      transactionId,
      paidAt: new Date(),
    });

    const subscription = await this.repository.activateSubscription({
      userId,
      planCode,
      amount,
      currency,
      providerReference,
      transactionId,
      billingCycle: BillingCycle.MONTHLY,
      expiresAt,
    });

    await this.repository.recordPaymentEvent({
      paymentId,
      eventType: PaymentEventType.VERIFIED,
      payload: metadata as Prisma.InputJsonValue,
      idempotencyKey: `verified:${providerReference}`,
      processed: true,
    });

    const user = await this.repository.findUserById(userId);
    if (!user) {
      return;
    }

    const plan = await this.repository.findPlanByCode(planCode);

    this.emailsService.queuePaymentSuccessfulEmail(
      user.email,
      user.firstName,
      plan?.name ?? planCode,
      amount,
      currency,
    );
    this.emailsService.queueSubscriptionActivatedEmail(
      user.email,
      user.firstName,
      plan?.name ?? planCode,
    );

    this.logger.log(
      `Subscription activated for user ${userId} on plan ${subscription.planCode}`,
    );

    // ── Affiliate Commission ──────────────────────────────────────────────────
    // Find the founder associated with this userId and attempt commission creation.
    // This is fire-and-forget: commission failures must never break the payment flow.
    try {
      const founder = await this.repository.findFounderByUserId(userId);
      if (founder) {
        await this.affiliateCommissionEngine.handleSubscriptionPayment({
          payingFounderId: founder.id,
          paymentId,
          amount: new Prisma.Decimal(amount),
          currency,
          planCode,
        });
      }
    } catch (commissionErr) {
      this.logger.error(
        `Affiliate commission generation failed for payment ${paymentId}: ${commissionErr instanceof Error ? commissionErr.message : String(commissionErr)}`,
      );
    }
  }

  private buildTxRef(userId: string) {
    const suffix = randomBytes(4).toString('hex');
    return `wos_${userId.slice(0, 8)}_${Date.now()}_${suffix}`;
  }

  private toPublicPlan(plan: {
    code: SubscriptionPlanCode;
    name: string;
    description: string | null;
    price: { toNumber(): number } | number;
    currency: string;
    billingCycle: BillingCycle;
    maxWaitlists: number | null;
    maxParticipants: number | null;
  }): PublicPlanDto {
    return {
      code: plan.code,
      name: plan.name,
      description: plan.description,
      price: Number(plan.price),
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: getPlanFeatures(plan.code),
      limits: buildPlanLimits(
        plan.code,
        plan.maxWaitlists,
        plan.maxParticipants,
      ),
    };
  }

  private toSubscriptionSummary(subscription: {
    planCode: SubscriptionPlanCode;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    amount: { toNumber(): number } | number;
    currency: string;
    startedAt: Date | null;
    expiresAt: Date | null;
    cancelledAt: Date | null;
    plan: {
      name: string;
      maxWaitlists: number | null;
      maxParticipants: number | null;
    };
  }): SubscriptionSummaryDto {
    return {
      planCode: subscription.planCode,
      planName: subscription.plan.name,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      amount: Number(subscription.amount),
      currency: subscription.currency,
      startedAt: subscription.startedAt?.toISOString() ?? null,
      expiresAt: subscription.expiresAt?.toISOString() ?? null,
      cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
      features: getPlanFeatures(subscription.planCode),
      limits: buildPlanLimits(
        subscription.planCode,
        subscription.plan.maxWaitlists,
        subscription.plan.maxParticipants,
      ),
    };
  }
}
