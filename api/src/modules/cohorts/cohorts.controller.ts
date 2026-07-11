import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CohortsService } from './cohorts.service';
import { OpenGatesDto } from './dto/open-gates.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('cohorts')
@UseGuards(AccessTokenGuard)
export class CohortsController {
  constructor(private readonly cohortsService: CohortsService) {}

  @Post('open-gates')
  async openGates(
    @Body() dto: OpenGatesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.cohortsService.openGates({
      waitlistId: dto.waitlistId,
      founderUserId: user.userId,
      batchSize: dto.batchSize,
    });

    return {
      success: true,
      message: `Successfully invited ${result.invitedCount} participants`,
      data: result,
    };
  }

  @Get('waitlist/:waitlistId/analytics')
  async getAnalytics(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const analytics = await this.cohortsService.getAnalytics(
      waitlistId,
      user.userId,
    );

    return {
      success: true,
      data: analytics,
    };
  }

  @Get('waitlist/:waitlistId')
  async getCohorts(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const cohorts = await this.cohortsService.getCohorts(waitlistId, user.userId);

    return {
      success: true,
      data: cohorts,
    };
  }

  @Post('participants/:participantId/accessed')
  async markAsAccessed(
    @Param('participantId') participantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.cohortsService.markAsAccessed(participantId, user.userId);

    return {
      success: true,
      message: 'Participant marked as accessed',
    };
  }
}
