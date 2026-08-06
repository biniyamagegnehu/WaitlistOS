import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { randomBytes } from 'crypto';
import { PaymentService } from '../payments/payment.service';
import { Prisma } from '@prisma/client';
import { computeEffectiveStreak } from '../../lib/streak-utils';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('emails') private readonly emailsQueue: Queue,
    @InjectQueue('ai-tasks') private readonly aiTasksQueue: Queue,
    private readonly paymentService: PaymentService,
  ) {}

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
  //   1. (referralCount + positionBoostBonus) DESC  — more referrals = higher priority
  //   2. createdAt ASC                              — earlier joiner wins on tie
  // Then assigns sequential positions 1, 2, 3... and bulk-updates any that changed.
  private async rerankParticipants(
    waitlistId: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "participants"
        SET position = ranked.new_pos
        FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (
                   ORDER BY ("referralCount" + COALESCE("positionBoostBonus", 0)) DESC, "createdAt" ASC
                 ) as new_pos
          FROM "participants"
          WHERE "waitlistId" = ${waitlistId}
        ) as ranked
        WHERE "participants".id = ranked.id
          AND "participants".position IS DISTINCT FROM ranked.new_pos;
      `
    );
  }

  // ── Create participant ────────────────────────────────────
  async create(dto: CreateParticipantDto) {
    const { waitlistSlug, email, referralCode: incomingRef } = dto;

    // 1. Resolve waitlist by slug — 404 if not found
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug: waitlistSlug },
      include: { founder: true, streakMilestones: { orderBy: { days: 'asc' } } },
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
      throw new ConflictException('EMAIL_ALREADY_JOINED');
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

          // New participant starts at the bottom (count + 1)
          const count = await tx.participant.count({
            where: { waitlistId: waitlist.id },
          });
          const initialPosition = count + 1;

          const p = await tx.participant.create({
            data: {
              waitlistId: waitlist.id,
              email,
              position: initialPosition,
              referralCode: newReferralCode,
              ...(referrer ? { referredById: referrer.id } : {}),
            },
          });

          if (referrer) {
            // Increment referrer's referral count
            let updatedReferrer = await tx.participant.update({
              where: { id: referrer.id },
              data: { referralCount: { increment: 1 } },
            });

            // Check for reward milestones
            const matchingRewards = await tx.reward.findMany({
              where: {
                waitlistId: waitlist.id,
                milestone: updatedReferrer.referralCount,
              },
            });

            for (const reward of matchingRewards) {
              // Unlock reward record
              await tx.participantReward.create({
                data: {
                  participantId: referrer.id,
                  rewardId: reward.id,
                },
              });

              // POSITION_BOOST: add virtual bonus to effective rank score
              if (
                reward.type === 'POSITION_BOOST' &&
                reward.value &&
                reward.value > 0
              ) {
                updatedReferrer = await tx.participant.update({
                  where: { id: referrer.id },
                  data: { positionBoostBonus: { increment: reward.value } },
                });
              }
            }

            // ── Double-Sided Rewards ─────────────────────────────
            if (waitlist.doubleSidedRewardsEnabled) {
              // 1. Give referrer their bonus
              updatedReferrer = await tx.participant.update({
                where: { id: referrer.id },
                data: { positionBoostBonus: { increment: waitlist.referrerRankingBonus } },
              });

              // 2. Give new participant their bonus
              await tx.participant.update({
                where: { id: p.id },
                data: { positionBoostBonus: { increment: waitlist.newParticipantRankingBonus } },
              });

              // 3. Update Waitlist analytics counters
              await tx.waitlist.update({
                where: { id: waitlist.id },
                data: {
                  doubleSidedRewardsGranted: { increment: 1 },
                  totalReferrerRankingBonusAwarded: { increment: waitlist.referrerRankingBonus },
                  totalNewParticipantRankingBonusAwarded: { increment: waitlist.newParticipantRankingBonus },
                },
              });
            }

            // ── Streak Bonuses ────────────────────────────────────
            if (waitlist.streakBonusesEnabled && waitlist.streakMilestones.length > 0) {
              // Fetch the referrer with streak fields (fresh from DB inside tx)
              const freshReferrer = await tx.participant.findUniqueOrThrow({
                where: { id: referrer.id },
                include: { participantStreakRewards: true },
              });

              // Compute the effective current streak (accounting for lapsed days)
              const effectiveStreak = computeEffectiveStreak(
                freshReferrer.currentStreak,
                freshReferrer.lastSuccessfulReferralAt,
              );

              // Determine how to update the streak
              const now = new Date();
              const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
              const lastRef = freshReferrer.lastSuccessfulReferralAt;
              const lastRefDayUTC = lastRef
                ? new Date(Date.UTC(lastRef.getUTCFullYear(), lastRef.getUTCMonth(), lastRef.getUTCDate()))
                : null;

              const alreadyReferredToday = lastRefDayUTC?.getTime() === todayUTC.getTime();

              let newStreak: number;
              if (alreadyReferredToday) {
                // Already got credit for today — don't double-count
                newStreak = effectiveStreak;
              } else if (effectiveStreak === 0) {
                // Starting fresh or lapsed
                newStreak = 1;
              } else {
                // Continuing streak
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

              // Check if any milestone is hit for the first time
              const alreadyUnlockedIds = new Set(
                freshReferrer.participantStreakRewards.map((r) => r.streakMilestoneId),
              );

              for (const milestone of waitlist.streakMilestones) {
                if (newStreak >= milestone.days && !alreadyUnlockedIds.has(milestone.id)) {
                  // Unlock the milestone
                  await tx.participantStreakReward.create({
                    data: {
                      participantId: referrer.id,
                      streakMilestoneId: milestone.id,
                    },
                  });

                  // Award positionBoostBonus for POSITION_BOOST type
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
            if (waitlist.teamReferralsEnabled && referrer.teamId) {
              const teamAgg = await tx.participant.aggregate({
                where: { teamId: referrer.teamId },
                _sum: { referralCount: true },
              });
              const teamTotal = teamAgg._sum.referralCount || 0;

              const reachedMilestones = await tx.teamRewardMilestone.findMany({
                where: {
                  waitlistId: waitlist.id,
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

                    if (
                      milestone.type === 'POSITION_BOOST' &&
                      milestone.value &&
                      milestone.value > 0
                    ) {
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

            // Rerank all participants based on new referral counts / bonuses
            await this.rerankParticipants(waitlist.id, tx);

            // Re-fetch the created participant with its final position
            const finalParticipant = await tx.participant.findUniqueOrThrow({
              where: { id: p.id },
            });
            return finalParticipant;
          }

          // No referrer: rerank still runs to assign a clean sequential position
          await this.rerankParticipants(waitlist.id, tx);

          const finalParticipant = await tx.participant.findUniqueOrThrow({
            where: { id: p.id },
          });
          return finalParticipant;
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

    // 6. Queue Welcome Email
    await this.emailsQueue.add(
      'send-welcome-email',
      {
        email: participant.email,
        waitlist: waitlist.name,
        position: participant.position,
        referralLink,
      },
      {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    // 7. Queue AI Referral Messages
    await this.aiTasksQueue.add(
      'generate-referral-messages',
      { participantId: participant.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      },
    );

    return {
      success: true,
      id: participant.id,
      email: participant.email,
      position: participant.position,
      referralCode: participant.referralCode,
      referralCount: participant.referralCount,
      referralLink,
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
}
