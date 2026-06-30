import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Injectable()
export class WaitlistsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWaitlistDto: CreateWaitlistDto) {
    return this.prisma.waitlist.create({
      data: createWaitlistDto,
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
