import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AffiliateCommissionStatus,
  AffiliatePayoutStatus,
  PaymentAccountStatus,
  PaymentProvider,
  Prisma,
} from '@prisma/client';

import { StripeAffiliatePayoutProvider } from '../providers/stripe-affiliate-payout.provider';
import { ChapaAffiliatePayoutProvider } from '../providers/chapa-affiliate-payout.provider';
import { IAffiliatePayoutProvider } from '../providers/affiliate-payout-provider.interface';
import { AFFILIATE_MINIMUM_PAYOUT_AMOUNT, AFFILIATE_PAYOUT_BATCH_SIZE } from '../affiliate.constants';

export interface CommissionInput {
  affiliateId: string;
  referredFounderId: string;
  conversionId: string;
  sourcePaymentId: string;
  amount: Prisma.Decimal;
  currency: string;
  commissionRate: Prisma.Decimal;
}

@Injectable()
export class AffiliatePayoutsService {
  private readonly logger = new Logger(AffiliatePayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripePayoutProvider: StripeAffiliatePayoutProvider,
    private readonly chapaPayoutProvider: ChapaAffiliatePayoutProvider,
  ) {}

  private getProvider(provider: PaymentProvider): IAffiliatePayoutProvider {
    if (provider === PaymentProvider.STRIPE) return this.stripePayoutProvider;
    if (provider === PaymentProvider.CHAPA) return this.chapaPayoutProvider;
    throw new Error(`Unsupported payout provider: ${provider}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Commission Creation (called by PaymentService after successful subscription)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create a commission record.
   * Uses ELIGIBLE status for subscription payments.
   */
  async createCommission(input: CommissionInput): Promise<void> {
    // Idempotency: if a commission already exists for this payment, skip
    const existing = await this.prisma.affiliateCommission.findFirst({
      where: {
        sourcePaymentId: input.sourcePaymentId,
      },
    });

    if (existing) {
      this.logger.log(`Commission already exists for payment ${input.sourcePaymentId}, skipping`);
      return;
    }

    const eligibleAt = new Date();
    // Settlement window: 14 days for payment processing, verification, and fraud prevention
    eligibleAt.setDate(eligibleAt.getDate() + 14);

    await this.prisma.affiliateCommission.create({
      data: {
        affiliateId: input.affiliateId,
        referredFounderId: input.referredFounderId,
        conversionId: input.conversionId,
        sourcePaymentId: input.sourcePaymentId,
        amount: input.amount,
        currency: input.currency,
        commissionRate: input.commissionRate,
        status: AffiliateCommissionStatus.PENDING,
        eligibleAt,
      },
    });

    this.logger.log(
      `Commission created: ${input.amount} ${input.currency} for affiliate ${input.affiliateId} from payment ${input.sourcePaymentId}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Payout Processing
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Daily job to clear PENDING commissions that have passed their eligibleAt date.
   * Commissions move from PENDING to ELIGIBLE after the 14-day settlement window.
   */
  async processSettlements(): Promise<{ cleared: number }> {
    const result = await this.prisma.affiliateCommission.updateMany({
      where: {
        status: AffiliateCommissionStatus.PENDING,
        eligibleAt: { lte: new Date() },
      },
      data: {
        status: AffiliateCommissionStatus.ELIGIBLE,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Settled ${result.count} pending commissions to ELIGIBLE`);
    }

    return { cleared: result.count };
  }

  async getEligibleBalance(affiliateId: string): Promise<{ amount: Prisma.Decimal; currency: string }> {
    // Verify affiliate is active before calculating balance
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: { status: true },
    });

    if (!affiliate || affiliate.status !== 'ACTIVE') {
      this.logger.warn(`Eligible balance requested for inactive/non-existent affiliate ${affiliateId}`);
      return { amount: new Prisma.Decimal(0), currency: 'USD' };
    }

    const result = await this.prisma.affiliateCommission.aggregate({
      where: {
        affiliateId,
        status: AffiliateCommissionStatus.ELIGIBLE,
        payoutId: null,
      },
      _sum: { amount: true },
    });

    const amount = result._sum.amount ?? new Prisma.Decimal(0);

    const first = await this.prisma.affiliateCommission.findFirst({
      where: { 
        affiliateId, 
        status: AffiliateCommissionStatus.ELIGIBLE,
      },
    });

    this.logger.log(`Eligible balance for affiliate ${affiliateId}: ${amount} ${first?.currency ?? 'USD'}`);

    return { amount, currency: first?.currency ?? 'USD' };
  }

  /**
   * Monthly payout processing.
   * Now uses the founder's central PaymentAccount (not a separate AffiliatePayoutAccount).
   * Respects the affiliate's preferredPayoutProvider; falls back to any ACTIVE account.
   */
  async processMonthlyPayouts(): Promise<{
    attempted: number;
    succeeded: number;
    failed: number;
    skipped: number;
  }> {
    const periodStart = this.getMonthStart(new Date());
    const periodEnd = this.getMonthEnd(new Date());

    let attempted = 0;
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    let cursor: string | undefined;

    while (true) {
      const affiliates = await this.prisma.affiliate.findMany({
        take: AFFILIATE_PAYOUT_BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        where: {
          status: 'ACTIVE',
          commissions: {
            some: {
              status: AffiliateCommissionStatus.ELIGIBLE,
              payoutId: null,
            },
          },
        },
        include: { founder: true },
        orderBy: { id: 'asc' },
      });

      if (affiliates.length === 0) break;
      cursor = affiliates[affiliates.length - 1].id;

      for (const affiliate of affiliates) {
        attempted++;

        const idempotencyKey = `payout:${affiliate.id}:${periodStart.toISOString().slice(0, 7)}`;

        const existingPayout = await this.prisma.affiliatePayout.findUnique({
          where: { idempotencyKey },
        });
        if (existingPayout) {
          skipped++;
          continue;
        }

        // ── Resolve payout account from central PaymentAccount ──
        const founder = affiliate.founder;
        const paymentAccounts = await this.prisma.paymentAccount.findMany({
          where: {
            founderId: founder.id,
            status: { in: [PaymentAccountStatus.ACTIVE, PaymentAccountStatus.RESTRICTED] },
          },
        });

        if (paymentAccounts.length === 0) {
          skipped++;
          this.logger.log(`Affiliate ${affiliate.id}: No eligible payment account connected, skipping payout`);
          continue;
        }

        // Prefer their chosen provider; fall back to first eligible
        const paymentAccount =
          paymentAccounts.find((pa) => pa.provider === affiliate.preferredPayoutProvider) ??
          paymentAccounts[0];

        this.logger.log(`Affiliate ${affiliate.id}: Using payment account ${paymentAccount.provider} (${paymentAccount.id}) for payout`);

        const { amount, currency } = await this.getEligibleBalance(affiliate.id);

        const minimumThreshold = new Prisma.Decimal(AFFILIATE_MINIMUM_PAYOUT_AMOUNT);
        if (amount.lessThan(minimumThreshold)) {
          skipped++;
          this.logger.log(
            `Affiliate ${affiliate.id}: balance ${amount} ${currency} below threshold ${minimumThreshold} ${currency}, skipping payout`,
          );
          continue;
        }

        const provider = this.getProvider(paymentAccount.provider);

        this.logger.log(`Affiliate ${affiliate.id}: Initiating payout of ${amount} ${currency} via ${paymentAccount.provider}`);

        const payout = await this.prisma.$transaction(async (tx) => {
          const p = await tx.affiliatePayout.create({
            data: {
              affiliateId: affiliate.id,
              payoutAccountId: paymentAccount.id,
              provider: paymentAccount.provider,
              amount,
              currency,
              status: AffiliatePayoutStatus.PROCESSING,
              periodStart,
              periodEnd,
              idempotencyKey,
            },
          });

          await tx.affiliateCommission.updateMany({
            where: {
              affiliateId: affiliate.id,
              status: AffiliateCommissionStatus.ELIGIBLE,
              payoutId: null,
            },
            data: { payoutId: p.id },
          });

          this.logger.log(`Affiliate ${affiliate.id}: Created payout record ${p.id} and linked ${p.idempotencyKey} commissions`);

          return p;
        });

        try {
          const result = await provider.initiatePayout(amount.toFixed(2), currency, idempotencyKey, {
            providerAccountId: paymentAccount.providerAccountId!,
            currency,
            metadata: paymentAccount.metadata as Record<string, unknown> | undefined,
          });

          this.logger.log(`Affiliate ${affiliate.id}: Payout result - status: ${result.status}, transactionId: ${result.providerTransactionId || 'none'}`);

          if (result.status === 'PAID' || result.status === 'PROCESSING') {
            await this.prisma.$transaction(async (tx) => {
              await tx.affiliatePayout.update({
                where: { id: payout.id },
                data: {
                  status: result.status === 'PAID' ? AffiliatePayoutStatus.PAID : AffiliatePayoutStatus.PROCESSING,
                  providerTransactionId: result.providerTransactionId,
                  processedAt: result.status === 'PAID' ? new Date() : null,
                },
              });

              if (result.status === 'PAID') {
                await tx.affiliateCommission.updateMany({
                  where: { payoutId: payout.id },
                  data: {
                    status: AffiliateCommissionStatus.PAID,
                    paidAt: new Date(),
                  },
                });
                this.logger.log(`Affiliate ${affiliate.id}: Marked ${payout.id} as PAID and updated commissions`);
              }
            });

            succeeded++;
            this.logger.log(`Affiliate ${affiliate.id}: Payout ${result.status} successfully`);
          } else {
            await this.prisma.$transaction(async (tx) => {
              await tx.affiliatePayout.update({
                where: { id: payout.id },
                data: {
                  status: AffiliatePayoutStatus.FAILED,
                  failureReason: result.failureReason,
                },
              });
              await tx.affiliateCommission.updateMany({
                where: { payoutId: payout.id },
                data: { payoutId: null },
              });
            });

            failed++;
            this.logger.error(`Affiliate ${affiliate.id}: Payout failed with status '${result.status}': ${result.failureReason}`);
          }
        } catch (err: any) {
          await this.prisma.$transaction(async (tx) => {
            await tx.affiliatePayout.update({
              where: { id: payout.id },
              data: {
                status: AffiliatePayoutStatus.FAILED,
                failureReason: err.message,
              },
            });
            await tx.affiliateCommission.updateMany({
              where: { payoutId: payout.id },
              data: { payoutId: null },
            });
          });

          failed++;
          this.logger.error(`Affiliate ${affiliate.id}: Payout exception: ${err.message}`, err.stack);
        }
      }

      if (affiliates.length < AFFILIATE_PAYOUT_BATCH_SIZE) break;
    }

    return { attempted, succeeded, failed, skipped };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private getMonthStart(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  private getMonthEnd(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59));
  }
}
