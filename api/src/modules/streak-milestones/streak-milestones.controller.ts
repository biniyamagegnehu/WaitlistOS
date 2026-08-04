import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { StreakMilestonesService } from './streak-milestones.service';
import { CreateStreakMilestoneDto } from './dto/create-streak-milestone.dto';
import { UpdateStreakMilestoneDto } from './dto/update-streak-milestone.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('waitlists/:waitlistId/streak-milestones')
export class StreakMilestonesController {
  constructor(private readonly streakMilestonesService: StreakMilestonesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('waitlistId') waitlistId: string,
    @Body() dto: CreateStreakMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.streakMilestonesService.create(waitlistId, user.userId, dto);
  }

  @Get()
  findAll(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.streakMilestonesService.findAll(waitlistId, user.userId);
  }

  @Get('analytics')
  getAnalytics(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.streakMilestonesService.getAnalytics(waitlistId, user.userId);
  }

  @Patch(':id')
  update(
    @Param('waitlistId') waitlistId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStreakMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.streakMilestonesService.update(id, waitlistId, user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('waitlistId') waitlistId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.streakMilestonesService.remove(id, waitlistId, user.userId);
  }
}
