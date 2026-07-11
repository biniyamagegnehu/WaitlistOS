import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('waitlists/:waitlistId/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('waitlistId') waitlistId: string,
    @Body() createRewardDto: CreateRewardDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rewardsService.create(waitlistId, user.userId, createRewardDto);
  }

  @Get()
  findAll(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rewardsService.findAll(waitlistId, user.userId);
  }

  @Get('analytics')
  getAnalytics(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rewardsService.getAnalytics(waitlistId, user.userId);
  }

  @Patch(':id')
  update(
    @Param('waitlistId') waitlistId: string,
    @Param('id') id: string,
    @Body() updateRewardDto: UpdateRewardDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rewardsService.update(id, waitlistId, user.userId, updateRewardDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('waitlistId') waitlistId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rewardsService.remove(id, waitlistId, user.userId);
  }
}
