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

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('emails') private readonly emailsQueue: Queue,
    private readonly paymentService: PaymentService,
  ) {}

  // ── Referral code generator ──────────────────────────────
  // Produces a 6-char URL-safe code, retries on collision
  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(4).toString('base64url').slice(0, 6);
      const clash = await this.prisma.participant.findUnique({
        where: { referralCode: code },
      });
      if (!clash) return code;
    }
    // Fallback: longer code essentially never collides
    return randomBytes(8).toString('hex');
  }

  // ── Create participant ────────────────────────────────────
  async create(dto: CreateParticipantDto) {
    const { waitlistSlug, email, referralCode: incomingRef } = dto;

    // 1. Resolve waitlist by slug — 404 if not found
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug: waitlistSlug },
      include: { founder: true },
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

      // Must belong to the same waitlist
      if (referrer.waitlistId !== waitlist.id) {
        throw new BadRequestException('INVALID_REFERRAL');
      }

      // Self-referral guard
      if (referrer.email === email) {
        throw new BadRequestException('SELF_REFERRAL');
      }
    }

    // Generate unique referral code for this new participant
    const newReferralCode = await this.generateUniqueCode();

    // 4. Transaction to create participant and swap positions with SKIP LOCKED retry logic
    const maxRetries = 5;
    const baseRetryDelay = 100; // ms

    let participant;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        participant = await this.prisma.$transaction(async (tx) => {
          // Try to acquire lock with SKIP LOCKED - skips if row is locked by another transaction
          const result = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM waitlists
            WHERE id = ${waitlist.id}
            FOR UPDATE SKIP LOCKED
            LIMIT 1
          `;

          // If no row was returned, it means the row is locked by another transaction
          if (!result || result.length === 0) {
            throw new Error('ROW_LOCKED');
          }

          const count = await tx.participant.count({
            where: { waitlistId: waitlist.id },
          });
          const position = count + 1;

          const p = await tx.participant.create({
            data: {
              waitlistId: waitlist.id,
              email,
              position,
              referralCode: newReferralCode,
              ...(referrer ? { referredById: referrer.id } : {}),
            },
          });

          if (referrer) {
            // Increment referral count
            const updatedReferrer = await tx.participant.update({
              where: { id: referrer.id },
              data: { referralCount: { increment: 1 } },
            });

            // Swap positions if referrer can move up
            if (updatedReferrer.position > 1) {
              const targetPosition = updatedReferrer.position - 1;

              // Find the person currently at the target position
              const personToDemote = await tx.participant.findFirst({
                where: {
                  waitlistId: waitlist.id,
                  position: targetPosition,
                },
              });

              if (personToDemote) {
                // Move the person ahead down by 1
                await tx.participant.update({
                  where: { id: personToDemote.id },
                  data: { position: updatedReferrer.position },
                });

                // Move the referrer up by 1
                await tx.participant.update({
                  where: { id: referrer.id },
                  data: { position: targetPosition },
                });
              }
            }
          }

          return p;
        });

        // If successful, break out of retry loop
        break;
      } catch (error) {
        // If the error is ROW_LOCKED and we haven't exhausted retries, wait and retry
        if (error instanceof Error && error.message === 'ROW_LOCKED' && attempt < maxRetries - 1) {
          // Exponential backoff: 100ms, 200ms, 400ms, 800ms
          const delay = baseRetryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // If it's a different error or we've exhausted retries, throw it
        throw error;
      }
    }

    // 5. Build referral link (OG-enabled share URL)
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

    return {
      success: true,
      email: participant.email,
      position: participant.position,
      referralCode: participant.referralCode,
      referralCount: participant.referralCount,
      referralLink,
    };
  }
}
