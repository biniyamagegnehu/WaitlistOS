import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { WaitlistSignupConfigService } from './waitlist-signup-config.service';
import { UpdateWaitlistSignupConfigDto } from './dto/update-waitlist-signup-config.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('waitlists/:waitlistId/signup-config')
export class WaitlistSignupConfigController {
  constructor(private readonly service: WaitlistSignupConfigService) {}

  @Get()
  getConfig(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getConfig(waitlistId, user.userId);
  }

  @Patch()
  updateConfig(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWaitlistSignupConfigDto,
  ) {
    return this.service.updateConfig(waitlistId, user.userId, dto);
  }
}
