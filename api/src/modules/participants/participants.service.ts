import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateParticipantDto) {
    const { waitlistSlug, email } = dto;

    // 1. Resolve waitlist by slug — 404 if not found
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug: waitlistSlug },
    });

    if (!waitlist) {
      throw new NotFoundException('WAITLIST_NOT_FOUND');
    }

    // 2. Check for duplicate email inside this waitlist — 409 if duplicate
    const existing = await this.prisma.participant.findUnique({
      where: {
        waitlistId_email: { waitlistId: waitlist.id, email },
      },
    });

    if (existing) {
      throw new ConflictException('EMAIL_ALREADY_JOINED');
    }

    // 3. Assign position: current count + 1
    const count = await this.prisma.participant.count({
      where: { waitlistId: waitlist.id },
    });

    const position = count + 1;

    // 4. Temporary referral code to satisfy schema NOT NULL constraint
    const referralCode = randomBytes(8).toString('hex');

    // 5. Create participant
    const participant = await this.prisma.participant.create({
      data: {
        waitlistId: waitlist.id,
        email,
        position,
        referralCode,
      },
    });

    // 6. Return clean response
    return {
      success: true,
      email: participant.email,
      position: participant.position,
    };
  }
}
