import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BrandingService } from '../branding/branding.service';
import { PaymentService } from '../payments/payment.service';

const REWARD_REFERRAL_TARGET = 10;

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandingService: BrandingService,
    private readonly paymentService: PaymentService,
  ) {}

  async findByReferralCode(code: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { referralCode: code },
      include: {
        waitlist: {
          include: {
            founder: true,
            branding: {
              include: { logo: true },
            },
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('REFERRAL_NOT_FOUND');
    }

    const founderUserId = participant.waitlist.founder.userId;
    const branding = await this.resolvePublicBranding(
      founderUserId,
      participant.waitlist.branding,
    );

    const referralCount = participant.referralCount;

    return {
      success: true,
      data: {
        participant: {
          displayName: null,
          position: participant.position,
          referralCount,
          rewardProgress: {
            current: referralCount,
            target: REWARD_REFERRAL_TARGET,
            percent: Math.min(
              Math.round((referralCount / REWARD_REFERRAL_TARGET) * 100),
              100,
            ),
          },
        },
        waitlist: {
          name: participant.waitlist.name,
          tagline: participant.waitlist.tagline,
          slug: participant.waitlist.slug,
        },
        branding,
      },
    };
  }

  private async resolvePublicBranding(
    founderUserId: string,
    branding: Parameters<BrandingService['formatPublicBranding']>[0],
  ) {
    const formatted = this.brandingService.formatPublicBranding(branding);
    if (!formatted) {
      return null;
    }

    let includeCustomBranding = false;

    try {
      await this.paymentService.assertFeatureAccess(
        founderUserId,
        'CUSTOM_BRANDING',
      );
      includeCustomBranding = true;
    } catch {
      includeCustomBranding = false;
    }

    if (includeCustomBranding) {
      return formatted;
    }

    return {
      logoUrl: null,
      primaryColor: formatted.primaryColor,
      secondaryColor: formatted.secondaryColor,
      backgroundColor: formatted.backgroundColor,
      buttonColor: formatted.buttonColor,
      font: formatted.font,
    };
  }
}
