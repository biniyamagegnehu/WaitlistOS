import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { randomBytes } from 'crypto';
import { PaymentService } from '../payments/payment.service';
import { Prisma, FunnelEventType } from '@prisma/client';
import { computeEffectiveStreak } from '../../lib/streak-utils';
import { GeoLocationService } from '../analytics/geo-location.service';
import { DeviceDetectionService } from '../analytics/device-detection.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { WaitlistsService } from '../waitlists/waitlists.service';
import { CustomFieldValidator } from './validators/custom-field.validator';
import { resolveTrafficSource, sanitizeAttributionValue } from './source-attribution.util';
import { ParticipantAccessService } from './participant-access.service';
import { EmailsService } from '../emails/emails.service';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class ParticipantsService {
  private readonly logger = new Logger(ParticipantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('emails') private readonly emailsQueue: Queue,
    @InjectQueue('ai-tasks') private readonly aiTasksQueue: Queue,
    private readonly paymentService: PaymentService,
    private readonly geoLocationService: GeoLocationService,
    private readonly deviceDetectionService: DeviceDetectionService,
    private readonly analyticsService: AnalyticsService,
    private readonly participantAccessService: ParticipantAccessService,
    private readonly emailsService: EmailsService,
  ) { }

  // ── Referral code generator ──────────────────────────────
  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(4).toString('base64url').slice(0, 6);
      const clash = await this.prisma.participant.findUnique({
        where: { referralCode: code },
      });
      if (!clash) return code;
    }
    return randomBytes(8).toString('hex');
  }

  // ── Rerank all participants in a waitlist ─────────────────
  // Fetches all participants ordered by:
  //   1. hasSkipLinePriority DESC                    — paid participants first
  //   2. (referralCount + positionBoostBonus) DESC  — more referrals = higher priority
  //   3. createdAt ASC                              — earlier joiner wins on tie
  // Then assigns sequential positions 1, 2, 3... and bulk-updates any that changed.
  private async rerankParticipants(
    waitlistId: string,
    tx: TransactionClient,
  ): Promise<void> {
    this.logger.log(`Starting rerank for waitlist ${waitlistId}`);

    // Zero out positions for unverified participants (separate call — Prisma cannot multi-statement)
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "participants"
        SET position = 0
        WHERE "waitlistId" = ${waitlistId}
          AND "emailVerified" = false
          AND position != 0
      `
    );

    // Rerank only verified participants
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "participants"
        SET position = ranked.new_pos
        FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   ORDER BY "hasSkipLinePriority" DESC,
                          ("referralCount" + COALESCE("positionBoostBonus", 0)) DESC,
                          "createdAt" ASC
                 ) as new_pos
          FROM "participants"
          WHERE "waitlistId" = ${waitlistId}
            AND "emailVerified" = true
        ) as ranked
        WHERE "participants".id = ranked.id
          AND "participants".position IS DISTINCT FROM ranked.new_pos
      `
    );

    this.logger.log(`Rerank completed for waitlist ${waitlistId}`);
  }

  // ── Public rerank method for external calls ─────────────────────────
  async rerankWaitlistParticipants(waitlistId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.rerankParticipants(waitlistId, tx);
    });
  }

  // ── Debug method to check current ranking state ─────────────────────
  async debugRank(waitlistId: string) {
    const participants = await this.prisma.participant.findMany({
      where: { waitlistId, emailVerified: true },
      select: {
        id: true,
        email: true,
        position: true,
        hasSkipLinePriority: true,
        referralCount: true,
        positionBoostBonus: true,
        createdAt: true,
      },
      orderBy: { position: 'asc' },
    });

    return {
      total: participants.length,
      paidPriority: participants.filter(p => p.hasSkipLinePriority).length,
      normal: participants.filter(p => !p.hasSkipLinePriority).length,
      participants: participants.map(p => ({
        position: p.position,
        email: p.email,
        hasSkipLinePriority: p.hasSkipLinePriority,
        referralCount: p.referralCount,
        positionBoostBonus: p.positionBoostBonus,
        createdAt: p.createdAt,
      })),
    };
  }

  // ── Confirm participant & Referrals ───────────────────────
  async confirmParticipant(participantId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const participant = await tx.participant.findUniqueOrThrow({
        where: { id: participantId },
        include: { waitlist: { include: { streakMilestones: true } } },
      });

      if (participant.emailVerified) {
        return; // Idempotent
      }

      await tx.participant.update({
        where: { id: participantId },
        data: { emailVerified: true },
      });

      if (participant.referredById) {
        const referrer = await tx.participant.findUniqueOrThrow({
          where: { id: participant.referredById },
        });

        // Increment referrer's referral count
        let updatedReferrer = await tx.participant.update({
          where: { id: referrer.id },
          data: { referralCount: { increment: 1 } },
        });

        // Check for reward milestones
        const matchingRewards = await tx.reward.findMany({
          where: {
            waitlistId: participant.waitlistId,
            milestone: updatedReferrer.referralCount,
          },
        });

        for (const reward of matchingRewards) {
          await tx.participantReward.create({
            data: {
              participantId: referrer.id,
              rewardId: reward.id,
            },
          });

          if (reward.type === 'POSITION_BOOST' && reward.value && reward.value > 0) {
            updatedReferrer = await tx.participant.update({
              where: { id: referrer.id },
              data: { positionBoostBonus: { increment: reward.value } },
            });
          }
        }

        // ── Double-Sided Rewards ─────────────────────────────
        if (participant.waitlist.doubleSidedRewardsEnabled) {
          updatedReferrer = await tx.participant.update({
            where: { id: referrer.id },
            data: { positionBoostBonus: { increment: participant.waitlist.referrerRankingBonus } },
          });

          await tx.participant.update({
            where: { id: participant.id },
            data: { positionBoostBonus: { increment: participant.waitlist.newParticipantRankingBonus } },
          });

          await tx.waitlist.update({
            where: { id: participant.waitlistId },
            data: {
              doubleSidedRewardsGranted: { increment: 1 },
              totalReferrerRankingBonusAwarded: { increment: participant.waitlist.referrerRankingBonus },
              totalNewParticipantRankingBonusAwarded: { increment: participant.waitlist.newParticipantRankingBonus },
            },
          });
        }

        // ── Streak Bonuses ────────────────────────────────────
        if (participant.waitlist.streakBonusesEnabled && participant.waitlist.streakMilestones.length > 0) {
          const freshReferrer = await tx.participant.findUniqueOrThrow({
            where: { id: referrer.id },
            include: { participantStreakRewards: true },
          });

          const effectiveStreak = computeEffectiveStreak(
            freshReferrer.currentStreak,
            freshReferrer.lastSuccessfulReferralAt,
          );

          const now = new Date();
          const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          const lastRef = freshReferrer.lastSuccessfulReferralAt;
          const lastRefDayUTC = lastRef
            ? new Date(Date.UTC(lastRef.getUTCFullYear(), lastRef.getUTCMonth(), lastRef.getUTCDate()))
            : null;

          const alreadyReferredToday = lastRefDayUTC?.getTime() === todayUTC.getTime();

          let newStreak: number;
          if (alreadyReferredToday) {
            newStreak = effectiveStreak;
          } else if (effectiveStreak === 0) {
            newStreak = 1;
          } else {
            newStreak = effectiveStreak + 1;
          }

          const newLongest = Math.max(freshReferrer.longestStreak, newStreak);

          updatedReferrer = await tx.participant.update({
            where: { id: referrer.id },
            data: {
              currentStreak: newStreak,
              longestStreak: newLongest,
              lastSuccessfulReferralAt: alreadyReferredToday ? undefined : now,
            },
          });

          const alreadyUnlockedIds = new Set(
            freshReferrer.participantStreakRewards.map((r) => r.streakMilestoneId),
          );

          for (const milestone of participant.waitlist.streakMilestones) {
            if (newStreak >= milestone.days && !alreadyUnlockedIds.has(milestone.id)) {
              await tx.participantStreakReward.create({
                data: {
                  participantId: referrer.id,
                  streakMilestoneId: milestone.id,
                },
              });

              if (milestone.type === 'POSITION_BOOST' && milestone.value && milestone.value > 0) {
                updatedReferrer = await tx.participant.update({
                  where: { id: referrer.id },
                  data: { positionBoostBonus: { increment: milestone.value } },
                });
              }
            }
          }
        }

        // ── Team Milestone Rewards ──────────────────────────────
        if (participant.waitlist.teamReferralsEnabled && referrer.teamId) {
          const teamAgg = await tx.participant.aggregate({
            where: { teamId: referrer.teamId },
            _sum: { referralCount: true },
          });
          const teamTotal = teamAgg._sum.referralCount || 0;

          const reachedMilestones = await tx.teamRewardMilestone.findMany({
            where: {
              waitlistId: participant.waitlistId,
              milestone: { lte: teamTotal },
            },
          });

          for (const milestone of reachedMilestones) {
            const existingReward = await tx.teamMilestoneReward.findUnique({
              where: {
                teamId_teamRewardMilestoneId: {
                  teamId: referrer.teamId,
                  teamRewardMilestoneId: milestone.id,
                },
              },
            });

            if (!existingReward) {
              const teamReward = await tx.teamMilestoneReward.create({
                data: {
                  teamId: referrer.teamId,
                  teamRewardMilestoneId: milestone.id,
                },
              });

              const members = await tx.participant.findMany({
                where: { teamId: referrer.teamId },
              });

              for (const member of members) {
                await tx.teamParticipantReward.create({
                  data: {
                    teamMilestoneRewardId: teamReward.id,
                    participantId: member.id,
                  },
                });

                if (milestone.type === 'POSITION_BOOST' && milestone.value && milestone.value > 0) {
                  await tx.participant.update({
                    where: { id: member.id },
                    data: {
                      positionBoostBonus: { increment: milestone.value },
                    },
                  });
                }
              }
            }
          }
        }
      }

      // Rerank all participants based on new verified participant and updated bonuses
      await this.rerankParticipants(participant.waitlistId, tx);
    });
  }

  // ── Create participant ────────────────────────────────────
  async create(
    dto: CreateParticipantDto,
    ip?: string,
    userAgent?: string,
    proxyCountryCode?: string,
  ) {
    const { waitlistSlug, email, referralCode: incomingRef, source, medium, campaign, referrer: dtoReferrer, landingPath, sessionId } = dto;

    // 1. Resolve waitlist by slug — 404 if not found
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug: waitlistSlug },
      include: { founder: true, streakMilestones: { orderBy: { days: 'asc' } }, signupConfig: true },
    });
    if (!waitlist) {
      throw new NotFoundException('WAITLIST_NOT_FOUND');
    }

    await this.paymentService.assertCanAddParticipant(waitlist.founder.userId);

    // 2. Duplicate email guard — 409
    const existing = await this.prisma.participant.findUnique({
      where: { waitlistId_email: { waitlistId: waitlist.id, email } },
    });
    if (existing) {
      if (existing.signupStatus === 'PARTIAL') {
        const referralLink = `/r/${existing.referralCode}`;
        // Resend access email for partial (unverified) participants
        if (existing.accessTokenHash) {
          this.logger.debug(`Participant ${existing.id} already exists (PARTIAL), not regenerating token.`);
        }
        return {
          success: true,
          id: existing.id,
          email: existing.email,
          position: existing.position,
          referralCode: existing.referralCode,
          referralCount: existing.referralCount,
          referralLink,
          signupStatus: existing.signupStatus,
          requireEmailVerification: true,
        };
      }
      throw new ConflictException('EMAIL_ALREADY_JOINED');
    }

    // Determine initial signupStatus based on config
    let initialSignupStatus: 'PARTIAL' | 'COMPLETED' = 'COMPLETED';
    if (waitlist.signupConfig?.enabled) {
      const steps = Array.isArray(waitlist.signupConfig.steps) ? waitlist.signupConfig.steps : [];
      const hasQuestions = steps.some((s: any) => s.type === 'QUESTIONS' && s.enabled);
      const hasReferral = steps.some((s: any) => s.type === 'REFERRAL' && s.enabled);
      if (hasQuestions || hasReferral) {
        initialSignupStatus = 'PARTIAL';
      }
    }

    // 3. Resolve referrer (if code provided)
    let referrer: any = null;
    if (incomingRef) {
      referrer = await this.prisma.participant.findUnique({
        where: { referralCode: incomingRef },
      });

      if (!referrer) {
        throw new BadRequestException('INVALID_REFERRAL');
      }

      if (referrer.waitlistId !== waitlist.id) {
        throw new BadRequestException('INVALID_REFERRAL');
      }

      if (referrer.email === email) {
        throw new BadRequestException('SELF_REFERRAL');
      }
    }

    // Generate unique referral code for this new participant
    const newReferralCode = await this.generateUniqueCode();

    // Capture Geo & Device metadata (safe fallback)
    this.logger.log(`Signup attempt - IP: ${ip}, UserAgent: ${userAgent?.substring(0, 50)}...`);
    const countryCode = proxyCountryCode ?? this.geoLocationService.resolveCountry(ip);
    const deviceInfo = this.deviceDetectionService.detectDevice(userAgent);
    this.logger.log(`Resolved - CountryCode: ${countryCode}, DeviceType: ${deviceInfo.deviceType}, Browser: ${deviceInfo.browserName}`);

    // 4. Transaction with SKIP LOCKED retry logic
    const maxRetries = 5;
    const baseRetryDelay = 100; // ms

    let participant: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        participant = await this.prisma.$transaction(async (tx) => {
          // Acquire exclusive lock on the waitlist row to serialize concurrent signups
          const lockResult = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM waitlists
            WHERE id = ${waitlist.id}
            FOR UPDATE SKIP LOCKED
            LIMIT 1
          `;

          if (!lockResult || lockResult.length === 0) {
            throw new Error('ROW_LOCKED');
          }

          const p = await tx.participant.create({
            data: {
              waitlistId: waitlist.id,
              email,
              position: 0,
              referralCode: newReferralCode,
              source: resolveTrafficSource(source, dtoReferrer),
              medium: sanitizeAttributionValue(medium),
              campaign: sanitizeAttributionValue(campaign),
              referrer: sanitizeAttributionValue(dtoReferrer),
              landingPath: sanitizeAttributionValue(landingPath),
              ipAddress: ip,
              countryCode,
              deviceType: deviceInfo.deviceType,
              browserName: deviceInfo.browserName,
              signupStatus: initialSignupStatus,
              ...(referrer ? { referredById: referrer.id } : {}),
            },
          });

          return p;
        });

        break; // success
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'ROW_LOCKED' &&
          attempt < maxRetries - 1
        ) {
          const delay = baseRetryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }

    // 5. Build referral link
    const referralLink = `/r/${participant.referralCode}`;

    // 6. Generate permanent access token and save to DB (hash only)
    // Email verification is always required for all participants.
    let rawAccessToken: string | undefined;
    try {
      rawAccessToken = this.participantAccessService.generateRawToken();
      const tokenHash = this.participantAccessService.hashToken(rawAccessToken);
      await this.prisma.participant.update({
        where: { id: participant.id },
        data: {
          accessTokenHash: tokenHash,
          accessTokenCreatedAt: new Date(),
          emailVerified: false, // Always requires verification via magic URL click
        },
      });
    } catch (err) {
      this.logger.error(`Failed to generate/save access token for participant ${participant.id}: ${(err as Error).message}`);
      // Non-fatal: participant is created; token can be regenerated later
    }

    // 7. Build magic URL and queue participant access email (if token generated)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    if (rawAccessToken) {
      const magicUrl = this.participantAccessService.buildMagicUrl(
        frontendUrl,
        waitlist.slug,
        rawAccessToken,
      );
      this.emailsService.queueParticipantAccessEmail(
        participant.email,
        waitlist.name,
        magicUrl,
      );
    }

    // 9. Queue AI Referral Messages
    await this.aiTasksQueue.add(
      'generate-referral-messages',
      { participantId: participant.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      },
    );

    // 10. Track SIGNUP_SUBMITTED (and EMAIL_SUBMITTED) funnel events if sessionId provided
    if (sessionId) {
      try {
        await this.analyticsService.recordFunnelEvent(
          waitlist.id,
          sessionId,
          FunnelEventType.SIGNUP_SUBMITTED,
        );
        await this.analyticsService.recordFunnelEvent(
          waitlist.id,
          sessionId,
          FunnelEventType.EMAIL_SUBMITTED,
        );
      } catch (error) {
        // Fail silently - analytics should not break signup flow
        this.logger.warn(`Failed to record funnel events: ${(error as Error).message}`);
      }
    }

    return {
      success: true,
      id: participant.id,
      email: participant.email,
      position: participant.position,
      referralCode: participant.referralCode,
      referralCount: participant.referralCount,
      referralLink,
      signupStatus: participant.signupStatus,
      requireEmailVerification: true, // Always required
    };
  }

  // ── Referral Messages ─────────────────────────────────────
  async getReferralMessages(id: string) {
    const messages = await this.prisma.participantReferralMessage.findUnique({
      where: { participantId: id },
      select: { twitter: true, linkedin: true, whatsapp: true }
    });
    return { success: true, data: messages };
  }

  async regenerateReferralMessages(id: string) {
    await this.aiTasksQueue.add(
      'generate-referral-messages',
      { participantId: id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      },
    );
    return { success: true, message: 'Regeneration queued' };
  }

  // ── Signup Progress ───────────────────────────────────────
  async updateSignupProgress(id: string, dto: import('./dto/update-signup-progress.dto').UpdateSignupProgressDto) {
    const participant = await this.prisma.participant.findUnique({
      where: { id },
      include: { waitlist: { include: { signupConfig: true } } },
    });

    if (!participant) {
      throw new NotFoundException('PARTICIPANT_NOT_FOUND');
    }

    if (participant.signupStatus === 'COMPLETED') {
      return { success: true, data: participant };
    }

    const { customFields, completeStep, sessionId } = dto;
    let newStatus = participant.signupStatus;
    let newFields = participant.customFields as Record<string, any> || {};

    if (customFields) {
      // Basic validation based on config
      const config = participant.waitlist.signupConfig;
      if (config && config.enabled) {
        const steps: any[] = Array.isArray(config.steps) ? config.steps : [];
        const questionStep = steps.find((s) => s.type === 'QUESTIONS' && s.enabled);
        if (questionStep && Array.isArray(questionStep.fields)) {
          CustomFieldValidator.validateAll(questionStep.fields, customFields);
        }
      }
      newFields = { ...newFields, ...customFields };
    }

    if (completeStep) {
      newStatus = 'COMPLETED' as typeof newStatus;
    }

    const updated = await this.prisma.participant.update({
      where: { id },
      data: {
        customFields: newFields,
        signupStatus: newStatus,
      },
    });

    if (completeStep && sessionId) {
      try {
        await this.analyticsService.recordFunnelEvent(
          participant.waitlistId,
          sessionId,
          FunnelEventType.QUESTIONS_COMPLETED,
        );
        await this.analyticsService.recordFunnelEvent(
          participant.waitlistId,
          sessionId,
          FunnelEventType.SIGNUP_COMPLETED,
        );
      } catch (e) {
        this.logger.warn(`Failed to record funnel events: ${(e as Error).message}`);
      }
    }

    return { success: true, data: updated };
  }

  // ── Skip the Line Status ────────────────────────────────────
  async getSkipLineStatus(participantId: string, waitlistId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        waitlist: {
          select: {
            id: true,
            skipLineEnabled: true,
            skipLinePrice: true,
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.waitlistId !== waitlistId) {
      throw new BadRequestException('Participant does not belong to this waitlist');
    }

    // Check for existing successful payment
    const existingPayment = await this.prisma.monetizationPayment.findFirst({
      where: {
        participantId,
        waitlistId,
        paymentType: 'SKIP_LINE',
        status: 'SUCCEEDED',
      },
    });

    return {
      success: true,
      data: {
        eligible: !participant.hasSkipLinePriority && !existingPayment,
        hasPriority: participant.hasSkipLinePriority,
        waitlist: {
          skipLineEnabled: participant.waitlist.skipLineEnabled,
          skipLinePrice: participant.waitlist.skipLinePrice,
        },
        position: participant.position,
      },
    };
  }

  async getPreOrderStatus(participantId: string, waitlistId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        waitlist: {
          select: {
            id: true,
            preOrderDepositEnabled: true,
            preOrderDepositAmount: true,
            preOrderDepositDescription: true,
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.waitlistId !== waitlistId) {
      throw new BadRequestException('Participant does not belong to this waitlist');
    }

    // Check for existing paid deposit
    const existingDeposit = await this.prisma.preOrderDeposit.findFirst({
      where: {
        participantId,
        waitlistId,
        status: 'PAID',
      },
    });

    return {
      success: true,
      data: {
        eligible: !existingDeposit,
        hasPaid: !!existingDeposit,
        waitlist: {
          preOrderDepositEnabled: participant.waitlist.preOrderDepositEnabled,
          preOrderDepositAmount: participant.waitlist.preOrderDepositAmount,
          preOrderDepositDescription: participant.waitlist.preOrderDepositDescription,
        },
      },
    };
  }
}
