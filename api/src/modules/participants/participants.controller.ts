import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Headers,
  Req,
  Query,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ParticipantsService } from './participants.service';
import { ParticipantAccessService } from './participant-access.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { getClientIp, getProxyCountryCode } from '../../common/utils/client-ip.util';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('participants')
export class ParticipantsController {
  constructor(
    private readonly participantsService: ParticipantsService,
    private readonly participantAccessService: ParticipantAccessService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createParticipantDto: CreateParticipantDto,
    @Req() request: Request,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.participantsService.create(
      createParticipantDto,
      getClientIp(request) ?? undefined,
      userAgent,
      getProxyCountryCode(request) ?? undefined,
    );
  }

  /**
   * Validate a permanent participant access token.
   * On first valid access: marks emailVerified = true (if needed).
   * Returns participant page data (no passwords, no private fields).
   *
   * GET /participants/access/:waitlistSlug/:token
   */
  @Public()
  @Get('access/:waitlistSlug/:token')
  @HttpCode(HttpStatus.OK)
  async accessByToken(
    @Param('waitlistSlug') waitlistSlug: string,
    @Param('token') rawToken: string,
  ) {
    // 1. Resolve waitlist
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug: waitlistSlug },
      select: {
        id: true,
        name: true,
        tagline: true,
        slug: true,
        themeMode: true,
        doubleSidedRewardsEnabled: true,
        streakBonusesEnabled: true,
        teamReferralsEnabled: true,
        skipLineEnabled: true,
        preOrderDepositEnabled: true,
        rewards: { select: { id: true, title: true, milestone: true, type: true, value: true, description: true } },
        streakMilestones: { select: { id: true, days: true, title: true, type: true, value: true, description: true } },
        branding: { select: { primaryColor: true, secondaryColor: true, logoId: true } },
      },
    });

    if (!waitlist) {
      throw new NotFoundException('WAITLIST_NOT_FOUND');
    }

    // 2. Compute expected hash
    let tokenHash: string;
    try {
      tokenHash = this.participantAccessService.hashToken(rawToken);
    } catch {
      throw new NotFoundException('INVALID_TOKEN');
    }

    // 3. Find participant by token hash scoped to this waitlist
    let participant = await this.prisma.participant.findFirst({
      where: {
        waitlistId: waitlist.id,
        accessTokenHash: tokenHash,
      },
      select: {
        id: true,
        waitlistId: true,
        position: true,
        referralCode: true,
        referralCount: true,
        emailVerified: true,
        accessTokenRevokedAt: true,
        signupStatus: true,
        currentStreak: true,
        longestStreak: true,
        lastSuccessfulReferralAt: true,
        status: true,
        createdAt: true,
        participantRewards: {
          select: {
            rewardId: true,
            unlockedAt: true,
            reward: { select: { id: true, title: true, type: true, value: true, milestone: true } },
          },
        },
        participantStreakRewards: {
          select: {
            streakMilestoneId: true,
            unlockedAt: true,
            streakMilestone: { select: { id: true, days: true, title: true, type: true, value: true } },
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('INVALID_TOKEN');
    }

    // 4. Check revocation
    if (participant.accessTokenRevokedAt) {
      throw new ForbiddenException('TOKEN_REVOKED');
    }

    // 5. Verify email on first valid access (idempotent)
    if (!participant.emailVerified) {
      await this.participantsService.confirmParticipant(participant.id);
      
      const updated = await this.prisma.participant.findUnique({
        where: { id: participant.id },
      });
      if (updated) {
        participant.emailVerified = true;
        participant.position = updated.position;
      }
    }

    // 6. Build safe participant page response (never expose email, raw token, or internal IDs beyond participant's own use)
    const referralLink = `/r/${participant.referralCode}`;
    const peopleAhead = Math.max(0, participant.position - 1);

    return {
      success: true,
      data: {
        participant: {
          id: participant.id,
          position: participant.position,
          peopleAhead,
          referralCode: participant.referralCode,
          referralCount: participant.referralCount,
          emailVerified: true, // Always true after this endpoint is called
          signupStatus: participant.signupStatus,
          status: participant.status,
          joinedAt: participant.createdAt,
          referralLink,
          streak: waitlist.streakBonusesEnabled ? {
            current: participant.currentStreak,
            longest: participant.longestStreak,
          } : null,
          unlockedRewards: participant.participantRewards.map((pr) => ({
            id: pr.reward.id,
            title: pr.reward.title,
            type: pr.reward.type,
            value: pr.reward.value,
            milestone: pr.reward.milestone,
            unlockedAt: pr.unlockedAt,
          })),
          unlockedStreakRewards: participant.participantStreakRewards.map((psr) => ({
            id: psr.streakMilestone.id,
            days: psr.streakMilestone.days,
            title: psr.streakMilestone.title,
            type: psr.streakMilestone.type,
            value: psr.streakMilestone.value,
            unlockedAt: psr.unlockedAt,
          })),
        },
        waitlist: {
          id: waitlist.id,
          name: waitlist.name,
          tagline: waitlist.tagline,
          slug: waitlist.slug,
          themeMode: waitlist.themeMode,
          rewards: waitlist.rewards,
          streakMilestones: waitlist.streakMilestones,
          doubleSidedRewardsEnabled: waitlist.doubleSidedRewardsEnabled,
          streakBonusesEnabled: waitlist.streakBonusesEnabled,
          teamReferralsEnabled: waitlist.teamReferralsEnabled,
          skipLineEnabled: waitlist.skipLineEnabled,
          preOrderDepositEnabled: waitlist.preOrderDepositEnabled,
        },
        branding: waitlist.branding,
      },
    };
  }

  @Public()
  @Get(':id/referral-messages')
  getReferralMessages(@Param('id') id: string) {
    return this.participantsService.getReferralMessages(id);
  }

  @Public()
  @Post(':id/referral-messages/regenerate')
  @HttpCode(HttpStatus.OK)
  regenerateReferralMessages(@Param('id') id: string) {
    return this.participantsService.regenerateReferralMessages(id);
  }

  @Public()
  @Patch(':id/signup-progress')
  updateSignupProgress(
    @Param('id') id: string,
    @Body() updateSignupProgressDto: import('./dto/update-signup-progress.dto').UpdateSignupProgressDto,
  ) {
    return this.participantsService.updateSignupProgress(id, updateSignupProgressDto);
  }

  @Public()
  @Get(':id/skip-line-status')
  getSkipLineStatus(@Param('id') id: string, @Query('waitlistId') waitlistId: string) {
    return this.participantsService.getSkipLineStatus(id, waitlistId);
  }

  @Public()
  @Get(':id/pre-order-status')
  getPreOrderStatus(@Param('id') id: string, @Query('waitlistId') waitlistId: string) {
    return this.participantsService.getPreOrderStatus(id, waitlistId);
  }

  @Public()
  @Get(':id/debug-rank')
  async debugRank(@Param('id') id: string, @Query('waitlistId') waitlistId: string) {
    return this.participantsService.debugRank(waitlistId);
  }
}

