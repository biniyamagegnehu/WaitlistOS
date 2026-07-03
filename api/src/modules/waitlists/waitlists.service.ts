import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Injectable()
export class WaitlistsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWaitlistDto: CreateWaitlistDto, userId: string) {
    const founder = await this.prisma.founder.findUnique({
      where: { userId },
    });

    if (!founder) {
      throw new NotFoundException('Founder profile not found');
    }

    return this.prisma.waitlist.create({
      data: {
        ...createWaitlistDto,
        founderId: founder.id,
      },
    });
  }

  async findOne(slug: string) {
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug },
    });
    
    if (!waitlist) {
      throw new NotFoundException(`Waitlist with slug ${slug} not found`);
    }
    
    return waitlist;
  }
}
