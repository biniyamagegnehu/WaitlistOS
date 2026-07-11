import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyWaitlistOwnership(waitlistId: string, founderUserId: string) {
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: { founder: true },
    });

    if (!waitlist) {
      throw new NotFoundException('WAITLIST_NOT_FOUND');
    }

    if (waitlist.founder.userId !== founderUserId) {
      throw new ForbiddenException('FORBIDDEN');
    }

    return waitlist;
  }

  async create(waitlistId: string, founderUserId: string, dto: CreateRewardDto) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    const existing = await this.prisma.reward.findUnique({
      where: { waitlistId_milestone: { waitlistId, milestone: dto.milestone } }
    });

    if (existing) {
      throw new ConflictException('REWARD_MILESTONE_EXISTS');
    }

    return this.prisma.reward.create({
      data: {
        waitlistId,
        milestone: dto.milestone,
        type: dto.type,
        value: dto.value,
        title: dto.title,
        description: dto.description,
      },
    });
  }

  async findAll(waitlistId: string, founderUserId: string) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    return this.prisma.reward.findMany({
      where: { waitlistId },
      orderBy: { milestone: 'asc' },
      include: {
        _count: { select: { participantRewards: true } },
      },
    });
  }

  async update(id: string, waitlistId: string, founderUserId: string, dto: UpdateRewardDto) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    const reward = await this.prisma.reward.findFirst({
      where: { id, waitlistId }
    });

    if (!reward) {
      throw new NotFoundException('REWARD_NOT_FOUND');
    }

    if (dto.milestone && dto.milestone !== reward.milestone) {
       const existing = await this.prisma.reward.findUnique({
         where: { waitlistId_milestone: { waitlistId, milestone: dto.milestone } }
       });
       if (existing) {
         throw new ConflictException('REWARD_MILESTONE_EXISTS');
       }
    }

    return this.prisma.reward.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, waitlistId: string, founderUserId: string) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    const reward = await this.prisma.reward.findFirst({
      where: { id, waitlistId }
    });

    if (!reward) {
      throw new NotFoundException('REWARD_NOT_FOUND');
    }

    return this.prisma.reward.delete({
      where: { id },
    });
  }

  async getAnalytics(waitlistId: string, founderUserId: string) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    const rewards = await this.prisma.reward.findMany({
      where: { waitlistId },
      include: {
        _count: { select: { participantRewards: true } },
      },
    });

    const totalCreated = rewards.length;
    const totalUnlocked = rewards.reduce((acc, r) => acc + r._count.participantRewards, 0);
    const mostUnlocked = rewards.sort((a, b) => b._count.participantRewards - a._count.participantRewards)[0] || null;

    return {
      totalCreated,
      totalUnlocked,
      mostUnlocked: mostUnlocked ? {
        id: mostUnlocked.id,
        title: mostUnlocked.title,
        unlocks: mostUnlocked._count.participantRewards,
      } : null,
    };
  }
}
