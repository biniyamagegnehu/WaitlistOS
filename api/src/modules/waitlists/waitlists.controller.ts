import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { WaitlistsService } from './waitlists.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../../common/decorators/public.decorator';

@Controller('waitlists')
export class WaitlistsController {
  constructor(private readonly waitlistsService: WaitlistsService) {}

  @Post()
  create(
    @Body() createWaitlistDto: CreateWaitlistDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.waitlistsService.create(createWaitlistDto, user.userId);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.waitlistsService.findOne(slug);
  }
}
