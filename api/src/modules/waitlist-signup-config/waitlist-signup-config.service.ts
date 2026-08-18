import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WaitlistsService } from '../waitlists/waitlists.service';
import { UpdateWaitlistSignupConfigDto } from './dto/update-waitlist-signup-config.dto';
import { SignupConfigValidator } from './signup-config.validator';

@Injectable()
export class WaitlistSignupConfigService {
  constructor(
    private prisma: PrismaService,
    private waitlistsService: WaitlistsService,
  ) {}

  async getConfig(waitlistId: string, userId: string) {
    await this.waitlistsService.assertOwnership(waitlistId, userId);

    let config = await this.prisma.waitlistSignupConfig.findUnique({
      where: { waitlistId },
    });

    if (!config) {
      config = await this.prisma.waitlistSignupConfig.create({
        data: {
          waitlistId,
          enabled: false,
          steps: [],
        },
      });
    }

    return { success: true, data: config };
  }

  async updateConfig(waitlistId: string, userId: string, dto: UpdateWaitlistSignupConfigDto) {
    await this.waitlistsService.assertOwnership(waitlistId, userId);

    let validatedSteps: any[] | undefined = undefined;
    if (dto.steps !== undefined) {
      validatedSteps = SignupConfigValidator.validateSteps(dto.steps);
    }

    const config = await this.prisma.waitlistSignupConfig.upsert({
      where: { waitlistId },
      create: {
        waitlistId,
        enabled: dto.enabled ?? false,
        steps: validatedSteps ?? [],
      },
      update: {
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
        ...(validatedSteps !== undefined && { steps: validatedSteps }),
      },
    });

    return { success: true, data: config };
  }
}
