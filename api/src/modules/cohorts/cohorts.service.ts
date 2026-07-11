import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ParticipantStatus, RewardType } from '@prisma/client';
import { EmailsService } from '../emails/emails.service';

export interface OpenGatesDto {
  waitlistId: string;
  founderUserId: string;
  batchSize: number;
}

export interface GateOpeningResult {
  cohortId: string;
  batchNumber: number;
  invitedCount: number;
  participants: Array<{
    email: string;
    position: number;
    rewards: string[];
  }>;
}

@Injectable()
export class CohortsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
  ) {}

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

  /**
   * Get participants prioritized by:
   * 1. VIP Access reward holders
   * 2. Early Access reward holders
   * 3. Highest ranked participants (by position)
   */
  private async getPrioritizedParticipants(waitlistId: string, limit: number) {
    // Get all waiting participants with their rewards
    const participants = await this.prisma.participant.findMany({
      where: {
        waitlistId,
        status: ParticipantStatus.WAITING,
      },
      include: {
        participantRewards: {
          include: {
            reward: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    // Categorize participants by reward priority
    const vipParticipants = participants.filter((p) =>
      p.participantRewards.some((pr) => pr.reward.type === RewardType.VIP_ACCESS),
    );

    const earlyAccessParticipants = participants.filter((p) =>
      p.participantRewards.some((pr) => pr.reward.type === RewardType.EARLY_ACCESS),
    );

    const regularParticipants = participants.filter((p) =>
      !p.participantRewards.some(
        (pr) =>
          pr.reward.type === RewardType.VIP_ACCESS ||
          pr.reward.type === RewardType.EARLY_ACCESS,
      ),
    );

    // Sort each group by position (ascending)
    vipParticipants.sort((a, b) => a.position - b.position);
    earlyAccessParticipants.sort((a, b) => a.position - b.position);
    regularParticipants.sort((a, b) => a.position - b.position);

    // Combine in priority order
    const prioritized = [...vipParticipants, ...earlyAccessParticipants, ...regularParticipants];

    // Return up to the requested limit
    return prioritized.slice(0, limit);
  }

  /**
   * Open the gates - invite a batch of participants
   */
  async openGates(dto: OpenGatesDto): Promise<GateOpeningResult> {
    const { waitlistId, founderUserId, batchSize } = dto;

    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    // Get the next batch number for this waitlist
    const lastCohort = await this.prisma.cohort.findFirst({
      where: { waitlistId },
      orderBy: { batchNumber: 'desc' },
    });

    const batchNumber = lastCohort ? lastCohort.batchNumber + 1 : 1;

    // Get prioritized participants
    const participants = await this.getPrioritizedParticipants(waitlistId, batchSize);

    if (participants.length === 0) {
      return {
        cohortId: '',
        batchNumber,
        invitedCount: 0,
        participants: [],
      };
    }

    // Create cohort and invitations in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create cohort
      const cohort = await tx.cohort.create({
        data: {
          waitlistId,
          batchNumber,
          size: participants.length,
        },
      });

      // Create invitations and update participant status
      const invitations = await Promise.all(
        participants.map((participant) =>
          tx.cohortInvitation.create({
            data: {
              cohortId: cohort.id,
              participantId: participant.id,
            },
          }),
        ),
      );

      // Update participant status to INVITED
      await tx.participant.updateMany({
        where: {
          id: { in: participants.map((p) => p.id) },
        },
        data: {
          status: ParticipantStatus.INVITED,
          invitedAt: new Date(),
        },
      });

      return { cohort, invitations };
    });

    // Send invitation emails (outside transaction for performance)
    const emailPromises = participants.map((participant) =>
      this.emailsService.sendInvitationEmailDirect(
        participant.email,
        waitlistId,
        participant.position,
      ),
    );

    await Promise.allSettled(emailPromises);

    // Format response
    const formattedParticipants = participants.map((p) => ({
      email: p.email,
      position: p.position,
      rewards: p.participantRewards.map((pr) => pr.reward.title),
    }));

    return {
      cohortId: result.cohort.id,
      batchNumber,
      invitedCount: participants.length,
      participants: formattedParticipants,
    };
  }

  /**
   * Get gate opening analytics for a waitlist
   */
  async getAnalytics(waitlistId: string, founderUserId: string) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    const totalParticipants = await this.prisma.participant.count({
      where: { waitlistId },
    });

    const invitedParticipants = await this.prisma.participant.count({
      where: {
        waitlistId,
        status: { in: [ParticipantStatus.INVITED, ParticipantStatus.ACCESSED] },
      },
    });

    const waitingParticipants = totalParticipants - invitedParticipants;

    const cohorts = await this.prisma.cohort.findMany({
      where: { waitlistId },
      orderBy: { batchNumber: 'asc' },
    });

    const lastCohort = cohorts[cohorts.length - 1];

    const progress = totalParticipants > 0 ? (invitedParticipants / totalParticipants) * 100 : 0;

    return {
      totalParticipants,
      invitedParticipants,
      waitingParticipants,
      totalCohorts: cohorts.length,
      lastCohortSize: lastCohort?.size || 0,
      progress: Math.round(progress * 10) / 10,
      cohorts: cohorts.map((c) => ({
        id: c.id,
        batchNumber: c.batchNumber,
        size: c.size,
        createdAt: c.createdAt,
      })),
    };
  }

  /**
   * Get all cohorts for a waitlist
   */
  async getCohorts(waitlistId: string, founderUserId: string) {
    await this.verifyWaitlistOwnership(waitlistId, founderUserId);

    return this.prisma.cohort.findMany({
      where: { waitlistId },
      orderBy: { batchNumber: 'asc' },
      include: {
        invitations: {
          include: {
            participant: {
              select: {
                email: true,
                position: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Mark a participant as having accessed the product
   */
  async markAsAccessed(participantId: string, founderUserId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: { waitlist: { include: { founder: true } } },
    });

    if (!participant) {
      throw new NotFoundException('PARTICIPANT_NOT_FOUND');
    }

    if (participant.waitlist.founder.userId !== founderUserId) {
      throw new ForbiddenException('FORBIDDEN');
    }

    return this.prisma.participant.update({
      where: { id: participantId },
      data: {
        status: ParticipantStatus.ACCESSED,
        accessedAt: new Date(),
      },
    });
  }
}
