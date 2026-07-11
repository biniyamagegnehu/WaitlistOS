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
        },
        branding: this.brandingService.formatPublicBranding(waitlist.branding),
        hostedPage: widgetMetadata.hostedPage,
        widget,
      },
    };
  }
}
