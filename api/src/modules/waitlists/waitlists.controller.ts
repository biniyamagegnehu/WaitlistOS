import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { WaitlistsService } from './waitlists.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';

@Controller('waitlists')
export class WaitlistsController {
  constructor(private readonly waitlistsService: WaitlistsService) {}

  @Post()
  create(@Body() createWaitlistDto: CreateWaitlistDto) {
    return this.waitlistsService.create(createWaitlistDto);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.waitlistsService.findOne(slug);
  }
}
