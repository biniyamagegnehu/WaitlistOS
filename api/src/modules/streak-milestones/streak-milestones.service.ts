import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStreakMilestoneDto } from './dto/create-streak-milestone.dto';
import { UpdateStreakMilestoneDto } from './dto/update-streak-milestone.dto';

@Injectable()
export class StreakMilestonesService {
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

  async create(waitlistId: string, founderUserId: string, dto: CreateStreakMilestoneDto) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    const existing = await this.prisma.streakMilestone.findUnique({
      where: { waitlistId_days: { waitlistId, days: dto.days } },
    });

    if (existing) {
      throw new ConflictException('STREAK_MILESTONE_EXISTS');
    }

    return this.prisma.streakMilestone.create({
      data: {
        waitlistId,
        days: dto.days,
        type: dto.type,
        value: dto.value,
        title: dto.title,
        description: dto.description,
      },
    });
  }

  async findAll(waitlistId: string, founderUserId: string) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    return this.prisma.streakMilestone.findMany({
      where: { waitlistId },
      orderBy: { days: 'asc' },
      include: {
        _count: { select: { participantStreakRewards: true } },
      },
    });
  }

  async getAnalytics(waitlistId: string, founderUserId: string) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    const milestones = await this.prisma.streakMilestone.findMany({
      where: { waitlistId },
      include: {
        _count: { select: { participantStreakRewards: true } },
      },
      orderBy: { days: 'asc' },
    });

    // Participants with active streak (currentStreak > 0)
    const activeStreakers = await this.prisma.participant.count({
      where: { waitlistId, currentStreak: { gt: 0 } },
    });

    // Longest current streak
    const longestCurrentStreakResult = await this.prisma.participant.findFirst({
      where: { waitlistId },
      orderBy: { currentStreak: 'desc' },
      select: { currentStreak: true, email: true },
    });

    // Longest all-time streak
    const longestAllTimeResult = await this.prisma.participant.findFirst({
      where: { waitlistId },
      orderBy: { longestStreak: 'desc' },
      select: { longestStreak: true, email: true },
    });

    // Total streak rewards unlocked
    const totalRewardsUnlocked = await this.prisma.participantStreakReward.count({
      where: { streakMilestone: { waitlistId } },
    });

    // Most popular milestone
    const mostPopular = milestones.reduce(
      (prev, curr) =>
        curr._count.participantStreakRewards > (prev?._count?.participantStreakRewards ?? -1) ? curr : prev,
      null as (typeof milestones)[0] | null,
    );

    return {
      activeStreakers,
      longestCurrentStreak: longestCurrentStreakResult?.currentStreak ?? 0,
      longestCurrentStreakEmail: longestCurrentStreakResult?.email ?? null,
      longestAllTimeStreak: longestAllTimeResult?.longestStreak ?? 0,
      longestAllTimeStreakEmail: longestAllTimeResult?.email ?? null,
      totalRewardsUnlocked,
      mostPopularMilestoneDays: mostPopular?.days ?? null,
      milestones: milestones.map((m) => ({
        id: m.id,
        days: m.days,
        type: m.type,
        value: m.value,
        title: m.title,
        description: m.description,
        timesUnlocked: m._count.participantStreakRewards,
      })),
    };
  }

  async update(id: string, waitlistId: string, founderUserId: string, dto: UpdateStreakMilestoneDto) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    const milestone = await this.prisma.streakMilestone.findFirst({
      where: { id, waitlistId },
    });

    if (!milestone) {
      throw new NotFoundException('STREAK_MILESTONE_NOT_FOUND');
    }

    if (dto.days && dto.days !== milestone.days) {
      const conflict = await this.prisma.streakMilestone.findUnique({
        where: { waitlistId_days: { waitlistId, days: dto.days } },
      });
      if (conflict) throw new ConflictException('STREAK_MILESTONE_EXISTS');
    }

    return this.prisma.streakMilestone.update({
      where: { id },
      data: {
        ...(dto.days !== undefined && { days: dto.days }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(id: string, waitlistId: string, founderUserId: string) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    const milestone = await this.prisma.streakMilestone.findFirst({
      where: { id, waitlistId },
    });

    if (!milestone) {
      throw new NotFoundException('STREAK_MILESTONE_NOT_FOUND');
    }

    await this.prisma.streakMilestone.delete({ where: { id } });
    return { success: true };
  }
}
