import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_BRANDING } from './constants/branding.defaults';

export interface CreateBrandingInput {
  waitlistId: string;
  logoId?: string | null;
}

@Injectable()
export class BrandingService {
  constructor(private readonly prisma: PrismaService) {}

  async createForWaitlist(input: CreateBrandingInput) {
    return this.prisma.branding.create({
      data: {
        waitlistId: input.waitlistId,
        logoId: input.logoId ?? null,
        ...DEFAULT_BRANDING,
      },
      include: {
        logo: true,
      },
    });
  }

  async findByWaitlistId(waitlistId: string) {
    return this.prisma.branding.findUnique({
      where: { waitlistId },
      include: { logo: true },
    });
  }

  formatPublicBranding(
    branding: Awaited<ReturnType<BrandingService['findByWaitlistId']>>,
  ) {
    if (!branding) {
      return null;
    }

    return {
      logoUrl: branding.logo?.secureUrl ?? branding.logo?.url ?? null,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      backgroundColor: branding.backgroundColor,
      buttonColor: branding.buttonColor,
      font: branding.font,
    };
  }
}
