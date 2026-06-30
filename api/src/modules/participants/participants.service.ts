import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createParticipantDto: CreateParticipantDto) {
    const { waitlistId, email } = createParticipantDto;
    
    // Check if participant already exists to prevent unique constraint error
    const existing = await this.prisma.participant.findUnique({
      where: {
        waitlistId_email: { waitlistId, email }
      }
    });

    if (existing) {
      throw new ConflictException('Participant already exists on this waitlist');
    }

    // Temporary position calculation
    const count = await this.prisma.participant.count({
      where: { waitlistId }
    });
    
    const position = count + 1;
    
    // Temporary referral code to satisfy schema
    const referralCode = randomBytes(4).toString('hex');

    return this.prisma.participant.create({
      data: {
        waitlistId,
        email,
        position,
        referralCode,
      },
    });
  }
}
