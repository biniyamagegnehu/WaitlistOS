import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreateTeamMilestoneDto, UpdateTeamMilestoneDto } from './dto/team-milestone.dto';
import { randomBytes } from 'crypto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('emails') private readonly emailsQueue: Queue,
  ) {}

  // ── Helpers ───────────────────────────────────────────────
  private generateInviteCode(): string {
    return randomBytes(6).toString('base64url').slice(0, 8).toUpperCase();
  }

  private async getParticipant(participantId: string) {
    const p = await this.prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!p) throw new NotFoundException('PARTICIPANT_NOT_FOUND');
    return p;
  }

  // ── Verify participant is an owner of a given team ────────
  private async assertTeamOwner(teamId: string, participantId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('TEAM_NOT_FOUND');
    if (team.ownerId !== participantId) throw new ForbiddenException('NOT_TEAM_OWNER');
    return team;
  }

  // ── Create team ───────────────────────────────────────────
  async createTeam(participantId: string, dto: CreateTeamDto) {
    const participant = await this.getParticipant(participantId);

    // Cannot create if already in a team
    if (participant.teamId) {
      throw new ConflictException('ALREADY_IN_A_TEAM');
    }

    // Cannot create multiple teams
    const existingOwned = await this.prisma.team.findFirst({
      where: { ownerId: participantId },
    });
    if (existingOwned) {
      throw new ConflictException('ALREADY_OWNS_A_TEAM');
    }

    // Name uniqueness within waitlist
    const nameExists = await this.prisma.team.findUnique({
      where: { waitlistId_name: { waitlistId: participant.waitlistId, name: dto.name } },
    });
    if (nameExists) throw new ConflictException('TEAM_NAME_TAKEN');

    // Generate unique invite code
    let inviteCode = this.generateInviteCode();
    let codeExists = await this.prisma.team.findUnique({ where: { inviteCode } });
    while (codeExists) {
      inviteCode = this.generateInviteCode();
      codeExists = await this.prisma.team.findUnique({ where: { inviteCode } });
    }

    const team = await this.prisma.$transaction(async (tx) => {
      const t = await tx.team.create({
        data: {
          waitlistId: participant.waitlistId,
          name: dto.name,
          ownerId: participantId,
          inviteCode,
          description: dto.description,
        },
      });
      // Auto-join owner
      await tx.participant.update({
        where: { id: participantId },
        data: { teamId: t.id },
      });
      return t;
    });

    return { success: true, data: team };
  }

  // ── Get team details ──────────────────────────────────────
  async getTeam(teamId: string, participantId?: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            referralCount: true,
            positionBoostBonus: true,
            position: true,
          },
        },
        owner: { select: { id: true, email: true } },
        teamMilestoneRewards: {
          include: { milestone: true },
          orderBy: { unlockedAt: 'asc' },
        },
      },
    });
    if (!team) throw new NotFoundException('TEAM_NOT_FOUND');

    const teamScore = team.members.reduce((sum, m) => sum + m.referralCount, 0);

    // Load next milestone
    const nextMilestone = await this.prisma.teamRewardMilestone.findFirst({
      where: {
        waitlistId: team.waitlistId,
        milestone: { gt: teamScore },
        teamMilestoneRewards: {
          none: { teamId: teamId },
        },
      },
      orderBy: { milestone: 'asc' },
    });

    return {
      success: true,
      data: {
        id: team.id,
        name: team.name,
        description: team.description,
        inviteCode: team.inviteCode,
        waitlistId: team.waitlistId,
        ownerId: team.ownerId,
        createdAt: team.createdAt,
        teamScore,
        memberCount: team.members.length,
        members: team.members.map((m) => ({
          id: m.id,
          email: m.email,
          referralCount: m.referralCount,
          position: m.position,
          isOwner: m.id === team.ownerId,
        })),
        unlockedMilestones: team.teamMilestoneRewards.map((r) => ({
          id: r.id,
          milestone: r.milestone.milestone,
          type: r.milestone.type,
          value: r.milestone.value,
          title: r.milestone.title,
          unlockedAt: r.unlockedAt,
        })),
        nextMilestone: nextMilestone
          ? {
              id: nextMilestone.id,
              milestone: nextMilestone.milestone,
              type: nextMilestone.type,
              value: nextMilestone.value,
              title: nextMilestone.title,
              progress: teamScore,
              percent: Math.min(Math.round((teamScore / nextMilestone.milestone) * 100), 99),
            }
          : null,
      },
    };
  }

  // ── Join team by invite code ──────────────────────────────
  async joinTeam(participantId: string, inviteCode: string) {
    const participant = await this.getParticipant(participantId);

    if (participant.teamId) {
      throw new ConflictException('ALREADY_IN_A_TEAM');
    }

    const team = await this.prisma.team.findUnique({
      where: { inviteCode },
      include: {
        _count: { select: { members: true } },
        waitlist: { select: { maxTeamSize: true, teamReferralsEnabled: true } },
      },
    });

    if (!team) throw new NotFoundException('INVALID_INVITE_CODE');
    if (team.waitlistId !== participant.waitlistId) {
      throw new BadRequestException('WRONG_WAITLIST');
    }
    if (!team.waitlist.teamReferralsEnabled) {
      throw new BadRequestException('TEAM_REFERRALS_DISABLED');
    }
    if (team._count.members >= team.waitlist.maxTeamSize) {
      throw new BadRequestException('TEAM_IS_FULL');
    }

    await this.prisma.participant.update({
      where: { id: participantId },
      data: { teamId: team.id },
    });

    // Mark any pending invitation as accepted
    await this.prisma.teamInvitation.updateMany({
      where: { teamId: team.id, participantId, status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    });

    return { success: true, message: 'Joined team successfully', teamId: team.id };
  }

  // ── Invite participant by email ───────────────────────────
  async inviteMember(teamId: string, ownerId: string, email: string) {
    const team = await this.assertTeamOwner(teamId, ownerId);

    const invitee = await this.prisma.participant.findUnique({
      where: { waitlistId_email: { waitlistId: team.waitlistId, email } },
    });
    if (!invitee) throw new NotFoundException('PARTICIPANT_NOT_FOUND');
    if (invitee.teamId) throw new ConflictException('ALREADY_IN_A_TEAM');

    const existing = await this.prisma.teamInvitation.findUnique({
      where: { teamId_participantId: { teamId, participantId: invitee.id } },
    });
    if (existing && existing.status === 'PENDING') {
      throw new ConflictException('INVITATION_ALREADY_SENT');
    }

    const invitation = await this.prisma.teamInvitation.upsert({
      where: { teamId_participantId: { teamId, participantId: invitee.id } },
      create: { teamId, participantId: invitee.id, status: 'PENDING' },
      update: { status: 'PENDING' },
    });

    // Queue invitation email notification
    await this.emailsQueue.add(
      'send-team-invitation',
      { email: invitee.email, teamName: team.name, inviteCode: team.inviteCode },
      { attempts: 2, removeOnComplete: true, removeOnFail: true },
    );

    return { success: true, data: invitation };
  }

  // ── Accept/Decline invitation ─────────────────────────────
  async respondToInvitation(invitationId: string, participantId: string, action: 'accept' | 'decline') {
    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            _count: { select: { members: true } },
            waitlist: { select: { maxTeamSize: true, teamReferralsEnabled: true } },
          },
        },
      },
    });

    if (!invitation) throw new NotFoundException('INVITATION_NOT_FOUND');
    if (invitation.participantId !== participantId) throw new ForbiddenException('NOT_YOUR_INVITATION');
    if (invitation.status !== 'PENDING') throw new BadRequestException('INVITATION_ALREADY_RESPONDED');

    if (action === 'decline') {
      await this.prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'DECLINED' },
      });
      return { success: true, message: 'Invitation declined' };
    }

    const participant = await this.getParticipant(participantId);
    if (participant.teamId) throw new ConflictException('ALREADY_IN_A_TEAM');
    if (invitation.team._count.members >= invitation.team.waitlist.maxTeamSize) {
      throw new BadRequestException('TEAM_IS_FULL');
    }

    await this.prisma.$transaction([
      this.prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.participant.update({
        where: { id: participantId },
        data: { teamId: invitation.teamId },
      }),
    ]);

    return { success: true, message: 'Joined team', teamId: invitation.teamId };
  }

  // ── Get invitations for a participant ─────────────────────
  async getMyInvitations(participantId: string) {
    const invitations = await this.prisma.teamInvitation.findMany({
      where: { participantId, status: 'PENDING' },
      include: {
        team: { select: { id: true, name: true, description: true, ownerId: true, _count: { select: { members: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: invitations.map((inv) => ({
        id: inv.id,
        teamId: inv.teamId,
        teamName: inv.team.name,
        teamDescription: inv.team.description,
        memberCount: inv.team._count.members,
        createdAt: inv.createdAt,
      })),
    };
  }

  // ── Remove member ─────────────────────────────────────────
  async removeMember(teamId: string, ownerId: string, memberId: string) {
    const team = await this.assertTeamOwner(teamId, ownerId);
    if (memberId === ownerId) throw new BadRequestException('CANNOT_REMOVE_YOURSELF');

    const member = await this.prisma.participant.findFirst({
      where: { id: memberId, teamId },
    });
    if (!member) throw new NotFoundException('MEMBER_NOT_FOUND');

    await this.prisma.participant.update({
      where: { id: memberId },
      data: { teamId: null },
    });

    return { success: true, message: 'Member removed' };
  }

  // ── Leave team ────────────────────────────────────────────
  async leaveTeam(participantId: string) {
    const participant = await this.getParticipant(participantId);
    if (!participant.teamId) throw new BadRequestException('NOT_IN_A_TEAM');

    const team = await this.prisma.team.findUnique({ where: { id: participant.teamId } });
    if (team?.ownerId === participantId) {
      throw new BadRequestException('OWNER_CANNOT_LEAVE');
    }

    await this.prisma.participant.update({
      where: { id: participantId },
      data: { teamId: null },
    });

    return { success: true, message: 'Left team' };
  }

  // ── Transfer ownership ────────────────────────────────────
  async transferOwnership(teamId: string, ownerId: string, newOwnerId: string) {
    await this.assertTeamOwner(teamId, ownerId);

    const newOwner = await this.prisma.participant.findFirst({
      where: { id: newOwnerId, teamId },
    });
    if (!newOwner) throw new NotFoundException('MEMBER_NOT_FOUND');

    await this.prisma.team.update({
      where: { id: teamId },
      data: { ownerId: newOwnerId },
    });

    return { success: true, message: 'Ownership transferred' };
  }

  // ── Delete team ───────────────────────────────────────────
  async deleteTeam(teamId: string, ownerId: string) {
    await this.assertTeamOwner(teamId, ownerId);

    // Remove teamId from all members first
    await this.prisma.participant.updateMany({
      where: { teamId },
      data: { teamId: null },
    });

    await this.prisma.team.delete({ where: { id: teamId } });

    return { success: true, message: 'Team deleted' };
  }

  // ── Get team by participant ───────────────────────────────
  async getMyTeam(participantId: string) {
    const participant = await this.getParticipant(participantId);
    if (!participant.teamId) {
      return { success: true, data: null };
    }
    return this.getTeam(participant.teamId, participantId);
  }

  // ── Team Leaderboard ──────────────────────────────────────
  async getTeamLeaderboard(waitlistId: string) {
    const teams = await this.prisma.team.findMany({
      where: { waitlistId },
      include: {
        members: { select: { referralCount: true }, where: { emailVerified: true } },
        _count: { select: { members: { where: { emailVerified: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const ranked = teams
      .map((t) => ({
        id: t.id,
        name: t.name,
        memberCount: t._count.members,
        totalReferrals: t.members.reduce((sum, m) => sum + m.referralCount, 0),
        createdAt: t.createdAt,
      }))
      .sort((a, b) => {
        if (b.totalReferrals !== a.totalReferrals) return b.totalReferrals - a.totalReferrals;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .map((t, i) => ({ ...t, rank: i + 1 }));

    return { success: true, data: ranked };
  }

  // ── Team Analytics (Founder) ──────────────────────────────
  async getTeamAnalytics(waitlistId: string, founderUserId: string) {
    // Verify ownership
    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founder: { userId: founderUserId } },
    });
    if (!waitlist) throw new NotFoundException('WAITLIST_NOT_FOUND');

    const teams = await this.prisma.team.findMany({
      where: { waitlistId },
      include: {
        members: { select: { referralCount: true }, where: { emailVerified: true } },
        _count: { select: { members: { where: { emailVerified: true } } } },
        teamMilestoneRewards: {
          include: { participantRewards: true },
        },
      },
    });

    const totalTeams = teams.length;
    const avgTeamSize = totalTeams > 0 ? teams.reduce((s, t) => s + t._count.members, 0) / totalTeams : 0;

    const teamsWithScore = teams.map((t) => ({
      id: t.id,
      name: t.name,
      memberCount: t._count.members,
      totalReferrals: t.members.reduce((sum, m) => sum + m.referralCount, 0),
      rewardsGranted: t.teamMilestoneRewards.reduce((s, r) => s + r.participantRewards.length, 0),
    }));

    const largest = teamsWithScore.reduce((max, t) => (t.memberCount > (max?.memberCount ?? 0) ? t : max), teamsWithScore[0] ?? null);
    const topPerforming = teamsWithScore.reduce((max, t) => (t.totalReferrals > (max?.totalReferrals ?? 0) ? t : max), teamsWithScore[0] ?? null);

    const totalTeamReferrals = teamsWithScore.reduce((sum, t) => sum + t.totalReferrals, 0);
    const totalRewardsGranted = teamsWithScore.reduce((sum, t) => sum + t.rewardsGranted, 0);
    const activeTeams = teamsWithScore.filter((t) => t.memberCount >= 2).length;

    return {
      success: true,
      data: {
        totalTeams,
        avgTeamSize: Math.round(avgTeamSize * 10) / 10,
        activeTeams,
        totalTeamReferrals,
        totalRewardsGranted,
        largestTeam: largest ? { id: largest.id, name: largest.name, memberCount: largest.memberCount } : null,
        topPerformingTeam: topPerforming ? { id: topPerforming.id, name: topPerforming.name, totalReferrals: topPerforming.totalReferrals } : null,
        mostActiveTeam: topPerforming ? { id: topPerforming.id, name: topPerforming.name, totalReferrals: topPerforming.totalReferrals } : null,
      },
    };
  }

  // ── Team Milestone CRUD (Founder) ─────────────────────────
  async createTeamMilestone(waitlistId: string, founderUserId: string, dto: CreateTeamMilestoneDto) {
    await this.assertFounderOwnsWaitlist(waitlistId, founderUserId);

    const existing = await this.prisma.teamRewardMilestone.findUnique({
      where: { waitlistId_milestone: { waitlistId, milestone: dto.milestone } },
    });
    if (existing) throw new ConflictException('TEAM_MILESTONE_EXISTS');

    const milestone = await this.prisma.teamRewardMilestone.create({
      data: {
        waitlistId,
        milestone: dto.milestone,
        type: dto.type,
        value: dto.value,
        valueType: dto.valueType,
        title: dto.title,
      },
    });
    return { success: true, data: milestone };
  }

  async findTeamMilestones(waitlistId: string, founderUserId: string) {
    await this.assertFounderOwnsWaitlist(waitlistId, founderUserId);
    const milestones = await this.prisma.teamRewardMilestone.findMany({
      where: { waitlistId },
      orderBy: { milestone: 'asc' },
      include: { _count: { select: { teamMilestoneRewards: true } } },
    });
    return { success: true, data: milestones };
  }

  async updateTeamMilestone(id: string, waitlistId: string, founderUserId: string, dto: UpdateTeamMilestoneDto) {
    await this.assertFounderOwnsWaitlist(waitlistId, founderUserId);
    const m = await this.prisma.teamRewardMilestone.findFirst({ where: { id, waitlistId } });
    if (!m) throw new NotFoundException('TEAM_MILESTONE_NOT_FOUND');

    const updated = await this.prisma.teamRewardMilestone.update({
      where: { id },
      data: dto,
    });
    return { success: true, data: updated };
  }

  async deleteTeamMilestone(id: string, waitlistId: string, founderUserId: string) {
    await this.assertFounderOwnsWaitlist(waitlistId, founderUserId);
    const m = await this.prisma.teamRewardMilestone.findFirst({ where: { id, waitlistId } });
    if (!m) throw new NotFoundException('TEAM_MILESTONE_NOT_FOUND');

    await this.prisma.teamRewardMilestone.delete({ where: { id } });
    return { success: true, message: 'Deleted' };
  }

  private async assertFounderOwnsWaitlist(waitlistId: string, founderUserId: string) {
    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founder: { userId: founderUserId } },
    });
    if (!waitlist) throw new NotFoundException('WAITLIST_NOT_FOUND');
    return waitlist;
  }
}
