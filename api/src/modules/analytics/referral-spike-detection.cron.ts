import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferralSpikeDetectionCron {
  private readonly logger = new Logger(ReferralSpikeDetectionCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSpikeDetection() {
    this.logger.log('Running referral spike detection cron job...');
    try {
      await this.detectReferralSpikes();
    } catch (error: any) {
      this.logger.error(`Error during referral spike detection: ${error.message}`, error.stack);
    }
  }

  async detectReferralSpikes() {
    this.logger.log('Starting referral spike detection...');

    // Look back 7 days for new referred signups to detect spikes
    const lookbackDays = 7;
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    // Get all waitlists with referred signups in the lookback period
    const waitlistIds = await this.prisma.participant.findMany({
      where: {
        referredById: { not: null },
        createdAt: { gte: lookbackDate },
      },
      select: { waitlistId: true },
      distinct: ['waitlistId'],
    });

    for (const { waitlistId } of waitlistIds) {
      await this.detectSpikesForWaitlist(waitlistId, lookbackDate);
    }

    this.logger.log(`Completed spike detection for ${waitlistIds.length} waitlists`);
  }

  private async detectSpikesForWaitlist(waitlistId: string, since: Date) {
    // Get all referrers with referred signups in the lookback period
    const referrers = await this.prisma.participant.findMany({
      where: {
        waitlistId,
        referredById: { not: null },
        createdAt: { gte: since },
      },
      select: { referredById: true },
      distinct: ['referredById'],
    });

    for (const { referredById } of referrers) {
      if (!referredById) continue;
      await this.detectSpikesForReferrer(waitlistId, referredById, since);
    }
  }

  private async detectSpikesForReferrer(waitlistId: string, referrerId: string, since: Date) {
    // Get all referred signups for this referrer, sorted by time
    const signups = await this.prisma.participant.findMany({
      where: {
        waitlistId,
        referredById: referrerId,
        createdAt: { gte: since },
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (signups.length < 5) {
      return; // Not enough signups for a spike
    }

    // Detect spikes using sliding window approach
    const spikes = this.detectSpikesInSignupSequence(signups);

    // Merge overlapping spikes
    const mergedSpikes = this.mergeOverlappingSpikes(spikes);

    // Create or update spike records
    for (const spike of mergedSpikes) {
      await this.upsertReferralSpike(waitlistId, referrerId, spike);
    }
  }

  /**
   * Detect spikes using a sliding window approach
   * A spike is 5+ signups within 1 hour
   */
  private detectSpikesInSignupSequence(signups: Array<{ id: string; createdAt: Date }>) {
    const spikes: Array<{ startAt: Date; endAt: Date; signupCount: number }> = [];
    const oneHourMs = 60 * 60 * 1000;

    for (let i = 0; i < signups.length; i++) {
      const startSignup = signups[i];
      
      // Find how many signups occur within 1 hour of this start
      let count = 1;
      let endIndex = i;
      
      for (let j = i + 1; j < signups.length; j++) {
        const timeDiff = signups[j].createdAt.getTime() - startSignup.createdAt.getTime();
        if (timeDiff <= oneHourMs) {
          count++;
          endIndex = j;
        } else {
          break;
        }
      }

      if (count >= 5) {
        spikes.push({
          startAt: startSignup.createdAt,
          endAt: signups[endIndex].createdAt,
          signupCount: count,
        });
        
        // Skip ahead to avoid redundant checks
        i = endIndex;
      }
    }

    return spikes;
  }

  /**
   * Merge overlapping spike windows into single spikes
   * This prevents duplicate markers for the same viral event
   */
  private mergeOverlappingSpikes(spikes: Array<{ startAt: Date; endAt: Date; signupCount: number }>) {
    if (spikes.length === 0) return [];

    // Sort by start time
    const sorted = [...spikes].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    const merged: Array<{ startAt: Date; endAt: Date; signupCount: number }> = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      // Check if windows overlap (current start is within or adjacent to last window)
      const oneHourMs = 60 * 60 * 1000;
      const overlap = current.startAt.getTime() <= last.endAt.getTime() + oneHourMs;

      if (overlap) {
        // Merge: extend end time and update count
        last.endAt = current.endAt.getTime() > last.endAt.getTime() ? current.endAt : last.endAt;
        last.signupCount = Math.max(last.signupCount, current.signupCount);
      } else {
        // No overlap, add as new spike
        merged.push(current);
      }
    }

    return merged;
  }

  private async upsertReferralSpike(
    waitlistId: string,
    referrerId: string,
    spike: { startAt: Date; endAt: Date; signupCount: number },
  ) {
    // Check for existing spike that overlaps with this one
    const oneHourMs = 60 * 60 * 1000;
    const existingSpike = await this.prisma.referralSpike.findFirst({
      where: {
        waitlistId,
        referrerParticipantId: referrerId,
        OR: [
          {
            // Existing spike starts within our window
            startAt: {
              gte: new Date(spike.startAt.getTime() - oneHourMs),
              lte: new Date(spike.endAt.getTime() + oneHourMs),
            },
          },
          {
            // Existing spike ends within our window
            endAt: {
              gte: new Date(spike.startAt.getTime() - oneHourMs),
              lte: new Date(spike.endAt.getTime() + oneHourMs),
            },
          },
        ],
      },
    });

    if (existingSpike) {
      // Update existing spike to merge
      await this.prisma.referralSpike.update({
        where: { id: existingSpike.id },
        data: {
          startAt: spike.startAt.getTime() < existingSpike.startAt.getTime() ? spike.startAt : existingSpike.startAt,
          endAt: spike.endAt.getTime() > existingSpike.endAt.getTime() ? spike.endAt : existingSpike.endAt,
          signupCount: Math.max(existingSpike.signupCount, spike.signupCount),
        },
      });
    } else {
      // Create new spike
      await this.prisma.referralSpike.create({
        data: {
          waitlistId,
          referrerParticipantId: referrerId,
          startAt: spike.startAt,
          endAt: spike.endAt,
          signupCount: spike.signupCount,
        },
      });
    }
  }

  /**
   * Backfill historical referral spikes for a specific waitlist
   * This can be called manually to detect spikes from historical data
   */
  async backfillReferralSpikes(waitlistId: string, daysBack: number = 30) {
    this.logger.log(`Starting backfill for referral spikes for waitlist ${waitlistId}...`);
    
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    // Clear existing spikes for this waitlist to avoid duplicates
    await this.prisma.referralSpike.deleteMany({
      where: { waitlistId },
    });

    // Re-detect from scratch
    await this.detectSpikesForWaitlist(waitlistId, since);
    
    this.logger.log(`Backfill completed for referral spikes for waitlist ${waitlistId}`);
  }
}
