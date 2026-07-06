import { Injectable } from '@nestjs/common';
import {
  PaymentEventType,
  PaymentStatus,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ActivateSubscriptionInput,
  CreatePaymentRecordInput,
  RecordPaymentEventInput,
  SubscriptionHistoryInput,
  UpdatePaymentStatusInput,
} from './interfaces/payment.interfaces';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPlanByCode(code: SubscriptionPlanCode) {
    return this.prisma.subscriptionPlan.findUnique({ where: { code } });
  }

  findAllActivePlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  upsertPlan(data: {
    code: SubscriptionPlanCode;
    name: string;
    description?: string;
    price: number;
    currency: string;
    billingCycle: 'FREE' | 'MONTHLY';
    maxWaitlists?: number | null;
    maxParticipants?: number | null;
    features?: Prisma.InputJsonValue;
  }) {
    return this.prisma.subscriptionPlan.upsert({
      where: { code: data.code },
      create: {
        code: data.code,
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        billingCycle: data.billingCycle,
        maxWaitlists: data.maxWaitlists ?? null,
        maxParticipants: data.maxParticipants ?? null,
        features: data.features,
      },
      update: {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        billingCycle: data.billingCycle,
        maxWaitlists: data.maxWaitlists ?? null,
        maxParticipants: data.maxParticipants ?? null,
        features: data.features,
        isActive: true,
      },
    });
  }

  findSubscriptionByUserId(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
  }

  findFounderUserIdByReferralCode(referralCode: string) {
    return this.prisma.participant.findUnique({
      where: { referralCode },
      select: {
        waitlist: {
          select: {
            founder: {
              select: { userId: true },
            },
          },
        },
      },
    });
  }

  findPaymentByReference(providerReference: string) {
    return this.prisma.payment.findUnique({
      where: { providerReference },
      include: { subscription: true },
    });
  }

  findPaymentById(paymentId: string) {
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });
  }

  listPaymentsByUserId(userId: string, take = 20) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  countFounderWaitlists(userId: string) {
    return this.prisma.waitlist.count({
      where: { founder: { userId } },
    });
  }

  countFounderParticipants(userId: string) {
    return this.prisma.participant.count({
      where: { waitlist: { founder: { userId } } },
    });
  }

  async ensureFreeSubscription(userId: string, freePlanId: string) {
    return this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: freePlanId,
        planCode: SubscriptionPlanCode.FREE,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: 'FREE',
        amount: 0,
        currency: 'USD',
        startedAt: new Date(),
      },
      update: {},
      include: { plan: true },
    });
  }

  createPaymentRecord(input: CreatePaymentRecordInput) {
    return this.prisma.payment.create({
      data: {
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        planCode: input.planCode,
        amount: input.amount,
        currency: input.currency,
        providerReference: input.providerReference,
        checkoutUrl: input.checkoutUrl,
        paymentStatus: PaymentStatus.PENDING,
        metadata: input.metadata,
      },
    });
  }

  recordPaymentEvent(input: RecordPaymentEventInput) {
    return this.prisma.paymentEvent.create({
      data: {
        paymentId: input.paymentId,
        eventType: input.eventType,
        payload: input.payload,
        idempotencyKey: input.idempotencyKey,
        processed: input.processed ?? false,
      },
    });
  }

  paymentEventExists(idempotencyKey: string) {
    return this.prisma.paymentEvent.findUnique({
      where: { idempotencyKey },
    });
  }

  appendSubscriptionHistory(input: SubscriptionHistoryInput) {
    return this.prisma.subscriptionHistory.create({
      data: {
        subscriptionId: input.subscriptionId,
        userId: input.userId,
        fromPlan: input.fromPlan ?? null,
        toPlan: input.toPlan,
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus,
        reason: input.reason,
        metadata: input.metadata,
      },
    });
  }

  async activateSubscription(input: ActivateSubscriptionInput) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.subscriptionPlan.findUnique({
        where: { code: input.planCode },
      });

      if (!plan) {
        throw new Error(`Plan ${input.planCode} not found`);
      }

      const existing = await tx.subscription.findUnique({
        where: { userId: input.userId },
      });

      const subscription = await tx.subscription.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          planId: plan.id,
          planCode: input.planCode,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: input.billingCycle ?? 'MONTHLY',
          amount: input.amount,
          currency: input.currency,
          provider: 'CHAPA',
          providerReference: input.providerReference,
          transactionId: input.transactionId,
          paymentStatus: PaymentStatus.SUCCESS,
          startedAt: new Date(),
          expiresAt: input.expiresAt,
        },
        update: {
          planId: plan.id,
          planCode: input.planCode,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: input.billingCycle ?? 'MONTHLY',
          amount: input.amount,
          currency: input.currency,
          provider: 'CHAPA',
          providerReference: input.providerReference,
          transactionId: input.transactionId,
          paymentStatus: PaymentStatus.SUCCESS,
          startedAt: new Date(),
          expiresAt: input.expiresAt,
          cancelledAt: null,
        },
        include: { plan: true },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          userId: input.userId,
          fromPlan: existing?.planCode ?? null,
          toPlan: input.planCode,
          fromStatus: existing?.status ?? null,
          toStatus: SubscriptionStatus.ACTIVE,
          reason: 'payment_success',
          metadata: {
            providerReference: input.providerReference,
            transactionId: input.transactionId,
          },
        },
      });

      return subscription;
    });
  }

  async updatePaymentStatus(input: UpdatePaymentStatusInput) {
    return this.prisma.payment.update({
      where: { providerReference: input.providerReference },
      data: {
        paymentStatus: input.paymentStatus,
        transactionId: input.transactionId,
        paidAt: input.paidAt,
      },
    });
  }

  markPaymentEventProcessed(idempotencyKey: string) {
    return this.prisma.paymentEvent.update({
      where: { idempotencyKey },
      data: { processed: true },
    });
  }
}
