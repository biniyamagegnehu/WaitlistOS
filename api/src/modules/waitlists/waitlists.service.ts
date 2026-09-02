import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DEFAULT_BRANDING } from '../branding/constants/branding.defaults';
import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { BrandingService } from '../branding/branding.service';
import { WidgetsService } from '../widgets/widgets.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { SlugService } from './services/slug.service';
import { PaymentService } from '../payments/payment.service';
import { defaultPageConfig, upgradePageConfig, validatePageConfig, createConfigFromOriginal } from './page-config';
import { Prisma, PaymentAccountStatus, PaymentProvider } from '@prisma/client';

@Injectable()
export class WaitlistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly brandingService: BrandingService,
    private readonly widgetsService: WidgetsService,
    private readonly slugService: SlugService,
    private readonly paymentService: PaymentService,
  ) {}

  async create(createWaitlistDto: CreateWaitlistDto, userId: string) {
    await this.paymentService.assertCanCreateWaitlist(userId);
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

    // ── Skip the Line Validation ─────────────────────────────
    if (dto.skipLineEnabled && !waitlist.skipLineEnabled) {
      // Enabling Skip the Line - check payment account
      const paymentAccount = await this.prisma.paymentAccount.findFirst({
        where: {
          founderId: founder.id,
          status: PaymentAccountStatus.ACTIVE,
        },
      });

      if (!paymentAccount) {
        throw new BadRequestException(
          'Skip the Line requires a connected payment account. Please connect Stripe or Chapa in Settings first.',
        );
      }

      // Validate price if provided
      if (dto.skipLinePrice !== undefined && dto.skipLinePrice <= 0) {
        throw new BadRequestException('Skip the Line price must be greater than 0');
      }

      // Normalize currency to uppercase if provided
      if (dto.skipLineCurrency !== undefined) {
        dto.skipLineCurrency = dto.skipLineCurrency.toUpperCase();
      }
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
          ...(dto.doubleSidedRewardsEnabled !== undefined && { doubleSidedRewardsEnabled: dto.doubleSidedRewardsEnabled }),
          ...(dto.referrerRankingBonus !== undefined && { referrerRankingBonus: dto.referrerRankingBonus }),
          ...(dto.newParticipantRankingBonus !== undefined && { newParticipantRankingBonus: dto.newParticipantRankingBonus }),
          ...(dto.streakBonusesEnabled !== undefined && { streakBonusesEnabled: dto.streakBonusesEnabled }),
          ...(dto.teamReferralsEnabled !== undefined && { teamReferralsEnabled: dto.teamReferralsEnabled }),
          ...(dto.maxTeamSize !== undefined && { maxTeamSize: dto.maxTeamSize }),
          ...(dto.urgencyEnabled !== undefined && { urgencyEnabled: dto.urgencyEnabled }),
          ...(dto.batchEnabled !== undefined && { batchEnabled: dto.batchEnabled }),
          ...(dto.batchName !== undefined && { batchName: dto.batchName }),
          ...(dto.batchSize !== undefined && { batchSize: dto.batchSize }),
          ...(dto.batchDescription !== undefined && { batchDescription: dto.batchDescription }),
          ...(dto.countdownEnabled !== undefined && { countdownEnabled: dto.countdownEnabled }),
          ...(dto.launchDate !== undefined && { launchDate: dto.launchDate }),
          ...(dto.showRemainingSpots !== undefined && { showRemainingSpots: dto.showRemainingSpots }),
          ...(dto.showBatchProgress !== undefined && { showBatchProgress: dto.showBatchProgress }),
          ...(dto.showCountdown !== undefined && { showCountdown: dto.showCountdown }),
          ...(dto.themeMode !== undefined && { themeMode: dto.themeMode }),
          // ── Skip the Line Configuration ─────────────────────
          ...(dto.skipLineEnabled !== undefined && { skipLineEnabled: dto.skipLineEnabled }),
          ...(dto.skipLinePrice !== undefined && { skipLinePrice: dto.skipLinePrice }),
          ...(dto.skipLineCurrency !== undefined && { skipLineCurrency: dto.skipLineCurrency?.toUpperCase() }),
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

  async getPageBuilder(waitlistId: string, userId: string) {
    const waitlist = await this.findOwnedWaitlistOrThrow(waitlistId, userId);
    const config = await this.prisma.waitlistPageConfig.findUnique({ where: { waitlistId: waitlist.id } });
    return { success: true, data: { draftConfig: config ? upgradePageConfig(config.draftConfig) : createConfigFromOriginal(waitlist, waitlist.copy), publishedConfig: config?.publishedConfig ? upgradePageConfig(config.publishedConfig) : null, version: config?.version ?? 1 } };
  }

  async updatePageBuilder(waitlistId: string, input: unknown, version: number, userId: string) {
    const waitlist = await this.findOwnedWaitlistOrThrow(waitlistId, userId);
    const config = validatePageConfig(input);
    const configJson = toPrismaJson(config);
    const existing = await this.prisma.waitlistPageConfig.findUnique({ where: { waitlistId: waitlist.id } });
    if (existing && existing.version !== version) throw new ConflictException('PAGE_CONFIG_STALE');
    const saved = existing
      ? await this.prisma.waitlistPageConfig.update({ where: { waitlistId: waitlist.id }, data: { draftConfig: configJson, version: { increment: 1 } } })
      : await this.prisma.waitlistPageConfig.create({ data: { waitlistId: waitlist.id, draftConfig: configJson } });
    return { success: true, data: { draftConfig: saved.draftConfig, publishedConfig: saved.publishedConfig, version: saved.version } };
  }

  async publishPageBuilder(waitlistId: string, version: number, userId: string) {
    const waitlist = await this.findOwnedWaitlistOrThrow(waitlistId, userId);
    const existing = await this.prisma.waitlistPageConfig.findUnique({ where: { waitlistId: waitlist.id } });
    if (!existing) throw new NotFoundException('Page configuration not found');
    if (existing.version !== version) throw new ConflictException('PAGE_CONFIG_STALE');
    const config = validatePageConfig(existing.draftConfig);
    const published = await this.prisma.waitlistPageConfig.update({ where: { waitlistId: waitlist.id }, data: { publishedConfig: toPrismaJson(config) } });
    return { success: true, data: { publishedConfig: published.publishedConfig, version: published.version } };
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
      include: { logo: true, copy: true },
    });

    if (!waitlist) {
      throw new NotFoundException(
        `Waitlist ${waitlistId} not found or not owned by this founder`,
      );
    }

    return waitlist;
  }

  /** Public helper — verify a userId owns the given waitlistId. Throws on mismatch. */
  async assertOwnership(waitlistId: string, userId: string): Promise<void> {
    const founder = await this.getFounderByUserId(userId);
    await this.findOwnedWaitlist(waitlistId, founder.id);
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

/** Page configs are validated plain JSON; this bridges the structural Prisma JSON type. */
function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
