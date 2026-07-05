import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DEFAULT_BRANDING } from '../branding/constants/branding.defaults';
import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { BrandingService } from '../branding/branding.service';
import { WidgetsService } from '../widgets/widgets.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { SlugService } from './services/slug.service';

@Injectable()
export class WaitlistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly brandingService: BrandingService,
    private readonly widgetsService: WidgetsService,
    private readonly slugService: SlugService,
  ) {}

  async create(createWaitlistDto: CreateWaitlistDto, userId: string) {
    const founder = await this.getFounderByUserId(userId);

    await this.filesService.assertOwnership(createWaitlistDto.logoId, userId);

    const slug = await this.slugService.generateUniqueSlug(createWaitlistDto.name);

    const waitlist = await this.prisma.$transaction(async (tx) => {
      const createdWaitlist = await tx.waitlist.create({
        data: {
          founderId: founder.id,
          name: createWaitlistDto.name,
          tagline: createWaitlistDto.tagline,
          description: createWaitlistDto.description ?? null,
          slug,
          logoId: createWaitlistDto.logoId,
        },
        include: {
          logo: true,
        },
      });

      await tx.branding.create({
        data: {
          waitlistId: createdWaitlist.id,
          logoId: createWaitlistDto.logoId,
          ...DEFAULT_BRANDING,
        },
      });

      const widgetMetadata = this.widgetsService.buildMetadata(slug);

      await tx.widget.create({
        data: {
          waitlistId: createdWaitlist.id,
          scriptUrl: widgetMetadata.scriptUrl,
          embedCode: widgetMetadata.embedCode,
        },
      });

      return createdWaitlist;
    });

    const branding = await this.brandingService.findByWaitlistId(waitlist.id);
    const widget = await this.prisma.widget.findUnique({
      where: { waitlistId: waitlist.id },
    });
    const widgetMetadata = this.widgetsService.buildMetadata(waitlist.slug);

    return this.formatWaitlistResponse(waitlist, branding, widget, widgetMetadata.hostedPage);
  }

  async update(waitlistId: string, dto: UpdateWaitlistDto, userId: string) {
    const founder = await this.getFounderByUserId(userId);
    const waitlist = await this.findOwnedWaitlist(waitlistId, founder.id);

    if (dto.logoId) {
      await this.filesService.assertOwnership(dto.logoId, userId);
    }

    let slug = waitlist.slug;

    if (dto.slug && dto.slug !== waitlist.slug) {
      const slugAvailable = await this.slugService.isSlugAvailable(
        dto.slug,
        waitlist.id,
      );
      if (!slugAvailable) {
        throw new ConflictException('Slug is already taken');
      }
      slug = dto.slug;
    } else if (dto.name && dto.name !== waitlist.name && !dto.slug) {
      slug = await this.slugService.generateUniqueSlug(dto.name, waitlist.id);
    }

    const updatedWaitlist = await this.prisma.$transaction(async (tx) => {
      const result = await tx.waitlist.update({
        where: { id: waitlist.id },
        data: {
          name: dto.name ?? waitlist.name,
          tagline: dto.tagline ?? waitlist.tagline,
          description: dto.description ?? waitlist.description,
          logoId: dto.logoId ?? waitlist.logoId,
          slug,
        },
        include: { logo: true },
      });

      if (dto.logoId) {
        await tx.branding.updateMany({
          where: { waitlistId: waitlist.id },
          data: { logoId: dto.logoId },
        });
      }

      if (slug !== waitlist.slug) {
        const widgetMetadata = this.widgetsService.buildMetadata(slug);
        await tx.widget.update({
          where: { waitlistId: waitlist.id },
          data: {
            scriptUrl: widgetMetadata.scriptUrl,
            embedCode: widgetMetadata.embedCode,
          },
        });
      }

      return result;
    });

    const branding = await this.brandingService.findByWaitlistId(updatedWaitlist.id);
    const widget = await this.prisma.widget.findUnique({
      where: { waitlistId: updatedWaitlist.id },
    });
    const widgetMetadata = this.widgetsService.buildMetadata(updatedWaitlist.slug);

    return this.formatWaitlistResponse(
      updatedWaitlist,
      branding,
      widget,
      widgetMetadata.hostedPage,
    );
  }

  async remove(waitlistId: string, userId: string) {
    const founder = await this.getFounderByUserId(userId);
    await this.findOwnedWaitlist(waitlistId, founder.id);

    await this.prisma.waitlist.delete({ where: { id: waitlistId } });

    return {
      success: true,
      message: 'Waitlist deleted successfully',
      data: {},
    };
  }

  async findOne(slug: string) {
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug },
    });

    if (!waitlist) {
      throw new NotFoundException(`Waitlist with slug ${slug} not found`);
    }

    return waitlist;
  }

  async findOwnedWaitlistOrThrow(waitlistId: string, userId: string) {
    const founder = await this.getFounderByUserId(userId);
    return this.findOwnedWaitlist(waitlistId, founder.id);
  }

  private async getFounderByUserId(userId: string) {
    const founder = await this.prisma.founder.findUnique({
      where: { userId },
    });

    if (!founder) {
      throw new NotFoundException('Founder profile not found');
    }

    return founder;
  }

  private async findOwnedWaitlist(waitlistId: string, founderId: string) {
    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId },
      include: { logo: true },
    });

    if (!waitlist) {
      throw new NotFoundException(
        `Waitlist ${waitlistId} not found or not owned by this founder`,
      );
    }

    return waitlist;
  }

  private formatWaitlistResponse(
    waitlist: {
      id: string;
      name: string;
      tagline: string;
      slug: string;
    },
    branding: Awaited<ReturnType<BrandingService['findByWaitlistId']>>,
    widget: { scriptUrl: string; embedCode: string } | null,
    hostedPage: string,
  ) {
    return {
      success: true,
      data: {
        waitlist: {
          id: waitlist.id,
          name: waitlist.name,
          tagline: waitlist.tagline,
          slug: waitlist.slug,
        },
        branding: this.brandingService.formatPublicBranding(branding),
        hostedPage,
        widget: this.widgetsService.formatWidget(widget),
      },
    };
  }
}
