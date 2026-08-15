import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WaitlistsService } from '../waitlists/waitlists.service';
import { UpdateWaitlistSignupConfigDto } from './dto/update-waitlist-signup-config.dto';
import { BadRequestException } from '@nestjs/common';

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

    if (dto.steps) {
      this.validateStepsConfig(dto.steps);
    }

    const config = await this.prisma.waitlistSignupConfig.upsert({
      where: { waitlistId },
      create: {
        waitlistId,
        enabled: dto.enabled ?? false,
        steps: dto.steps ?? [],
      },
      update: {
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
        ...(dto.steps !== undefined && { steps: dto.steps }),
      },
    });

    return { success: true, data: config };
  }

  private validateStepsConfig(steps: any[]) {
    if (!Array.isArray(steps)) {
      throw new BadRequestException('Steps must be an array');
    }
    const stepIds = new Set<string>();
    
    for (const step of steps) {
      if (!step.id) throw new BadRequestException('Each step must have an id');
      if (stepIds.has(step.id)) throw new BadRequestException('Duplicate step id');
      stepIds.add(step.id);

      if (step.type === 'QUESTIONS' && step.fields) {
        if (!Array.isArray(step.fields)) throw new BadRequestException('Questions step fields must be an array');
        
        const fieldIds = new Set<string>();
        for (const field of step.fields) {
          if (!field.id) throw new BadRequestException('Each field must have an id');
          if (fieldIds.has(field.id)) throw new BadRequestException(`Duplicate field id: ${field.id}`);
          fieldIds.add(field.id);
          
          if (!field.type) throw new BadRequestException(`Field ${field.id} is missing a type`);
          
          if (['SINGLE_SELECT', 'MULTI_SELECT', 'DROPDOWN'].includes(field.type)) {
            if (!Array.isArray(field.options)) {
              throw new BadRequestException(`Field ${field.id} of type ${field.type} requires an options array`);
            }
          }
        }
      }
    }
  }
}
