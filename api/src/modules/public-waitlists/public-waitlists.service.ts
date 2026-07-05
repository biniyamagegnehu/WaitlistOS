import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BrandingService } from '../branding/branding.service';
import { WidgetsService } from '../widgets/widgets.service';

@Injectable()
export class PublicWaitlistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandingService: BrandingService,
    private readonly widgetsService: WidgetsService,
  ) {}

  async findBySlug(slug: string) {
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug },
      include: {
        branding: {
          include: { logo: true },
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
        },
        branding: this.brandingService.formatPublicBranding(waitlist.branding),
        hostedPage: widgetMetadata.hostedPage,
        widget: this.widgetsService.formatWidget(waitlist.widget),
      },
    };
  }
}
