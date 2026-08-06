import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BrandingService } from '../branding/branding.service';
import { WidgetsService } from '../widgets/widgets.service';
import { PaymentService } from '../payments/payment.service';

@Injectable()
export class PublicWaitlistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandingService: BrandingService,
    private readonly widgetsService: WidgetsService,
    private readonly paymentService: PaymentService,
  ) {}

  async findBySlug(slug: string) {
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug },
      include: {
        founder: true,
        branding: {
          include: { logo: true },
        },
        rewards: {
          orderBy: { milestone: 'asc' },
        },
        widget: true,
        _count: {
          select: { participants: true },
        },
        copy: true,
        teamRewardMilestones: {
          orderBy: { milestone: 'asc' },
        },
        teams: {
          include: {
            members: { select: { referralCount: true } },
            _count: { select: { members: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!waitlist) {
      throw new NotFoundException(`Waitlist with slug ${slug} not found`);
    }

    const widgetMetadata = this.widgetsService.buildMetadata(waitlist.slug);
    let widget = this.widgetsService.formatWidget(waitlist.widget);

    try {
      await this.paymentService.assertFeatureAccess(
        waitlist.founder.userId,
        'EMBED_WIDGET',
      );
    } catch {
      widget = null;
    }

    return {
      success: true,
      data: {
        waitlist: {
          id: waitlist.id,
          name: waitlist.name,
          tagline: waitlist.tagline,
          description: waitlist.description,
          slug: waitlist.slug,
          participantCount: waitlist._count.participants,
          rewards: waitlist.rewards.map(r => ({
            id: r.id,
            milestone: r.milestone,
            type: r.type,
            value: r.value,
            title: r.title,
            description: r.description,
          })),
          teamReferralsEnabled: waitlist.teamReferralsEnabled,
          maxTeamSize: waitlist.maxTeamSize,
          teamMilestones: waitlist.teamRewardMilestones.map((m) => ({
            id: m.id,
            milestone: m.milestone,
            type: m.type,
            value: m.value,
            title: m.title,
          })),
          urgencyEnabled: waitlist.urgencyEnabled,
          batchEnabled: waitlist.batchEnabled,
          batchName: waitlist.batchName,
          batchSize: waitlist.batchSize,
          batchDescription: waitlist.batchDescription,
          countdownEnabled: waitlist.countdownEnabled,
          launchDate: waitlist.launchDate,
          showRemainingSpots: waitlist.showRemainingSpots,
          showBatchProgress: waitlist.showBatchProgress,
          showCountdown: waitlist.showCountdown,
        },
        teamLeaderboard: waitlist.teamReferralsEnabled
          ? waitlist.teams
              .map((t) => ({
                id: t.id,
                name: t.name,
                memberCount: t._count.members,
                totalReferrals: t.members.reduce((sum, m) => sum + m.referralCount, 0),
                createdAt: t.createdAt,
              }))
              .sort((a, b) => {
                if (b.totalReferrals !== a.totalReferrals)
                  return b.totalReferrals - a.totalReferrals;
                return a.createdAt.getTime() - b.createdAt.getTime();
              })
              .map((t, i) => ({ ...t, rank: i + 1 }))
          : [],
        branding: this.brandingService.formatPublicBranding(waitlist.branding),
        hostedPage: widgetMetadata.hostedPage,
        widget,
        copy: waitlist.copy ? {
          headline: waitlist.copy.headline,
          subheadline: waitlist.copy.subheadline,
          cta: waitlist.copy.cta,
          features: waitlist.copy.features,
          faqs: waitlist.copy.faqs,
        } : null,
      },
    };
  }
}
