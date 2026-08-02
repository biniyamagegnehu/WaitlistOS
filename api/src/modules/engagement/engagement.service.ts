import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { RiskLevel } from '@prisma/client';

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
  ) {}

  /**
   * Evaluates all participants to determine their dropout risk score.
   * Updates their engagement status and queues re-engagement emails if needed.
   */
  async evaluateAllParticipants() {
    this.logger.log('Starting daily participant engagement evaluation...');

    let skip = 0;
    const batchSize = 500;
    let hasMore = true;

    let evaluatedCount = 0;
    let emailsQueuedCount = 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    while (hasMore) {
      // Fetch batch of participants, including waitlist details for the referral link
      const participants = await this.prisma.participant.findMany({
        skip,
        take: batchSize,
        include: {
          waitlist: true,
          engagement: true,
        },
      });

      if (participants.length === 0) {
        hasMore = false;
        break;
      }

      for (const participant of participants) {
        const { id, referralCount, createdAt, lastPositionUpdatedAt, engagement, waitlist, email, position, referralCode } = participant;
        
        let score = 0;

        // Rule 1: Referral Count
        if (referralCount === 0) {
          score += 50;
        } else if (referralCount >= 1 && referralCount <= 2) {
          score += 20;
        } // 3+ is 0 points

        // Rule 2: Days Since Signup
        const daysSinceSignup = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceSignup > 30) {
          score += 40;
        } else if (daysSinceSignup > 14) {
          score += 30;
        }

        // Rule 3: Rank Movement (No position change in last 7 days)
        if (lastPositionUpdatedAt < sevenDaysAgo) {
          score += 20;
        }

        // Determine Risk Level
        let riskLevel: RiskLevel = RiskLevel.HEALTHY;
        if (score > 60) {
          riskLevel = RiskLevel.HIGH_RISK;
        } else if (score > 30) {
          riskLevel = RiskLevel.MEDIUM_RISK;
        }

        // Update or Create ParticipantEngagement
        const now = new Date();
        const lastEmailedAt = engagement?.lastEmailedAt;
        let shouldEmail = false;

        // If HIGH_RISK, check if we need to email them
        // Send maximum 1 email per 7 days
        if (riskLevel === RiskLevel.HIGH_RISK) {
          if (!lastEmailedAt || lastEmailedAt < sevenDaysAgo) {
            shouldEmail = true;
          }
        }

        await this.prisma.participantEngagement.upsert({
          where: { participantId: id },
          create: {
            participantId: id,
            riskScore: score,
            riskLevel,
            lastEvaluatedAt: now,
            lastEmailedAt: shouldEmail ? now : lastEmailedAt,
          },
          update: {
            riskScore: score,
            riskLevel,
            lastEvaluatedAt: now,
            lastEmailedAt: shouldEmail ? now : lastEmailedAt,
          },
        });

        // Store log
        await this.prisma.participantEngagementLog.create({
          data: {
            participantId: id,
            riskScore: score,
            riskLevel,
            evaluatedAt: now,
          },
        });

        if (shouldEmail) {
          const referralLink = `${process.env.FRONTEND_URL}/r/${referralCode}`;
          // Rotate templates based on random or days since signup
          const templateId = (daysSinceSignup % 3) + 1;
          this.emailsService.queueReengagementEmail(email, templateId, position, referralLink);
          emailsQueuedCount++;
        }

        evaluatedCount++;
      }

      skip += batchSize;
    }

    this.logger.log(`Finished engagement evaluation. Evaluated ${evaluatedCount} participants. Queued ${emailsQueuedCount} emails.`);
  }
}
