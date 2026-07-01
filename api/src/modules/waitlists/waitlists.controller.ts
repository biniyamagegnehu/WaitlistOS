import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { WaitlistsService } from './waitlists.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('waitlists')
export class WaitlistsController {
  constructor(private readonly waitlistsService: WaitlistsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createWaitlistDto: CreateWaitlistDto, @Req() req: any) {
    createWaitlistDto.founderId = req.user.userId;
    return this.waitlistsService.create(createWaitlistDto);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.waitlistsService.findOne(slug);
  }
}
