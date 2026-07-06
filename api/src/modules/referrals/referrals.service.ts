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

    try {
      await this.paymentService.assertFeatureAccess(
        participant.waitlist.founder.userId,
        'DYNAMIC_OG',
      );
    } catch {
      throw new NotFoundException('REFERRAL_NOT_FOUND');
    }

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
        branding: this.brandingService.formatPublicBranding(
          participant.waitlist.branding,
        ),
      },
    };
  }
}
