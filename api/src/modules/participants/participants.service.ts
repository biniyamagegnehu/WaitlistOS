import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

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
    });
    if (!waitlist) {
      throw new NotFoundException('WAITLIST_NOT_FOUND');
    }

    // 2. Duplicate email guard — 409
    const existing = await this.prisma.participant.findUnique({
      where: { waitlistId_email: { waitlistId: waitlist.id, email } },
    });
    if (existing) {
      throw new ConflictException('EMAIL_ALREADY_JOINED');
    }

    // 3. Resolve referrer (if code provided)
    let referredById: string | null = null;
    if (incomingRef) {
      const referrer = await this.prisma.participant.findUnique({
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

      referredById = referrer.id;
    }

    // 4. Position = current count + 1
    const count = await this.prisma.participant.count({
      where: { waitlistId: waitlist.id },
    });
    const position = count + 1;

    // 5. Generate unique referral code for this new participant
    const newReferralCode = await this.generateUniqueCode();

    // 6. Create participant
    const participant = await this.prisma.participant.create({
      data: {
        waitlistId: waitlist.id,
        email,
        position,
        referralCode: newReferralCode,
        ...(referredById ? { referredById } : {}),
      },
    });

    // 7. Build referral link
    const referralLink = `/w/${waitlistSlug}?ref=${participant.referralCode}`;

    return {
      success: true,
      email: participant.email,
      position: participant.position,
      referralCode: participant.referralCode,
      referralLink,
    };
  }
}
