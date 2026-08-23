import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AffiliateAttributionStatus,
  AffiliateConversionStatus,
  SubscriptionPlanCode,
  Prisma,
} from '@prisma/client';

import { AffiliatePayoutsService } from './affiliate-payouts.service';
import { AFFILIATE_COMMISSION_DURATION_MONTHS } from '../affiliate.constants';

@Injectable()
export class AffiliateCommissionEngine {
  private readonly logger = new Logger(AffiliateCommissionEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payoutsService: AffiliatePayoutsService,
  ) {}

  /**
   * Called after a subscription payment is confirmed.
   *
   * Checks if the paying founder is attributed to an affiliate,
   * validates commission eligibility windows, and creates a commission.
   *
   * Rules:
   * - Only PAID plan payments generate commissions (no FREE plan).
   * - Attribution must be ACTIVE and within 12 months of first conversion.
   * - Only one commission per unique paymentId (idempotent).
   * - The payment must not be a test/zero-value transaction.
   */
  async handleSubscriptionPayment(params: {
    payingFounderId: string;
    paymentId: string;
    amount: Prisma.Decimal;
    currency: string;
    planCode: SubscriptionPlanCode;
  }): Promise<void> {
    const { payingFounderId, paymentId, amount, currency, planCode } = params;

    // No commissions for free plan
    if (planCode === SubscriptionPlanCode.FREE) {
      return;
    }

    // No commissions for zero-value payments
    if (amount.lessThanOrEqualTo(0)) {
      return;
    }

    // Find the attribution for this founder
    const attribution = await this.prisma.affiliateAttribution.findUnique({
      where: { referredFounderId: payingFounderId },
      include: { affiliate: true },
    });

    if (!attribution || attribution.status !== AffiliateAttributionStatus.ACTIVE) {
      return; // Founder not attributed to any affiliate
    }

    // Check the affiliate is still active
    if (attribution.affiliate.status !== 'ACTIVE') {
      this.logger.log(`Affiliate ${attribution.affiliateId} is not active, skipping commission`);
      return;
    }

    // Check commission duration window (12 months from first conversion)
    const firstConversion = await this.prisma.affiliateConversion.findFirst({
      where: {
        affiliateId: attribution.affiliateId,
        referredFounderId: payingFounderId,
      },
      orderBy: { convertedAt: 'asc' },
    });

    if (firstConversion) {
      const windowEnd = new Date(firstConversion.convertedAt);
      windowEnd.setMonth(windowEnd.getMonth() + AFFILIATE_COMMISSION_DURATION_MONTHS);
      if (new Date() > windowEnd) {
        this.logger.log(
          `Commission window expired for founder ${payingFounderId} (first conversion: ${firstConversion.convertedAt.toISOString()})`,
        );
        return;
      }
    }

    // Ensure conversion record exists (or create it)
    let conversion = await this.prisma.affiliateConversion.findUnique({
      where: { sourcePaymentId: paymentId },
    });

    if (!conversion) {
      conversion = await this.prisma.affiliateConversion.create({
        data: {
          affiliateId: attribution.affiliateId,
          referredFounderId: payingFounderId,
          attributionId: attribution.id,
          sourcePaymentId: paymentId,
          status: AffiliateConversionStatus.CONFIRMED,
        },
      });

      // Mark attribution as converted on first conversion
      if (!firstConversion) {
        await this.prisma.affiliateAttribution.update({
          where: { id: attribution.id },
          data: { status: AffiliateAttributionStatus.CONVERTED },
        });
      }
    }

    // Calculate commission using Decimal (no floating point)
    const commissionRate = attribution.affiliate.commissionRate;
    const commissionAmount = amount.mul(commissionRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);

    // Create the commission (idempotent by sourcePaymentId)
    await this.payoutsService.createCommission({
      affiliateId: attribution.affiliateId,
      referredFounderId: payingFounderId,
      conversionId: conversion.id,
      sourcePaymentId: paymentId,
      amount: commissionAmount,
      currency,
      commissionRate,
    });

    this.logger.log(
      `Commission generated: ${commissionAmount} ${currency} (rate: ${commissionRate}) for affiliate ${attribution.affiliateId}`,
    );
  }

  /**
   * Called when a subscription payment is refunded.
   * Reverses the corresponding commission without destroying historical data.
   */
  async handlePaymentRefund(paymentId: string): Promise<void> {
    await this.payoutsService.reverseCommissionForPayment(paymentId);
  }
}
