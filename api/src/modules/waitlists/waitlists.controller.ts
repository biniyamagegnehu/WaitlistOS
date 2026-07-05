import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WaitlistsService } from './waitlists.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../../common/decorators/public.decorator';

@Controller('waitlists')
export class WaitlistsController {
  constructor(private readonly waitlistsService: WaitlistsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createWaitlistDto: CreateWaitlistDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.waitlistsService.create(createWaitlistDto, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWaitlistDto: UpdateWaitlistDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.waitlistsService.update(id, updateWaitlistDto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.waitlistsService.remove(id, user.userId);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.waitlistsService.findOne(slug);
  }
}
