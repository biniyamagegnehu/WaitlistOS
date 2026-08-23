import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AffiliateStatus,
  AffiliateCommissionStatus,
  PaymentProvider,
  PaymentAccountStatus,
  AffiliateAttributionStatus,
  Prisma,
} from '@prisma/client';

import { randomBytes } from 'crypto';
import {
  AFFILIATE_DEFAULT_COMMISSION_RATE,
  AFFILIATE_COMMISSION_DURATION_MONTHS,
  AFFILIATE_ATTRIBUTION_COOKIE_DAYS,
} from './affiliate.constants';

@Injectable()
export class AffiliatesService {
  private readonly logger = new Logger(AffiliatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Internal Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Find the Founder record from userId, or throw.
   */
  private async getFounderByUserId(userId: string) {
    const founder = await this.prisma.founder.findUnique({ where: { userId } });
    if (!founder) throw new NotFoundException('Founder profile not found');
    return founder;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = randomBytes(5).toString('hex').toUpperCase(); // 10 chars
      const exists = await this.prisma.affiliate.findUnique({ where: { code } });
      if (!exists) return code;
    }
    throw new ConflictException('Failed to generate unique affiliate code');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Affiliate Account
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get or auto-create an Affiliate record for the authenticated founder.
   * Every founder can participate in the affiliate program.
   */
  async getOrCreateAffiliate(userId: string) {
    const founder = await this.getFounderByUserId(userId);

    const existing = await this.prisma.affiliate.findUnique({
      where: { founderId: founder.id },
    });
    if (existing) return existing;

    const code = await this.generateUniqueCode();

    const affiliate = await this.prisma.affiliate.create({
      data: {
        founderId: founder.id,
        code,
        status: AffiliateStatus.ACTIVE,
        commissionRate: new Prisma.Decimal(AFFILIATE_DEFAULT_COMMISSION_RATE),
        commissionDurationMonths: AFFILIATE_COMMISSION_DURATION_MONTHS,
      },
    });

    this.logger.log(`Created affiliate ${affiliate.id} for founder ${founder.id} with code ${code}`);
    return affiliate;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Click Tracking (Public)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Record a click on the affiliate's single canonical link.
   * Resolves affiliate purely by their `code`.
   */
  async trackClick(
    refCode: string,
    options: {
      sessionToken?: string;
      ipHash?: string;
      deviceType?: string;
      countryCode?: string;
    },
  ): Promise<{ clickId: string; affiliateCode: string } | null> {
    const affiliate = await this.prisma.affiliate.findUnique({ where: { code: refCode } });
    if (!affiliate || affiliate.status !== AffiliateStatus.ACTIVE) {
      this.logger.warn(`Click tracking: unknown or inactive ref code ${refCode}`);
      return null;
    }

    const click = await this.prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        sessionToken: options.sessionToken ?? null,
        ipHash: options.ipHash ?? null,
        deviceType: options.deviceType ?? null,
        countryCode: options.countryCode ?? null,
      },
    });

    // Increment the canonical click count on the affiliate record
    await this.prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { clickCount: { increment: 1 } },
    });

    return { clickId: click.id, affiliateCode: refCode };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Founder Attribution (Called During Signup)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Attempt to attribute a newly registered founder to an affiliate.
   *
   * Attribution policy (30-day last-valid-affiliate):
   * - The affiliate must be ACTIVE.
   * - The cookie must not be expired (30 days from click).
   * - The new founder must NOT be the affiliate themselves (anti-self-referral).
   * - The founder must not have an existing attribution.
   */
  async attributeFounderToAffiliate(
    newFounderId: string,
    affiliateCode: string,
    clickId?: string,
  ): Promise<void> {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { code: affiliateCode },
    });

    if (!affiliate || affiliate.status !== AffiliateStatus.ACTIVE) {
      this.logger.log(`Attribution skipped: affiliate with code ${affiliateCode} not found or inactive`);
      return;
    }

    // Anti-self-referral: the new founder must not BE the affiliate
    if (affiliate.founderId === newFounderId) {
      this.logger.warn(`Attribution blocked: self-referral attempt by founder ${newFounderId}`);
      return;
    }

    // Check if already attributed
    const existing = await this.prisma.affiliateAttribution.findUnique({
      where: { referredFounderId: newFounderId },
    });
    if (existing) {
      this.logger.log(`Attribution skipped: founder ${newFounderId} already has an attribution`);
      return;
    }

    // Validate click is not expired
    if (clickId) {
      const click = await this.prisma.affiliateClick.findUnique({ where: { id: clickId } });
      if (click) {
        const clickAge = Date.now() - click.createdAt.getTime();
        const maxAge = AFFILIATE_ATTRIBUTION_COOKIE_DAYS * 24 * 60 * 60 * 1000;
        if (clickAge > maxAge) {
          this.logger.log(`Attribution skipped: click ${clickId} is older than 30 days`);
          return;
        }
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + AFFILIATE_ATTRIBUTION_COOKIE_DAYS);

    try {
      await this.prisma.affiliateAttribution.create({
        data: {
          affiliateId: affiliate.id,
          referredFounderId: newFounderId,
          affiliateClickId: clickId ?? null,
          status: AffiliateAttributionStatus.ACTIVE,
          expiresAt,
        },
      });
      this.logger.log(`Attribution created: founder ${newFounderId} → affiliate ${affiliate.id}`);
    } catch (err: any) {
      // Unique constraint on referredFounderId — safe to swallow
      if (err.code === 'P2002') {
        this.logger.log(`Attribution conflict for founder ${newFounderId} — already attributed`);
      } else {
        throw err;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Dashboard / Stats
  // ─────────────────────────────────────────────────────────────────────────────

  async getDashboard(userId: string) {
    const founder = await this.getFounderByUserId(userId);

    // Auto-create affiliate on first access
    let affiliate = await this.prisma.affiliate.findUnique({
      where: { founderId: founder.id },
    });
    if (!affiliate) {
      affiliate = await this.getOrCreateAffiliate(userId);
    }

    // Get the founder's central payment accounts
    const paymentAccounts = await this.prisma.paymentAccount.findMany({
      where: { founderId: founder.id },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate commission totals
    const commissions = await this.prisma.affiliateCommission.groupBy({
      by: ['status'],
      where: { affiliateId: affiliate.id },
      _sum: { amount: true },
      _count: { id: true },
    });

    const toAmount = (status: AffiliateCommissionStatus): number => {
      const g = commissions.find((c) => c.status === status);
      return Number(g?._sum.amount ?? 0);
    };

    const totalEarned = toAmount(AffiliateCommissionStatus.ELIGIBLE) + toAmount(AffiliateCommissionStatus.PAID);
    const pendingBalance = toAmount(AffiliateCommissionStatus.PENDING);
    const eligibleBalance = toAmount(AffiliateCommissionStatus.ELIGIBLE);
    const paidOut = toAmount(AffiliateCommissionStatus.PAID);

    const referredCount = await this.prisma.affiliateAttribution.count({ where: { affiliateId: affiliate.id } });
    const convertedCount = await this.prisma.affiliateConversion.count({ where: { affiliateId: affiliate.id } });

    // Recent commissions
    const recentCommissions = await this.prisma.affiliateCommission.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Recent payouts
    const recentPayouts = await this.prisma.affiliatePayout.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Conversions
    const conversions = await this.prisma.affiliateConversion.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { convertedAt: 'desc' },
      take: 20,
    });

    return {
      affiliate: {
        id: affiliate.id,
        code: affiliate.code,
        status: affiliate.status,
        commissionRate: Number(affiliate.commissionRate),
        commissionDurationMonths: affiliate.commissionDurationMonths,
        clickCount: affiliate.clickCount,
        preferredPayoutProvider: affiliate.preferredPayoutProvider,
      },
      stats: {
        totalEarned,
        pendingBalance,
        eligibleBalance,
        paidOut,
        referredCount,
        convertedCount,
        conversionRate: referredCount > 0 ? ((convertedCount / referredCount) * 100).toFixed(1) : '0.0',
      },
      paymentAccounts: paymentAccounts.map((pa) => ({
        id: pa.id,
        provider: pa.provider,
        status: pa.status,
        providerAccountId: pa.providerAccountId,
        isEligible: pa.status === PaymentAccountStatus.ACTIVE || pa.status === PaymentAccountStatus.RESTRICTED,
      })),
      recentCommissions,
      recentPayouts,
      conversions,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Payout Preference
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Set the affiliate's preferred payout provider.
   * The provider must be connected in the founder's central Payment Settings.
   */
  async setPreferredPayoutProvider(userId: string, provider: PaymentProvider) {
    const founder = await this.getFounderByUserId(userId);
    const affiliate = await this.prisma.affiliate.findUnique({ where: { founderId: founder.id } });
    if (!affiliate) throw new NotFoundException('Affiliate account not found');

    // Validate the provider is actually connected
    const paymentAccount = await this.prisma.paymentAccount.findUnique({
      where: { founderId_provider: { founderId: founder.id, provider } },
    });

    if (!paymentAccount || (
      paymentAccount.status !== PaymentAccountStatus.ACTIVE &&
      paymentAccount.status !== PaymentAccountStatus.RESTRICTED
    )) {
      throw new NotFoundException(
        `Provider ${provider} is not connected. Please connect it in Payment Settings first.`,
      );
    }

    await this.prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { preferredPayoutProvider: provider },
    });

    return { success: true, preferredPayoutProvider: provider };
  }

  /**
   * Find affiliate by code (for click tracking, public).
   */
  async findAffiliateByCode(code: string) {
    return this.prisma.affiliate.findUnique({ where: { code } });
  }
}
